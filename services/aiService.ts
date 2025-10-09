

import { Player, GameState, Card, BidValue, Suit } from '../types';
import { getValidCards, getTrickWinner } from './gameLogic';
import { RANK_VALUES, SUITS } from '../constants';

// --- AI BIDDING LOGIC BY DIFFICULTY ---

const getAIBidEasy = (player: Player): BidValue => {
    // Easy: Count Aces and Kings. Simple.
    let points = 0;
    player.hand.forEach(card => {
        if (card.rank === 'A' || card.rank === 'K') {
            points++;
        }
    });
    // Never bid Nil on easy
    return Math.max(1, Math.round(points));
};

const getAIBidMedium = (player: Player): BidValue => {
    const { hand } = player;

    // --- Nil Bid Assessment ---
    const hasAce = hand.some(c => c.rank === 'A');
    const kings = hand.filter(c => c.rank === 'K');
    const highSpades = hand.filter(c => c.suit === 'S' && RANK_VALUES[c.rank] >= RANK_VALUES['Q']);

    if (!hasAce && kings.length <= 1 && highSpades.length === 0) {
        return 'Nil';
    }

    // --- Standard Bid Calculation (if not bidding Nil) ---
    let points = 0;
    hand.forEach(card => {
        if (card.rank === 'A' || card.rank === 'K') {
            points++;
        }
    });

    hand.forEach(card => {
        if (card.suit === 'S' && (card.rank === 'Q' || card.rank === 'J' || card.rank === '10')) {
             points += 0.5;
        }
    });

    const spadeCount = hand.filter(c => c.suit === 'S').length;
    if (spadeCount >= 4) {
        points += (spadeCount - 3);
    }
    
    const suitsInHand = new Set(hand.map(c => c.suit));
    SUITS.forEach(suit => {
        if (!suitsInHand.has(suit)) {
            points++;
        }
    });

    const bid = Math.max(1, Math.round(points));
    return Math.min(bid, 8);
};

const getAIBidHard = (player: Player, gameState: GameState): BidValue => {
    const { hand } = player;
    let points = 0;

    // --- Nil Bid Assessment (more careful) ---
    const highCards = hand.filter(c => c.rank === 'A' || c.rank === 'K');
    const spadeCount = hand.filter(c => c.suit === 'S').length;
    if (highCards.length === 0 && spadeCount <= 3) {
        return 'Nil';
    }
    
    // --- Standard Bid Calculation ---
    hand.forEach(card => {
        if (card.rank === 'A') {
            points++;
        }
        if (card.rank === 'K') {
            const supportCards = hand.filter(c => c.suit === card.suit).length;
            points += (supportCards > 1) ? 1 : 0.5;
        }
        if (card.rank === 'Q') {
            const supportCards = hand.filter(c => c.suit === card.suit).length;
            if (supportCards > 2) points += 0.75;
        }
    });

    // Count spades more heavily
    hand.forEach(card => {
        if (card.suit === 'S' && (card.rank === 'A' || card.rank === 'K' || card.rank === 'Q')) {
            points += 0.5;
        }
    });

    // Voids and Singletons
    const suitCounts = SUITS.reduce((acc, suit) => ({ ...acc, [suit]: 0 }), {} as Record<Suit, number>);
    hand.forEach(c => { suitCounts[c.suit]++; });
    
    for (const suit of SUITS) {
        if (suit !== 'S') {
            if (suitCounts[suit] === 0) points += 2; // Void is very strong
            if (suitCounts[suit] === 1) points += 1; // Singleton is good
        }
    }
    
    if (gameState.gameMode === 'Partnership') {
        const partner = gameState.players.find(p => p.team === player.team && p.position !== player.position);
        const partnerBid = gameState.bids.find(b => b.player === partner?.position)?.bid;
        if (typeof partnerBid === 'number' && partnerBid >= 5) {
            points -= 1; // Partner has a strong hand, be more conservative
        }
    }

    return Math.max(1, Math.round(points));
};

/**
 * Main dispatcher for AI bidding.
 */
export const getAIBid = (player: Player, gameState: GameState): BidValue => {
    switch (gameState.difficulty) {
        case 'Easy':
            return getAIBidEasy(player);
        case 'Hard':
            return getAIBidHard(player, gameState);
        case 'Medium':
        default:
            return getAIBidMedium(player);
    }
};


// --- AI CARD PLAYING LOGIC BY DIFFICULTY ---

const sortCards = (cards: Card[], ascending = true): Card[] => {
    return [...cards].sort((a, b) => {
        const valueA = RANK_VALUES[a.rank];
        const valueB = RANK_VALUES[b.rank];
        return ascending ? valueA - valueB : valueB - valueA;
    });
};

const getAICardPlayMedium = (player: Player, gameState: GameState, validCards: Card[]): Card => {
    const { currentTrick } = gameState;
    const team = gameState.teams.find(t => t.name === player.team)!;
    const teamMadeBid = team.tricksWon >= team.bid;

    // 1. If leading a trick
    if (currentTrick.length === 0) {
        if (teamMadeBid) return sortCards(validCards, true)[0];
        const highNonSpades = sortCards(validCards.filter(c => c.suit !== 'S'), false);
        if (highNonSpades.length > 0) return highNonSpades[0];
        if (gameState.spadesBroken) return sortCards(validCards.filter(c => c.suit === 'S'), false)[0];
        return sortCards(validCards, true)[0];
    }
    
    // 2. Following a trick
    const leadCard = currentTrick[0].card;
    const winnerSoFarPosition = getTrickWinner(currentTrick);
    const winningCard = currentTrick.find(t => t.player === winnerSoFarPosition)!.card;
    const partnerIsWinning = gameState.players.some(p => p.position === winnerSoFarPosition && p.team === player.team);
    const cardsInLeadSuit = sortCards(validCards.filter(c => c.suit === leadCard.suit));

    if (cardsInLeadSuit.length > 0) {
        if (partnerIsWinning) return cardsInLeadSuit[0]; // Play low if partner winning
        const potentialWinners = cardsInLeadSuit.filter(c => RANK_VALUES[c.rank] > RANK_VALUES[winningCard.rank]);
        if (potentialWinners.length > 0) return sortCards(potentialWinners, true)[0];
        return cardsInLeadSuit[0]; // Can't win, play low
    }
    
    // 3. Void in suit, can trump or sluff
    const spades = sortCards(validCards.filter(c => c.suit === 'S'), true);
    if (partnerIsWinning) {
        const highNonSpades = sortCards(validCards.filter(c => c.suit !== 'S'), false);
        return highNonSpades.length > 0 ? highNonSpades[0] : validCards[0];
    }
    if (spades.length > 0 && !teamMadeBid) {
        if (winningCard.suit !== 'S') return spades[0];
        const overTrumps = spades.filter(s => RANK_VALUES[s.rank] > RANK_VALUES[winningCard.rank]);
        if (overTrumps.length > 0) return overTrumps[0];
    }
    return sortCards(validCards, true)[0];
};

const getAICardPlayHard = (player: Player, gameState: GameState, validCards: Card[]): Card => {
    const { currentTrick } = gameState;
    const team = gameState.teams.find(t => t.name === player.team)!;
    const partnerPosition = gameState.players.find(p => p.team === player.team && p.position !== player.position)?.position;
    const partnerBid = partnerPosition ? gameState.bids.find(b => b.player === partnerPosition)?.bid : undefined;

    if (currentTrick.length === 0) {
        return getBestCardToLead(player, gameState, validCards, team, partnerBid);
    }

    const leadCard = currentTrick[0].card;
    const winnerSoFarPosition = getTrickWinner(currentTrick);
    const winningCard = currentTrick.find(t => t.player === winnerSoFarPosition)!.card;
    const partnerIsWinning = partnerPosition ? winnerSoFarPosition === partnerPosition : false;
    const cardsInLeadSuit = sortCards(validCards.filter(c => c.suit === leadCard.suit));
    
    if (partnerBid === 'Nil' && !partnerIsWinning) {
        const potentialWinnersInSuit = sortCards(cardsInLeadSuit.filter(c => RANK_VALUES[c.rank] > RANK_VALUES[winningCard.rank]), false);
        if (potentialWinnersInSuit.length > 0) return potentialWinnersInSuit[0];
        const spades = sortCards(validCards.filter(c => c.suit === 'S'), false);
        if (spades.length > 0) {
            if (winningCard.suit !== 'S') return spades[0];
            const higherSpades = spades.filter(s => RANK_VALUES[s.rank] > RANK_VALUES[winningCard.rank]);
            if (higherSpades.length > 0) return sortCards(higherSpades, false)[0];
        }
        return sortCards(validCards, true)[0];
    }
    
    if (cardsInLeadSuit.length > 0) {
        if (partnerIsWinning) return cardsInLeadSuit[0];
        const potentialWinners = cardsInLeadSuit.filter(c => RANK_VALUES[c.rank] > RANK_VALUES[winningCard.rank]);
        if (potentialWinners.length > 0) return sortCards(potentialWinners, true)[0];
        return cardsInLeadSuit[0];
    }

    const spades = sortCards(validCards.filter(c => c.suit === 'S'));
    const nonSpadesToDiscard = sortCards(validCards.filter(c => c.suit !== 'S'), false);

    if (partnerIsWinning) {
        return nonSpadesToDiscard.length > 0 ? nonSpadesToDiscard[0] : spades[spades.length - 1];
    }

    if (spades.length > 0) {
        if (winningCard.suit !== 'S') return spades[0];
        const higherSpades = spades.filter(s => RANK_VALUES[s.rank] > RANK_VALUES[winningCard.rank]);
        if (higherSpades.length > 0) return higherSpades[0];
    }
    return nonSpadesToDiscard.length > 0 ? nonSpadesToDiscard[0] : sortCards(validCards, false)[0];
};

function getBestCardToLead(player: Player, gameState: GameState, validCards: Card[], team: GameState['teams'][0], partnerBid?: BidValue): Card {
    if (partnerBid === 'Nil') {
        const nonSpades = validCards.filter(c => c.suit !== 'S');
        return nonSpades.length > 0 ? sortCards(nonSpades, false)[0] : sortCards(validCards, false)[0];
    }
    
    if (team.tricksWon >= team.bid) {
        return sortCards(validCards, true)[0];
    }
    
    const highAcesAndKings = sortCards(validCards.filter(c => c.suit !== 'S' && (c.rank === 'A' || c.rank === 'K')), false);
    if (highAcesAndKings.length > 0) return highAcesAndKings[0];
    
    const highSpades = sortCards(validCards.filter(c => c.suit === 'S'), false);
    if (gameState.spadesBroken && highSpades.length > 0) {
        const cardsPlayed = gameState.tricks.flat().length;
        if (cardsPlayed > 26 || (highSpades[0].rank === 'A' || highSpades[0].rank === 'K')) {
            return highSpades[0];
        }
    }

    const suitCounts = validCards.reduce((acc, card) => {
        if (card.suit !== 'S') acc[card.suit] = (acc[card.suit] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    let longestSuit: string | null = null;
    let maxCount = 0;
    for (const suit in suitCounts) {
        if (suitCounts[suit] > maxCount) {
            maxCount = suitCounts[suit];
            longestSuit = suit;
        }
    }
    if (longestSuit) {
        return sortCards(validCards.filter(c => c.suit === longestSuit), false)[0];
    }

    const lowNonSpades = sortCards(validCards.filter(c => c.suit !== 'S'), true);
    if (lowNonSpades.length > 0) return lowNonSpades[0];
    
    return sortCards(validCards.filter(c => c.suit === 'S'), true)[0];
}

/**
 * Main dispatcher for AI card playing.
 */
export const getAICardPlay = (player: Player, gameState: GameState): Card | null => {
    const validCards = getValidCards(player.hand, gameState.currentTrick, gameState.spadesBroken);
    if (!validCards.length) return null;
    if (validCards.length === 1) return validCards[0];

    switch (gameState.difficulty) {
        case 'Easy':
            return validCards[Math.floor(Math.random() * validCards.length)];
        case 'Medium':
            return getAICardPlayMedium(player, gameState, validCards);
        case 'Hard':
        default:
             return getAICardPlayHard(player, gameState, validCards);
    }
};