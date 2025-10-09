
import React from 'react';
import { Card, GameState } from '../types';
import CardDisplay from './CardDisplay';

interface HandDisplayProps {
    hand: Card[];
    isHuman: boolean;
    onCardPlay: (card: Card) => void;
    validCards: Card[];
    isCurrentPlayer: boolean;
    gameState: GameState;
}

const HandDisplay: React.FC<HandDisplayProps> = ({ hand, isHuman, onCardPlay, validCards, isCurrentPlayer, gameState }) => {
    // Hide hands while dealing animation is in progress
    if (gameState.animation?.type === 'DEALING') {
        return null;
    }
    
    // For AI players, show a single card back with the count
    if (!isHuman) {
        if (hand.length === 0) return null;
        return (
            <div className="flex">
                <CardDisplay isFaceUp={false} cardCount={hand.length} />
            </div>
        );
    }
    
    const totalCards = hand.length;
    if (totalCards === 0) return null;

    const FAN_RADIUS = 1000; // in pixels. This is used for the transform-origin pivot point.
    // The angle each card is rotated by relative to the next, controlling the spacing.
    const ANGLE_PER_CARD = 3;
    const totalArcAngle = (totalCards - 1) * ANGLE_PER_CARD;
    
    return (
        <div className="relative w-full" style={{ height: '15rem' }}>
            {hand.map((card, index) => {
                const isPlayable = isCurrentPlayer && validCards.some(vc => vc.suit === card.suit && vc.rank === card.rank);
                
                const cardAngle = (index * ANGLE_PER_CARD) - (totalArcAngle / 2);

                const transformStyle = `
                    rotate(${cardAngle}deg)
                `;

                return (
                    <div
                        key={`${card.rank}-${card.suit}`}
                        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 ease-out transform-gpu ${isPlayable ? 'cursor-pointer hover:z-20 hover:-translate-y-6 hover:scale-110' : 'cursor-not-allowed'} ${!isPlayable && isCurrentPlayer ? 'opacity-50' : ''}`}
                        style={{
                            transformOrigin: `center ${FAN_RADIUS}px`,
                            transform: transformStyle,
                            zIndex: index,
                        }}
                        onClick={() => isPlayable && onCardPlay(card)}
                    >
                        <CardDisplay card={card} isFaceUp={true} isPlayable={isPlayable} />
                    </div>
                );
            })}
        </div>
    );
};

export default HandDisplay;