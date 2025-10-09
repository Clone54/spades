import React, { useState, useRef, useEffect } from 'react';

interface MenuProps {
    onExitGame: () => void;
    onBackgroundChange: (bgClass: string) => void;
    isSoundEnabled: boolean;
    onToggleSound: () => void;
}

const BACKGROUND_OPTIONS = [
    { name: 'Classic Felt', class: 'bg-felt-green', swatch: 'bg-felt-green' },
    { name: 'Dark Wood', class: 'bg-dark-wood', swatch: 'bg-dark-wood' },
];

const Menu: React.FC<MenuProps> = ({ onExitGame, onBackgroundChange, isSoundEnabled, onToggleSound }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = () => {
        onExitGame();
        setIsOpen(false);
    }

    return (
        <div ref={menuRef} className="absolute top-4 right-4 z-30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-gray-800 bg-opacity-80 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg"
                aria-label="Game Menu"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <i className="fas fa-bars text-xl"></i>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-600 overflow-hidden animate-fade-in-down">
                    <ul className="text-white divide-y divide-gray-700">
                        <li>
                            <button
                                onClick={handleMenuClick}
                                className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center"
                            >
                                <i className="fas fa-redo-alt w-6 mr-2"></i>
                                New Game
                            </button>
                        </li>
                         <li>
                            <button
                                onClick={onToggleSound}
                                className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center"
                            >
                                <i className={`fas ${isSoundEnabled ? 'fa-volume-up' : 'fa-volume-mute'} w-6 mr-2`}></i>
                                {isSoundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
                            </button>
                        </li>
                        <li className="px-4 pt-3 pb-2 text-sm font-semibold text-gray-400">
                           Change Background
                        </li>
                        <li>
                           <div className="p-2 flex justify-around">
                             {BACKGROUND_OPTIONS.map(option => (
                                <button
                                    key={option.name}
                                    onClick={() => onBackgroundChange(option.class)}
                                    className={`w-12 h-12 rounded-full ${option.swatch} border-2 border-transparent hover:border-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all transform hover:scale-110`}
                                    aria-label={`Change background to ${option.name}`}
                                />
                             ))}
                           </div>
                        </li>
                    </ul>
                </div>
            )}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default Menu;