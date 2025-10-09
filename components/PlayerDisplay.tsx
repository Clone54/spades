import React from 'react';
import { Player, Card, GameState } from '../types';
import HandDisplay from './HandDisplay';
import { getValidCards, getTrickWinner } from '../services/gameLogic';

interface PlayerDisplayProps {
    player: Player;
    isCurrentPlayer: boolean;
    onCardPlay: (card: Card) => void;
    gameState: GameState;
}

const PlayerDisplay: React.FC<PlayerDisplayProps> = ({ player, isCurrentPlayer, onCardPlay, gameState }) => {
    const isHuman = player.position === 'South';
    const playerBid = gameState.bids.find(b => b.player === player.position);
    const playerTricksWon = gameState.tricks.filter(trick => getTrickWinner(trick) === player.position).length;
    
    const isWinningTrick = gameState.animation?.type === 'TRICK_WON' && gameState.animation.winner === player.position;
    
    const team = gameState.teams.find(t => t.players.includes(player.position));
    const teamTricksWon = team?.tricksWon || 0;

    const infoBox = (
         <div className={`p-2 rounded-lg transition-all duration-300 ${isWinningTrick || (isCurrentPlayer && !gameState.animation) ? 'bg-yellow-500 shadow-lg scale-110' : 'bg-gray-800'}`}>
            <div className="text-center font-bold">{player.name}</div>
             <div className="text-xs text-center text-gray-300">
                {gameState.gamePhase === 'BIDDING' && !playerBid ? (
                   <span className="animate-pulse">Bidding...</span>
                ) : (
                    `Bid: ${playerBid ? playerBid.bid : '-'} | Won: ${playerTricksWon}`
                )}
             </div>
             {gameState.gameMode === 'Partnership' && (
                <div className="text-xs text-center text-gray-400">
                    Team Won: {teamTricksWon}
                </div>
             )}
        </div>
    );

    if (isHuman) {
        const validCards = getValidCards(player.hand, gameState.currentTrick, gameState.spadesBroken);
        return (
            <div className="relative w-full h-[18rem]"> {/* Container to position info box and hand */}
                <div className="absolute bottom-4 left-4 z-20">
                    {infoBox}
                </div>
                <HandDisplay
                    hand={player.hand}
                    isHuman={isHuman}
                    onCardPlay={onCardPlay}
                    validCards={validCards}
                    isCurrentPlayer={isCurrentPlayer}
                    gameState={gameState}
                />
            </div>
        );
    }

    // AI Player Layout
    return (
        <div className="flex flex-col items-center space-y-2">
            {infoBox}
            <HandDisplay
                hand={player.hand}
                isHuman={isHuman}
                onCardPlay={onCardPlay}
                validCards={[]}
                isCurrentPlayer={isCurrentPlayer}
                gameState={gameState}
            />
        </div>
    );
};

export default PlayerDisplay;