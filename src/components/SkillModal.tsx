import React from 'react';
import { X, Shield, Info } from 'lucide-react';
import { Hero } from '../types';
import { KEYWORDS } from '../data';

interface SkillModalProps {
  hero: Hero;
  onClose: () => void;
}

export const SkillModal: React.FC<SkillModalProps> = ({ hero, onClose }) => {
  const theme = {
    VENGEANCE: {
      primary: 'red',
      secondary: 'pink',
      border: 'border-red-900/50',
      bannerBg: 'bg-[#5e1c1c]',
      bannerBorder: 'border-red-500',
      textMain: 'text-red-100',
      textAccent: 'text-pink-400',
      gradient: 'from-red-900/30',
      skillRing: 'border-red-600',
      cardHighlight: 'ring-pink-500',
    },
    BALANCE: {
      primary: 'indigo',
      secondary: 'green',
      border: 'border-indigo-900/50',
      bannerBg: 'bg-[#1c2e5e]',
      bannerBorder: 'border-green-500',
      textMain: 'text-indigo-100',
      textAccent: 'text-green-400',
      gradient: 'from-indigo-900/30',
      skillRing: 'border-green-600',
      cardHighlight: 'ring-green-500',
    },
    KINGDOM: {
      primary: 'slate',
      secondary: 'amber',
      border: 'border-slate-800',
      bannerBg: 'bg-[#292524]',
      bannerBorder: 'border-amber-400',
      textMain: 'text-slate-100',
      textAccent: 'text-amber-400',
      gradient: 'from-slate-700/30',
      skillRing: 'border-amber-500',
      cardHighlight: 'ring-amber-500',
    },
    POWER: {
      primary: 'purple',
      secondary: 'yellow',
      border: 'border-purple-900/50',
      bannerBg: 'bg-[#3b0764]',
      bannerBorder: 'border-yellow-500',
      textMain: 'text-purple-100',
      textAccent: 'text-yellow-400',
      gradient: 'from-purple-900/30',
      skillRing: 'border-purple-600',
      cardHighlight: 'ring-yellow-500',
    }
  };

  const scheme = hero.archetype && theme[hero.archetype] ? theme[hero.archetype] : theme.KINGDOM;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div 
            className={`bg-stone-900 border-2 ${scheme.border} p-8 rounded-xl max-w-sm w-full relative shadow-2xl flex flex-col items-center gap-4`}
            onClick={(e) => e.stopPropagation()}
        >
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 text-stone-500 hover:text-stone-100 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className={`w-48 h-48 rounded-full bg-stone-800 border-4 ${scheme.skillRing} shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-b ${scheme.gradient} to-stone-900 pointer-events-none`} />
                        {hero.passiveIcon ? (
                            <img src={hero.passiveIcon} className="w-full h-full object-cover z-10 relative" alt="Passive" />
                        ) : (
                            <Shield className={scheme.textMain} size={96} />
                        )}
                </div>
                
                <div className="text-center w-full">
                    <h2 className={`text-lg font-bold font-serif uppercase tracking-widest ${scheme.textAccent} mb-2`}>
                        {hero.passiveName || "Passive Ability"}
                    </h2>
                    <div className="w-16 h-0.5 bg-stone-700 mx-auto mb-4" />
                    <p className="text-stone-300 text-sm leading-relaxed text-center px-2 mb-4">
                        {(() => {
                            if (!hero.desc) return null;
                            // Use sorted keys to correctly handle overlapping keywords (e.g. "Revealed" vs "Reveal")
                            const sortedKeys = Object.keys(KEYWORDS).sort((a, b) => b.length - a.length);
                            const parts = hero.desc.split(new RegExp(`(${sortedKeys.join('|')})`, 'g'));
                            
                            return parts.map((part, i) => {
                                if (KEYWORDS[part]) {
                                    return <span key={i} className="text-amber-400 font-bold drop-shadow-sm cursor-help" title={`${part}: ${KEYWORDS[part]}`}>{part}</span>;
                                }
                                return <span key={i}>{part}</span>;
                            });
                        })()}
                    </p>

                    {(() => {
                        // Extract keywords ensuring we match the longest ones first (same logic as Cards)
                        const sortedKeys = Object.keys(KEYWORDS).sort((a, b) => b.length - a.length);
                        const regex = new RegExp(`(${sortedKeys.join('|')})`, 'g');
                        const matches = hero.desc.match(regex) || [];
                        const foundKeywords = Array.from(new Set(matches));
                        
                        if (foundKeywords.length === 0) return null;
                        return (
                            <div className="w-full bg-stone-950/80 border border-stone-700/50 rounded-lg p-3 relative overflow-hidden text-left shadow-inner">
                                <div className="absolute top-1 right-1 opacity-20">
                                    <Info size={24} />
                                </div>
                                
                                <div className="space-y-2 relative z-10">
                                    {foundKeywords.map(k => (
                                        <div key={k} className="flex flex-col gap-0.5">
                                            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">{k}</span>
                                            <span className="text-stone-400 text-[10px] leading-snug">{KEYWORDS[k]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
        </div>
    </div>
  );
};
