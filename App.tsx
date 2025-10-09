
import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: The type for the 'bid' parameter was incorrect, changed from 'Bid' to 'BidValue'.
import { GameState, Card, PlayerPosition, GamePhase, Bid, GameMode, Difficulty, BidValue } from './types';
import { getInitialGameState, dealCards, getValidCards, getTrickWinner, calculateRoundScores, calculateTeamBids } from './services/gameLogic';
import { getAIBid, getAICardPlay } from './services/aiService';
import { playSound, getIsSoundEnabled, toggleSoundEnabled, initAudioContext } from './services/soundService';
import GameTable from './components/GameTable';
import BiddingModal from './components/BiddingModal';
import Scoreboard from './components/Scoreboard';
import GameOverModal from './components/GameOverModal';
import GameModeSelection from './components/GameModeSelection';
import Menu from './components/Menu';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [showBiddingModal, setShowBiddingModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showModeSelection, setShowModeSelection] = useState(true);
    const [backgroundClass, setBackgroundClass] = useState('bg-felt-green');
    const [isSoundEnabled, setIsSoundEnabled] = useState(getIsSoundEnabled());
    const timeoutsRef = useRef<number[]>([]);

    const handleToggleSound = () => {
        setIsSoundEnabled(toggleSoundEnabled());
    };

    const startNewRound = useCallback((currentState: GameState) => {
        playSound('cardShuffle');
        const dealerOrder: PlayerPosition[] = ['South', 'West', 'North', 'East'];
        const currentDealerIndex = dealerOrder.indexOf(currentState.dealer);
        const nextDealerIndex = (currentDealerIndex + 1) % 4;

        const newGameState = dealCards({
            ...currentState,
            round: currentState.round + 1,
            dealer: dealerOrder[nextDealerIndex],
            bids: [],
            tricks: [],
            currentTrick: [],
            spadesBroken: false,
            gamePhase: GamePhase.BIDDING,
        });
        const firstBidderIndex = (newGameState.players.findIndex(p => p.position === newGameState.dealer) + 1) % 4;
        newGameState.currentPlayerIndex = firstBidderIndex;
        
        newGameState.animation = { type: 'DEALING' };
        
        setGameState(newGameState);
    }, []);

    const startNewGame = useCallback(async (gameMode: GameMode, difficulty: Difficulty) => {
        await initAudioContext(); // Initialize and wait for audio context on first user action
        const initialState = getInitialGameState(gameMode, difficulty);
        setGameState(initialState);
        setShowGameOverModal(false);
        setShowModeSelection(false);
        startNewRound(initialState);
    }, [startNewRound]);

    const handlePlayerBid = (bid: BidValue) => {
        if (!gameState) return;
        playSound('bid');
        setShowBiddingModal(false);
        setGameState(prevState => {
            if (!prevState) return null;
            const newBids = [...prevState.bids, { player: prevState.players[prevState.currentPlayerIndex].position, bid }];
            let nextPlayerIndex = (prevState.currentPlayerIndex + 1) % 4;
            
            return {
                ...prevState,
                bids: newBids,
                currentPlayerIndex: nextPlayerIndex,
            };
        });
    };

    const handlePlayerCardPlay = (card: Card) => {
        if (!gameState || gameState.players[gameState.currentPlayerIndex].position !== 'South') return;

        const validCards = getValidCards(
            gameState.players[gameState.currentPlayerIndex].hand,
            gameState.currentTrick,
            gameState.spadesBroken
        );

        if (!validCards.some(vc => vc.suit === card.suit && vc.rank === card.rank)) {
            console.error("Invalid card played");
            return;
        }

        initiateCardPlayAnimation(card);
    };

    const initiateCardPlayAnimation = (card: Card) => {
        playSound('cardPlay');
        setGameState(prevState => {
            if (!prevState) return null;
            const player = prevState.players[prevState.currentPlayerIndex];
            const newHand = player.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
            const newPlayers = [...prevState.players];
            newPlayers[prevState.currentPlayerIndex] = { ...player, hand: newHand };
            const spadesBroken = prevState.spadesBroken || card.suit === 'S';
            const justBrokeSpades = !prevState.spadesBroken && spadesBroken;

            if (justBrokeSpades) {
                playSound('spadesBroken');
            }

            const nextState: GameState = {
                ...prevState,
                players: newPlayers,
                spadesBroken,
                animation: {
                    type: 'CARD_PLAYED',
                    trick: { player: player.position, card },
                },
            };
            
            if (justBrokeSpades) {
                nextState.showSpadesBroken = true;
            }

            return nextState;
        });
    };

    const handleExitToMenu = () => {
        setGameState(null);
        setShowModeSelection(true);
        setShowBiddingModal(false);
        setShowGameOverModal(false);
    };

    // Main Game Loop Effect
    useEffect(() => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
    
        const schedule = (callback: () => void, delay: number) => {
            const timerId = window.setTimeout(callback, delay);
            timeoutsRef.current.push(timerId);
        };
        
        if (gameState?.showSpadesBroken) {
            schedule(() => {
                setGameState(prevState => prevState ? { ...prevState, showSpadesBroken: false } : null);
            }, 1500);
        }

        if (!gameState) return;

        if (gameState.gamePhase === GamePhase.GAME_OVER) {
            setShowGameOverModal(true);
            return;
        }
        
        if (gameState.gamePhase === GamePhase.SCORING && !gameState.animation) {
            const oldTeams = gameState.teams.map(t => ({...t}));
            let newState = calculateRoundScores(gameState);
    
            const updatedTeamNames = newState.teams
                .filter(newTeam => {
                    const oldTeam = oldTeams.find(t => t.name === newTeam.name);
                    return oldTeam && (oldTeam.score !== newTeam.score || oldTeam.bags !== newTeam.bags);
                })
                .map(t => t.name);

            // Determine and play sounds for the player's team
            const playerTeamName = gameState.players.find(p => p.position === 'South')?.team;
            if (playerTeamName && updatedTeamNames.includes(playerTeamName)) {
                const newPlayerTeam = newState.teams.find(t => t.name === playerTeamName)!;
                const oldPlayerTeam = oldTeams.find(t => t.name === playerTeamName)!;
                const scoreDelta = newPlayerTeam.score - oldPlayerTeam.score;
    
                if (scoreDelta < -90) { 
                    playSound('bagPenalty');
                } else if (scoreDelta < 0) {
                    playSound('bidFailure');
                } else { 
                    playSound('bidSuccess');
                }
            }

            newState.animation = {
                type: 'SCORING',
                updatedTeams: updatedTeamNames
            };
            
            setGameState(newState);
            return;
        }

        if (gameState.animation?.type === 'SCORING') {
            schedule(() => {
                 const gameOver = gameState.teams.some(t => t.score >= 500 || t.score <= -200);
                if (gameOver) {
                    setGameState({ ...gameState, gamePhase: GamePhase.GAME_OVER, animation: undefined });
                } else {
                    startNewRound(gameState);
                }
            }, 2000);
            return;
        }

        if (gameState.animation?.type === 'DEALING') {
            const DEALING_ANIMATION_DURATION = 52 * 50 + 500;
            schedule(() => {
                setGameState(prevState => prevState ? { ...prevState, animation: undefined } : null);
            }, DEALING_ANIMATION_DURATION);
            return;
        }

        if (gameState.animation?.type === 'CARD_PLAYED') {
            const CARD_PLAY_ANIMATION_DURATION = 500;
            schedule(() => {
                setGameState(prevState => {
                    if (!prevState || !prevState.animation || prevState.animation.type !== 'CARD_PLAYED') return prevState;
                    const newCurrentTrick = [...prevState.currentTrick, prevState.animation.trick];

                    if (newCurrentTrick.length < 4) {
                        // Trick is not over, advance to the next player.
                        return {
                            ...prevState,
                            currentTrick: newCurrentTrick,
                            animation: undefined,
                            currentPlayerIndex: (prevState.currentPlayerIndex + 1) % 4,
                        };
                    } else {
                        // 4th card played, trick is complete. Resolve it now.
                        playSound('trickWin');
                        
                        const trickWinnerPosition = getTrickWinner(newCurrentTrick);
                        const winnerPlayer = prevState.players.find(p => p.position === trickWinnerPosition)!;
                        const winnerTeam = prevState.teams.find(t => t.name === winnerPlayer.team)!;
                        
                        const newTricks = [...prevState.tricks, newCurrentTrick];
                        const updatedTeams = prevState.teams.map(team => 
                            team.name === winnerTeam.name ? { ...team, tricksWon: team.tricksWon + 1 } : team
                        );
                        
                        const isRoundOver = newTricks.length === 13;
            
                        return { 
                            ...prevState, 
                            tricks: newTricks, 
                            teams: updatedTeams,
                            currentTrick: [], // Clear logical trick, animation will use the cards
                            gamePhase: isRoundOver ? GamePhase.SCORING : GamePhase.PLAYING,
                            animation: {
                                type: 'TRICK_WON',
                                winner: trickWinnerPosition,
                                cards: newCurrentTrick
                            },
                            currentPlayerIndex: prevState.players.findIndex(p => p.position === trickWinnerPosition),
                        };
                    }
                });
            }, CARD_PLAY_ANIMATION_DURATION);
            return;
        }

        if (gameState.animation?.type === 'TRICK_WON') {
            const TRICK_ANIMATION_DURATION = 1000;
            schedule(() => {
                setGameState(prevState => {
                    if (!prevState) return null;
                    return { ...prevState, animation: undefined };
                });
            }, TRICK_ANIMATION_DURATION);
            return;
        }
    }, [gameState, startNewRound]);


    // AI player actions
    useEffect(() => {
        if (!gameState || gameState.players[gameState.currentPlayerIndex].position === 'South' || gameState.animation) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        const timeoutId = setTimeout(() => {
            if (gameState.gamePhase === GamePhase.BIDDING) {
                if (gameState.bids.length < 4) {
                    const aiBid = getAIBid(currentPlayer, gameState);
                    setGameState(prevState => {
                        if (!prevState) return null;
                        const newBids = [...prevState.bids, { player: currentPlayer.position, bid: aiBid }];
                        let nextPlayerIndex = (prevState.currentPlayerIndex + 1) % 4;
                        return {
                            ...prevState,
                            bids: newBids,
                            currentPlayerIndex: nextPlayerIndex,
                        };
                    });
                }
            } else if (gameState.gamePhase === GamePhase.PLAYING) {
                const aiCard = getAICardPlay(currentPlayer, gameState);
                if (aiCard) {
                    initiateCardPlayAnimation(aiCard);
                } else {
                    console.error("AI was unable to select a card.");
                }
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [gameState, initiateCardPlayAnimation]);

    // Update team bids when all individual bids are in
    useEffect(() => {
        if (gameState && gameState.bids.length === 4 && gameState.gamePhase === GamePhase.BIDDING) {
            const teamsWithBids = calculateTeamBids(gameState);
            setGameState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    teams: teamsWithBids,
                    gamePhase: GamePhase.PLAYING
                };
            });
        }
    }, [gameState?.bids]);


    // Show bidding modal for human player
    useEffect(() => {
        if (gameState && gameState.gamePhase === GamePhase.BIDDING && gameState.players[gameState.currentPlayerIndex].position === 'South' && gameState.bids.find(b => b.player === 'South') === undefined) {
            setShowBiddingModal(true);
        } else {
            setShowBiddingModal(false);
        }
    }, [gameState?.currentPlayerIndex, gameState?.gamePhase, gameState?.bids]);


    if (showModeSelection) {
        return <GameModeSelection onModeSelect={startNewGame} />;
    }

    if (!gameState) {
        return <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">Loading game...</div>;
    }

    const southPlayer = gameState.players.find(p => p.position === 'South')!;

    return (
        <main className={`relative w-screen h-screen overflow-hidden ${backgroundClass} transition-colors duration-500`}>
            <div className="absolute inset-0 flex p-4 space-x-4">
                <div className="flex-grow h-full">
                    <GameTable gameState={gameState} onCardPlay={handlePlayerCardPlay} />
                </div>
                <div className="w-80 h-full flex-shrink-0">
                    <Scoreboard gameState={gameState} />
                </div>
            </div>
            {showBiddingModal && <BiddingModal player={southPlayer} onBid={handlePlayerBid} />}
            {showGameOverModal && <GameOverModal teams={gameState.teams} onNewGame={handleExitToMenu} />}
             <Menu 
                onExitGame={handleExitToMenu}
                onBackgroundChange={setBackgroundClass}
                isSoundEnabled={isSoundEnabled}
                onToggleSound={handleToggleSound}
            />
        </main>
    );
};

export default App;