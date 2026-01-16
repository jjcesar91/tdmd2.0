import React from 'react';

interface ScreenProps {
  onRestart: () => void;
}

export const GameOverScreen: React.FC<ScreenProps> = ({ onRestart }) => {
  return (
    <div className="w-full h-screen bg-black text-red-600 font-serif flex flex-col items-center justify-center animate-pulse">
        <h1 className="text-6xl font-black mb-8 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">YOU DIED</h1>
        <button onClick={onRestart} className="px-8 py-3 border-2 border-red-800 text-red-500 hover:bg-red-900/20 rounded uppercase tracking-widest font-bold transition-all">
            Return to Menu
        </button>
    </div>
  );
};
