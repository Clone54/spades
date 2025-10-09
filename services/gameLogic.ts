

import { GameState, Card, Player, Team, PlayerPosition, Suit, Trick, BidValue, GameMode, Bid, Difficulty } from '../types';
import { SUITS, RANKS, RANK_VALUES } from '../constants';

export const createDeck = (): Card[] => {
    return SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank })));
};

export const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const dealCards = (gameState: GameState): GameState => {
    const deck = shuffleDeck(createDeck());
    const players = gameState.players.map(p => ({ ...p, hand: [] as Card[] }));
    
    for (let i = 0; i < 52; i++) {
        players[i % 4].hand.push(deck[i]);
    }

    // Sort hands
    players.forEach(player => {
        player.hand.sort((a, b) => {
            if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
            return RANK_VALUES[b.rank] - RANK_VALUES[a.rank];
        });
    });

    const teams = gameState.teams.map(team => ({
        ...team,
        bid: 0,
        tricksWon: 0,
    }));
    
    return { ...gameState, deck, players, teams };
};

export const getInitialGameState = (gameMode: GameMode, difficulty: Difficulty): GameState => {
    let players: Player[];
    let teams: Team[];

    if (gameMode === 'Partnership') {
        players = [
            { position: 'South', name: 'You', hand: [], isAI: false, team: 'Team 1' },
            { position: 'West', name: 'West', hand: [], isAI: true, team: 'Team 2' },
            { position: 'North', name: 'North', hand: [], isAI: true, team: 'Team 1' },
            { position: 'East', name: 'East', hand: [], isAI: true, team: 'Team 2' }
        ];
        teams = [
            { name: 'Team 1', players: ['South', 'North'], score: 0, bags: 0, bid: 0, tricksWon: 0 },
            { name: 'Team 2', players: ['West', 'East'], score: 0, bags: 0, bid: 0, tricksWon: 0 }
        ];
    } else { // Individual mode
        players = [
            { position: 'South', name: 'You', hand: [], isAI: false, team: 'You' },
            { position: 'West', name: 'West', hand: [], isAI: true, team: 'West' },
            { position: 'North', name: 'North', hand: [], isAI: true, team: 'North' },
            { position: 'East', name: 'East', hand: [], isAI: true, team: 'East' }
        ];
        teams = [
            { name: 'You', players: ['South'], score: 0, bags: 0, bid: 0, tricksWon: 0 },
            { name: 'West', players: ['West'], score: 0, bags: 0, bid: 0, tricksWon: 0 },
            { name: 'North', players: ['North'], score: 0, bags: 0, bid: 0, tricksWon: 0 },
            { name: 'East', players: ['East'], score: 0, bags: 0, bid: 0, tricksWon: 0 },
        ];
    }


    return {
        players,
        teams,
        deck: [],
        bids: [],
        tricks: [],
        currentTrick: [],
        currentPlayerIndex: 0,
        dealer: 'East',
        spadesBroken: false,
        gamePhase: 'BIDDING' as any,
        round: 0,
        gameMode,
        difficulty,
    };
};


export const getValidCards = (hand: Card[], currentTrick: Trick[], spadesBroken: boolean): Card[] => {
    if (currentTrick.length === 0) {
        if (spadesBroken) {
            return hand;
        }
        const nonSpadeCards = hand.filter(c => c.suit !== 'S');
        return nonSpadeCards.length > 0 ? nonSpadeCards : hand;
    }

    const leadSuit = currentTrick[0].card.suit;
    const cardsInSuit = hand.filter(c => c.suit === leadSuit);

    if (cardsInSuit.length > 0) {
        return cardsInSuit;
    }

    return hand; // Can play any card if void in lead suit
};

export const getTrickWinner = (currentTrick: Trick[]): PlayerPosition => {
    if (!currentTrick || currentTrick.length === 0) return 'South'; // Should not happen
    const leadSuit = currentTrick[0].card.suit;
    let winningCard = currentTrick[0].card;
    let winner = currentTrick[0].player;

    for (let i = 1; i < currentTrick.length; i++) {
        const { player, card } = currentTrick[i];
        if (card.suit === 'S' && winningCard.suit !== 'S') {
            winningCard = card;
            winner = player;
        } else if (card.suit === winningCard.suit && RANK_VALUES[card.rank] > RANK_VALUES[winningCard.rank]) {
            winningCard = card;
            winner = player;
        }
    }
    return winner;
};

const getBidValue = (bid: BidValue): number => {
    if (typeof bid === 'number') return bid;
    return 0; // Nil and Blind Nil contribute 0 to the team bid
}

export const calculateTeamBids = (gameState: GameState): Team[] => {
    const newTeams = JSON.parse(JSON.stringify(gameState.teams));
    for (const team of newTeams) {
        team.bid = team.players.reduce((totalBid: number, playerPos: PlayerPosition) => {
            const playerBid = gameState.bids.find(b => b.player === playerPos)?.bid;
            return totalBid + getBidValue(playerBid || 0);
        }, 0);
    }
    return newTeams;
};

export const calculateRoundScores = (gameState: GameState): GameState => {
    const newTeams = JSON.parse(JSON.stringify(gameState.teams)); // Deep copy

    if (gameState.gameMode === 'Partnership') {
        for (const team of newTeams) {
            const teamBid = team.players.reduce((total: number, playerPos: PlayerPosition) => {
                const playerBid = gameState.bids.find(b => b.player === playerPos)?.bid;
                return total + getBidValue(playerBid || 0);
            }, 0);
            team.bid = teamBid;

            let roundScoreDelta = 0;
            let roundBags = 0;

            const teamMadeBid = team.tricksWon >= teamBid;
            if (teamMadeBid) {
                roundScoreDelta += teamBid * 10;
                const overtricks = team.tricksWon - teamBid;
                roundScoreDelta += overtricks;
                roundBags += overtricks;
            } else {
                roundScoreDelta -= teamBid * 10;
            }

            for (const playerPos of team.players) {
                const playerBid = gameState.bids.find(b => b.player === playerPos)?.bid;
                if (playerBid === 'Nil') {
                    const playerTricks = gameState.tricks.filter(trick => getTrickWinner(trick) === playerPos).length;
                    if (playerTricks === 0) {
                        roundScoreDelta += 100;
                    } else {
                        roundScoreDelta -= 100;
                        roundBags += playerTricks;
                    }
                }
            }
            
            team.score += roundScoreDelta;
            const newTotalBags = team.bags + roundBags;
            if (newTotalBags >= 10) {
                const numPenalties = Math.floor(newTotalBags / 10);
                team.score -= numPenalties * 100;
                team.bags = newTotalBags % 10;
            } else {
                team.bags = newTotalBags;
            }
        }
    } else { // Individual scoring
        for (const team of newTeams) { // team is a player wrapper
            const playerPos = team.players[0];
            const playerBidObj = gameState.bids.find(b => b.player === playerPos)!;
            const playerBid = playerBidObj.bid;
            
            let roundScoreDelta = 0;
            let roundBags = 0;

            if (playerBid === 'Nil') {
                if (team.tricksWon === 0) {
                    roundScoreDelta = 100;
                } else {
                    roundScoreDelta = -100;
                    roundBags = team.tricksWon;
                }
            } else {
                const bidValue = getBidValue(playerBid);
                team.bid = bidValue;
                const madeBid = team.tricksWon >= bidValue;

                if (madeBid) {
                    roundScoreDelta = (bidValue * 10) + (team.tricksWon - bidValue);
                    roundBags = team.tricksWon - bidValue;
                } else {
                    roundScoreDelta = -(bidValue * 10);
                }
            }

            team.score += roundScoreDelta;
            const newTotalBags = team.bags + roundBags;
            if (newTotalBags >= 10) {
                const numPenalties = Math.floor(newTotalBags / 10);
                team.score -= numPenalties * 100;
                team.bags = newTotalBags % 10;
            } else {
                team.bags = newTotalBags;
            }
        }
    }

    return { ...gameState, teams: newTeams };
};