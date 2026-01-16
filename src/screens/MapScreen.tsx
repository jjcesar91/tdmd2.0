import React from 'react';
import { Castle, Map as MapIcon } from 'lucide-react';

interface MapScreenProps {
  mapNode: number;
  enterCombat: (type: 'normal' | 'boss') => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ mapNode, enterCombat }) => {
  return (
    <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif">
      <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full bg-stone-900 border-4 border-stone-700 flex flex-col relative overflow-hidden shadow-2xl">
         <div className="p-4 text-center bg-stone-950 border-b border-stone-800 shadow-md z-10">
            <h2 className="text-lg font-bold text-stone-200 tracking-widest uppercase">Kingdom Map</h2>
         </div>
         <div className="flex-1 flex flex-col items-center justify-center gap-8 relative bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
            <div className="absolute top-10 bottom-10 w-1 bg-stone-700 z-0" />
            {[4, 3, 2, 1, 0].map(nodeIdx => {
               const isCurrent = mapNode === nodeIdx;
               const isPast = mapNode > nodeIdx;
               const isBoss = nodeIdx === 4;
               return (
                  <div key={nodeIdx} 
                       onClick={() => isCurrent ? enterCombat(isBoss ? 'boss' : 'normal') : null}
                       className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-500
                       ${isCurrent ? 'scale-110 border-amber-500 bg-amber-900 cursor-pointer animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 
                         (isPast ? 'border-stone-700 bg-stone-800 opacity-40 grayscale' : 'border-stone-600 bg-stone-800 opacity-60')}`}>
                     {isBoss ? <Castle size={24} className={isCurrent ? "text-amber-100" : "text-stone-500"} /> : <MapIcon size={20} className={isCurrent ? "text-amber-100" : "text-stone-500"} />}
                     {isCurrent && <div className="absolute -right-24 bg-amber-700 text-[10px] px-3 py-1 rounded-r-full border-l-4 border-amber-400 text-stone-100 font-bold shadow-lg animate-in slide-in-from-left-2">YOU ARE HERE</div>}
                  </div>
               );
            })}
         </div>
         <div className="p-4 bg-stone-950 text-center text-[10px] text-stone-500 border-t border-stone-800 uppercase tracking-widest">
            Defeat the Dragon to win
         </div>
      </div>
    </div>
  );
};
