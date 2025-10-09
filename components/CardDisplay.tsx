import React from 'react';
import { Card } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface CardDisplayProps {
    card?: Card;
    isFaceUp: boolean;
    isPlayable?: boolean;
    cardCount?: number;
}

const FACE_CARD_ICONS: Record<string, string> = {
    'K': 'fas fa-chess-king',
    'Q': 'fas fa-chess-queen',
    'J': 'fas fa-chess-knight'
};


const CardDisplay: React.FC<CardDisplayProps> = ({ card, isFaceUp, isPlayable = false, cardCount }) => {
    if (!isFaceUp) {
        return (
            <div className="w-20 h-28 bg-blue-700 border-2 border-white rounded-lg shadow-md flex items-center justify-center relative">
                <div className="absolute w-full h-full bg-black opacity-20"></div>
                {cardCount !== undefined && (
                    <span className="text-white text-4xl font-bold drop-shadow-lg">{cardCount}</span>
                )}
            </div>
        );
    }
    
    if (!card) return null;

    const { suit, rank } = card;
    const color = SUIT_COLORS[suit];
    const symbol = SUIT_SYMBOLS[suit];
    const isFaceCard = rank === 'K' || rank === 'Q' || rank === 'J';

    return (
        <div className={`w-20 h-28 bg-white rounded-lg shadow-md p-1 flex flex-col justify-between border-2 ${isPlayable ? 'border-yellow-400' : 'border-gray-300'}`}>
            <div className={`text-left ${color}`}>
                <div className="font-bold text-md leading-none">{rank}</div>
                <div className="text-sm leading-none">{symbol}</div>
            </div>
            <div className={`text-center ${color} font-bold`}>
                 {isFaceCard ? (
                    <i className={`${FACE_CARD_ICONS[rank]} text-4xl`}></i>
                ) : (
                    <span className="text-2xl">{symbol}</span>
                )}
            </div>
            <div className={`text-right ${color}`}>
                <div className="transform rotate-180 inline-block">
                    <div className="font-bold text-md leading-none">{rank}</div>
                    <div className="text-sm leading-none">{symbol}</div>
                </div>
            </div>
        </div>
    );
};

export default CardDisplay;