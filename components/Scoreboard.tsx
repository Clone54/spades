import React from 'react';
import { GameState, Team } from '../types';

interface ScoreboardProps {
    gameState: GameState;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ gameState }) => {
    const { teams, animation } = gameState;

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-center mb-4 border-b-2 border-gray-600 pb-2">Scoreboard</h2>
            <div className="space-y-4">
                {teams.map((team, index) => {
                    const isUpdating = animation?.type === 'SCORING' && animation.updatedTeams.includes(team.name);
                    const animationClass = isUpdating ? 'animate-score-update' : '';

                    return (
                        <div key={index} className={`bg-gray-700 p-4 rounded-md transition-all duration-300 ${animationClass}`}>
                            <h3 className="text-xl font-semibold text-yellow-400">{team.name} {teams.length === 2 && `(${team.players.join(' & ')})`}</h3>
                            <div className="mt-2 text-lg">
                                <p>Score: <span className="font-bold text-white">{team.score}</span></p>
                                <p>Bags: <span className="font-bold text-white">{team.bags}</span></p>
                            </div>
                            <div className="mt-2 text-sm text-gray-300">
                                <p>Current Round Bid: <span className="font-bold">{team.bid}</span></p>
                                <p>Tricks Won: <span className="font-bold">{team.tricksWon}</span></p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Scoreboard;