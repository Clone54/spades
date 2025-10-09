import React from 'react';
import { GameState, Card, PlayerPosition, Player, Trick } from '../types';
import PlayerDisplay from './PlayerDisplay';
import CardDisplay from './CardDisplay';

interface GameTableProps {
    gameState: GameState;
    onCardPlay: (card: Card) => void;
}

const positionClasses: Record<PlayerPosition, string> = {
    South: 'bottom-0 left-0 w-full',
    West: 'top-1/2 -translate-y-1/2 left-4',
    North: 'top-4 left-1/2 -translate-x-1/2',
    East: 'top-1/2 -translate-y-1/2 right-4',
};

// Positions for cards played in the middle of the table, relative to their container.
const trickPositionClasses: Record<PlayerPosition, string> = {
    South: 'bottom-0 left-1/2 -translate-x-1/2',
    West: 'top-1/2 -translate-y-1/2 left-0',
    North: 'top-0 left-1/2 -translate-x-1/2',
    East: 'top-1/2 -translate-y-1/2 right-0',
};

const DealingAnimation: React.FC<{ dealer: PlayerPosition; players: Player[] }> = ({ dealer, players }) => {
    const dealerIndex = players.findIndex(p => p.position === dealer);
    const firstPlayerIndex = (dealerIndex + 1) % 4;

    const getDealAnimationClass = (playerIndex: number): string => {
        const player = players[playerIndex];
        switch (player.position) {
            case 'North': return 'animate-deal-to-north';
            case 'South': return 'animate-deal-to-south';
            case 'West': return 'animate-deal-to-west';
            case 'East': return 'animate-deal-to-east';
            default: return '';
        }
    };

    return (
        <>
            {/* The deck */}
            <div className="absolute">
                <CardDisplay isFaceUp={false} />
            </div>
            {/* The animating cards */}
            {Array.from({ length: 52 }).map((_, i) => {
                const targetPlayerIndex = (firstPlayerIndex + i) % 4;
                return (
                    <div
                        key={i}
                        className={`absolute ${getDealAnimationClass(targetPlayerIndex)}`}
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <CardDisplay isFaceUp={false} />
                    </div>
                );
            })}
        </>
    );
};

const SpadesBrokenNotification: React.FC = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="relative flex flex-col items-center">
                {/* Burst effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 animate-burst-effect border-yellow-400 rounded-full" />
                {/* Text */}
                <h2 className="text-5xl font-black text-white animate-burst-text [text-shadow:_0_2px_8px_rgb(0_0_0_/_70%)]">
                    Trump Opened!
                </h2>
            </div>
        </div>
    );
}


const GameTable: React.FC<GameTableProps> = ({ gameState, onCardPlay }) => {
    const { players, currentPlayerIndex, currentTrick, animation } = gameState;
    const currentPlayer = players[currentPlayerIndex];

    const getPlayerByPosition = (position: PlayerPosition) => {
        return players.find(p => p.position === position)!;
    };
    
    const getAnimationClass = (winner: PlayerPosition) => {
        switch (winner) {
            case 'North': return 'animate-trick-to-north';
            case 'South': return 'animate-trick-to-south';
            case 'West': return 'animate-trick-to-west';
            case 'East': return 'animate-trick-to-east';
            default: return '';
        }
    };

    const getPlayAnimationClass = (playerPosition: PlayerPosition) => {
        switch (playerPosition) {
            case 'North': return 'animate-play-from-north';
            case 'South': return 'animate-play-from-south';
            case 'West': return 'animate-play-from-west';
            case 'East': return 'animate-play-from-east';
            default: return '';
        }
    };

    const allTrickCards = [...currentTrick];
    if (animation?.type === 'CARD_PLAYED') {
        allTrickCards.push(animation.trick);
    }
    
    const trickCardsForDisplay: Trick[] = animation?.type === 'TRICK_WON' ? animation.cards : allTrickCards;
    const showTrickAreaContainer = trickCardsForDisplay.length > 0;
    const trickContainerAnimationClass = animation?.type === 'TRICK_WON' ? getAnimationClass(animation.winner) : '';

    return (
        <div className="relative w-full h-full bg-transparent border-4 border-yellow-700 rounded-lg shadow-2xl">
            {gameState.showSpadesBroken && <SpadesBrokenNotification />}
            {/* Center Area for animations and played cards */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Unified Trick Area for Display and Animations */}
                {showTrickAreaContainer && (
                    <div className={`relative w-56 h-64 ${trickContainerAnimationClass}`}>
                        {trickCardsForDisplay.map((trick) => {
                            const isAnimatingPlay = animation?.type === 'CARD_PLAYED' && animation.trick.player === trick.player;
                            const playAnimationClass = isAnimatingPlay ? getPlayAnimationClass(trick.player) : '';
                            
                            return (
                                <div key={trick.player} className={`absolute ${trickPositionClasses[trick.player]} ${playAnimationClass}`}>
                                    <CardDisplay card={trick.card} isFaceUp={true} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Dealing animation display */}
                {animation && animation.type === 'DEALING' && (
                    <DealingAnimation dealer={gameState.dealer} players={players} />
                )}
            </div>

            {/* Players */}
            {Object.keys(positionClasses).map((pos) => {
                const position = pos as PlayerPosition;
                return (
                    <div key={position} className={`absolute ${positionClasses[position]} transition-all duration-500 z-10`}>
                        <PlayerDisplay
                            player={getPlayerByPosition(position)}
                            isCurrentPlayer={currentPlayer.position === position}
                            onCardPlay={onCardPlay}
                            gameState={gameState}
                        />
                    </div>
                )
            })}
        </div>
    );
};

export default GameTable;