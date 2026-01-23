import React from 'react';
import { X, Info } from 'lucide-react';
import { Card as CardComponent } from './Card';
import { Card } from '../types';
import { KEYWORDS } from '../data';

interface CardPreviewModalProps {
  card: Card;
  onClose?: () => void;
  interactive?: boolean; // If true, adds close logic. If false, implies external control (like hold-to-view)
}

export const CardPreviewModal: React.FC<CardPreviewModalProps> = ({ card, onClose, interactive = false }) => {
  const sortedKeys = Object.keys(KEYWORDS).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${sortedKeys.join('|')})`, 'g');
  const matches = card.desc.match(regex) || [];
  const foundKeywords = Array.from(new Set(matches));

  return (
    <div 
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 ${!interactive ? 'pointer-events-none' : ''}`}
      onClick={interactive ? onClose : undefined}
    >
      <div 
         className={`relative w-64 aspect-[2/3] shadow-2xl shrink-0 ${!interactive ? 'pointer-events-auto' : ''}`}
         onClick={(e) => e.stopPropagation()}
      >
         <CardComponent 
            {...card}
            smallMode={false}
            previewMode={true} 
            compactPreview={false} // Full detail
            className="w-full h-full shadow-[0_0_50px_rgba(0,0,0,0.8)]"
         />
         
         {interactive && onClose && (
             <button 
                onClick={onClose}
                className="absolute -top-3 -right-3 w-8 h-8 bg-stone-800 rounded-full border border-stone-600 flex items-center justify-center text-stone-200 hover:bg-stone-700 hover:text-white transition-colors shadow-lg z-50 cursor-pointer"
             >
                <X size={16} />
             </button>
         )}
      </div>

      {foundKeywords.length > 0 && (
        <div className="mt-6 w-full max-w-xs animate-in slide-in-from-bottom-2 fade-in duration-300">
           <div className="bg-stone-900/95 border border-stone-600 rounded-lg p-3 shadow-2xl backdrop-blur-md relative overflow-hidden">
               <div className="absolute top-0 right-0 p-1 opacity-20">
                  <Info size={40} />
               </div>
               
               <div className="space-y-2 relative z-10">
                   {foundKeywords.map(k => (
                      <div key={k} className="flex flex-col gap-0.5">
                         <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">{k}</span>
                         <span className="text-stone-300 text-[10px] leading-snug">{KEYWORDS[k]}</span>
                      </div>
                   ))}
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
