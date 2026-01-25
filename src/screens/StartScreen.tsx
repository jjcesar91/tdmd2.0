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

          <div className="z-10 text-center w-full px-8 relative mb-[160px] flex flex-col gap-4">
            <button 
                onClick={onStart} 
                className="w-full relative group transition-all active:scale-95"
            >
                <div className="absolute inset-0 transform skew-x-[-10deg] rounded-sm bg-[#8c7a59] group-hover:bg-[#9d8a67] border-2 border-[#b59e75] shadow-[0_0_20px_rgba(140,122,89,0.3)] transition-colors"></div>
                <div className="relative flex items-center justify-center gap-2 py-4 px-6">
                    <Play size={24} className="fill-stone-900 text-stone-900" />
                    <span className="font-black text-xl tracking-widest uppercase text-stone-900">
                        Arcade Mode
                    </span>
                </div>
            </button>

            <button 
                disabled 
                className="w-full relative group cursor-not-allowed"
            >
                <div className="absolute inset-0 transform skew-x-[-10deg] rounded-sm bg-stone-900/80 border-2 border-stone-800 transition-colors"></div>
                <div className="relative flex items-center justify-center gap-2 py-4 px-6">
                    <span className="font-black text-xl tracking-widest uppercase text-stone-600">
                        Story Mode
                    </span>
                </div>
            </button>
          </div>
      </div>
    </div>
  );
};
