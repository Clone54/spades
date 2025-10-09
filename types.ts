

export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
}

export type PlayerPosition = 'North' | 'South' | 'East' | 'West';
export type GameMode = 'Partnership' | 'Individual';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Player {
    position: PlayerPosition;
    name: string;
    hand: Card[];
    isAI: boolean;
    team: string; // Changed from 'Team 1' | 'Team 2'
}

export type BidValue = number | 'Nil' | 'Blind Nil';

export interface Bid {
    player: PlayerPosition;
    bid: BidValue;
}

export interface Team {
    name: string; // Changed from 'Team 1' | 'Team 2'
    players: PlayerPosition[]; // Changed from [PlayerPosition, PlayerPosition]
    score: number;
    bags: number;
    bid: number;
    tricksWon: number;
}

export interface Trick {
    player: PlayerPosition;
    card: Card;
}

export enum GamePhase {
    BIDDING = 'BIDDING',
    PLAYING = 'PLAYING',
    SCORING = 'SCORING',
    GAME_OVER = 'GAME_OVER',
}

export interface GameState {
    players: Player[];
    teams: Team[]; // Changed from [Team, Team]
    deck: Card[];
    bids: Bid[];
    tricks: Trick[][];
    currentTrick: Trick[];
    currentPlayerIndex: number;
    dealer: PlayerPosition;
    spadesBroken: boolean;
    gamePhase: GamePhase;
    round: number;
    gameMode: GameMode;
    difficulty: Difficulty;
    showSpadesBroken?: boolean;
    animation?: {
        type: 'TRICK_WON';
        winner: PlayerPosition;
        cards: Trick[];
    } | {
        type: 'DEALING';
    } | {
        type: 'CARD_PLAYED';
        trick: Trick;
    } | {
        type: 'SCORING';
        updatedTeams: string[];
    }
}