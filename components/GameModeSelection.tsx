
import React, { useState } from 'react';
import { GameMode, Difficulty } from '../types';

interface GameModeSelectionProps {
    onModeSelect: (mode: GameMode, difficulty: Difficulty) => void;
}

const GameModeSelection: React.FC<GameModeSelectionProps> = ({ onModeSelect }) => {
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

    if (!selectedMode) {
        return (
            <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-600 text-center">
                    <h1 className="text-4xl font-bold mb-2 text-yellow-400">Spades</h1>
                    <p className="text-lg text-gray-300 mb-8">Choose your game mode</p>
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={() => setSelectedMode('Partnership')}
                            className="px-8 py-4 bg-blue-600 text-white font-bold text-2xl rounded-lg hover:bg-blue-500 transition-transform transform hover:scale-105"
                        >
                            Partnership
                            <span className="block text-sm font-normal text-blue-200">Classic 2v2 Team Play</span>
                        </button>
                        <button
                            onClick={() => setSelectedMode('Individual')}
                            className="px-8 py-4 bg-purple-700 text-white font-bold text-2xl rounded-lg hover:bg-purple-600 transition-transform transform hover:scale-105"
                        >
                            Individual
                             <span className="block text-sm font-normal text-purple-200">1v1v1v1 Free-for-All</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // New screen for difficulty selection
    return (
        <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
            <div className="bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-600 text-center animate-fade-in">
                <h1 className="text-3xl font-bold mb-2 text-yellow-400">Choose AI Difficulty</h1>
                <p className="text-md text-gray-300 mb-6">Mode: <span className="font-semibold">{selectedMode}</span></p>
                <div className="flex flex-col space-y-4 w-72">
                    <button
                        onClick={() => onModeSelect(selectedMode, 'Easy')}
                        className="px-8 py-4 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-500 transition-transform transform hover:scale-105"
                    >
                        Easy
                        <span className="block text-sm font-normal text-green-200">For learning the ropes</span>
                    </button>
                    <button
                        onClick={() => onModeSelect(selectedMode, 'Medium')}
                        className="px-8 py-4 bg-yellow-600 text-white font-bold text-xl rounded-lg hover:bg-yellow-500 transition-transform transform hover:scale-105"
                    >
                        Medium
                         <span className="block text-sm font-normal text-yellow-200">A balanced challenge</span>
                    </button>
                    <button
                        onClick={() => onModeSelect(selectedMode, 'Hard')}
                        className="px-8 py-4 bg-red-600 text-white font-bold text-xl rounded-lg hover:bg-red-500 transition-transform transform hover:scale-105"
                    >
                        Hard
                         <span className="block text-sm font-normal text-red-200">A true test of skill</span>
                    </button>
                </div>
                <button 
                    onClick={() => setSelectedMode(null)}
                    className="mt-8 text-gray-400 hover:text-white transition-colors"
                >
                    &larr; Back to Mode
                </button>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default GameModeSelection;