import React from 'react';
import { Player, BidValue } from '../types';

interface BiddingModalProps {
    player: Player;
    onBid: (bid: BidValue) => void;
}

const BiddingModal: React.FC<BiddingModalProps> = ({ player, onBid }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-600 text-center">
                <h2 className="text-2xl font-bold mb-2">Your turn to bid, {player.name}</h2>
                <p className="mb-6 text-gray-300">How many tricks will you take?</p>
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {Array.from({ length: 13 }, (_, i) => i + 1).map(bid => (
                        <button
                            key={bid}
                            onClick={() => onBid(bid)}
                            className="p-3 bg-blue-600 rounded-lg font-bold text-xl hover:bg-blue-500 transition-transform transform hover:scale-110"
                        >
                            {bid}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onBid('Nil')}
                    className="w-full p-3 mt-2 bg-purple-700 rounded-lg font-bold text-xl hover:bg-purple-600 transition-transform transform hover:scale-105"
                >
                    Nil (0 Tricks)
                </button>
            </div>
        </div>
    );
};

export default BiddingModal;