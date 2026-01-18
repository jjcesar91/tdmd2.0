import React from 'react';
import { Play } from 'lucide-react';
import startScreenImage from '../assets/images/splashes/TDMD-START.png';
import titleImage from '../assets/images/splashes/TDMD-TITLE.png';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif">
      <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full flex flex-col items-center justify-end border-4 border-stone-800 bg-stone-950 relative overflow-hidden shadow-2xl pb-24 opacity-0 animate-fade-in">
          {/* Background */}
          <div className="absolute inset-0">
            <img src={startScreenImage} alt="" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
          </div>
          
          <div className="absolute top-[50px] left-0 right-0 flex justify-center z-10 animate-fade-in" style={{ animationDuration: '2s' }}>
            <img src={titleImage} alt="The Dragon Must Die" className="w-4/5 object-contain" />
          </div>

          <div className="z-10 text-center w-full px-8 relative mb-[160px] flex flex-col gap-3">
            <button onClick={onStart} className="w-full py-4 bg-indigo-950 hover:bg-indigo-900 text-stone-200 font-bold rounded-lg border-2 border-indigo-800/50 shadow-xl shadow-black/50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider backdrop-blur-sm opacity-80">
                <Play size={20} className="fill-stone-200" /> Arcade Mode
            </button>
            <button disabled className="w-full py-4 bg-stone-900/80 text-stone-600 font-bold rounded-lg border-2 border-stone-800/50 flex items-center justify-center gap-2 uppercase tracking-wider backdrop-blur-sm cursor-not-allowed">
                 Story Mode
            </button>
          </div>
      </div>
    </div>
  );
};
