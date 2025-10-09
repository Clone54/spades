import React from 'react';
import { Team } from '../types';

interface GameOverModalProps {
    teams: Team[];
    onNewGame: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ teams, onNewGame }) => {
    const winner = teams.reduce((prev, current) => (prev.score > current.score ? prev : current));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-yellow-500 text-center">
                <h2 className="text-4xl font-bold mb-4 text-yellow-400">Game Over</h2>
                <p className="text-2xl mb-2">
                    <span className="font-bold">{winner.name}</span> wins!
                </p>
                <div className="my-6 space-y-2">
                    {teams.map(team => (
                        <div key={team.name} className="text-lg">
                            <span className="font-semibold">{team.name}:</span> {team.score} points
                        </div>
                    ))}
                </div>
                <button
                    onClick={onNewGame}
                    className="px-8 py-3 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-500 transition-transform transform hover:scale-105"
                >
                    New Game
                </button>
            </div>
        </div>
    );
};

export default GameOverModal;