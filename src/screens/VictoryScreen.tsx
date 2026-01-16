import React from 'react';
import { Crown } from 'lucide-react';

interface ScreenProps {
  onRestart: () => void;
}

export const VictoryScreen: React.FC<ScreenProps> = ({ onRestart }) => {
  return (
    <div className="w-full h-screen bg-stone-900 text-amber-400 font-serif flex flex-col items-center justify-center">
        <Crown size={80} className="mb-4 animate-bounce drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
        <h1 className="text-6xl font-black mb-8 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600">VICTORY</h1>
        <p className="text-stone-400 mb-8 font-sans uppercase tracking-widest">The Dragon Has Fallen</p>
        <button onClick={onRestart} className="px-8 py-3 border-2 border-amber-600/50 text-amber-500 hover:bg-amber-900/20 rounded uppercase tracking-widest font-bold transition-all hover:scale-105">
            Return to Menu
        </button>
    </div>
  );
};
