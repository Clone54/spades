
import { Suit, Rank } from './types';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
    'S': '♠',
    'H': '♥',
    'D': '♦',
    'C': '♣'
};

export const SUIT_COLORS: Record<Suit, string> = {
    'S': 'text-gray-800',
    'H': 'text-red-600',
    'D': 'text-blue-400',
    'C': 'text-green-500'
};