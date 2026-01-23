import { X, Plus, Shield, Info } from 'lucide-react';
import { Hero, Card } from '../types';
import { useState, useMemo } from 'react';
import { Card as CardComponent } from '../components/Card';
import { CardPreviewModal } from '../components/CardPreviewModal';
import { KEYWORDS } from '../data';

import alchemistPortrait from '../assets/images/heroes/alchemist/alchemist-portrait.png';
import crusaderPortrait from '../assets/images/heroes/crusader/crusader-portrait.png';
import rangerPortrait from '../assets/images/heroes/loneranger/loneranger-portrait.png';
import prophetPortrait from '../assets/images/heroes/madprophet/madprophet-portrait.png';

const getHeroImage = (heroId: string) => {
  const map: Record<string, string> = {
    'alchemist': alchemistPortrait,
    'crusader': crusaderPortrait,
    'ranger': rangerPortrait,
    'prophet': prophetPortrait,
  };
  return map[heroId] || '';
};

interface HeroDetailScreenProps {
  hero: Hero;
  onClose: () => void;
}

export const HeroDetailScreen = ({ hero, onClose }: HeroDetailScreenProps) => {
  // Use local state to simulate/scale stats based on selected star level.
  const [visualLevel, setVisualLevel] = useState<number>(hero.level || 1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showPassiveModal, setShowPassiveModal] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);

  const heroImage = getHeroImage(hero.id);
  
  // Theme logic based on archetype
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

  // Calculate card counts for display
  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (hero.cards) {
       hero.cards.forEach(c => {
         // Determine quantity based on card type to match draft logic
         let q = 6;
         if (c.type === 'SIGNATURE') q = 3;
         if (c.type === 'ULTIMATE') q = 1;
         
         // Since we iterate unique definitions but logic copies them, 
         // we just set the count directly if it's the first time we see it, 
         // or if duplicate definitions exist in DB, we'd accumulate. 
         // But HEROES_DB usually has unique entries. 
         // Let's assume HEROES_DB has unique entries per ID.
         counts.set(c.id, q);
       });
    }
    return counts;
  }, [hero.cards]);

  // Filter cards logic - simulation
  // In a real scenario, you'd filter `hero.cards` based on `visualLevel`.
  // For now, we just list unique cards.
  const cards = useMemo(() => {
    if (!hero.cards) return [];
    
    // Deduplicate cards by ID
    const uniqueMap = new Map<string, Card>();
    hero.cards.forEach(c => {
        if (!uniqueMap.has(c.id)) {
            uniqueMap.set(c.id, c);
        }
    });
    
    // Add logic here if you want to filter cards that only unlock at `visualLevel`
    // For now, returning all unique cards creates a better "deck list" feel.
    return Array.from(uniqueMap.values());
  }, [hero.cards, visualLevel]);

  // Set default selected card
  const activeCard = useMemo(() => {
     if (selectedCardId) {
         return cards.find(c => c.id === selectedCardId) || cards[0];
     }
     return cards.length > 0 ? cards[0] : null;
  }, [cards, selectedCardId]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className={`relative w-full h-full max-w-md bg-stone-900 overflow-hidden shadow-2xl flex flex-col border-[1px] ${scheme.border}`}>
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 via-stone-900 to-black opacity-80" />

        <div className="absolute inset-0 z-0">
           <img 
             src={heroImage} 
             alt={hero.name}
             className="w-full h-full object-cover object-top opacity-90"
             onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/333/999?text=' + hero.name;
             }}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-stone-900/40" />
        </div>

        <div className="relative z-20 pt-2 flex justify-center">
            <div className={`${scheme.bannerBg} border-2 ${scheme.bannerBorder} rounded-md px-12 py-1 shadow-lg transform skew-x-[-10deg]`}>
                <h1 className={`${scheme.textMain} font-serif text-2xl font-bold tracking-widest transform skew-x-[10deg] uppercase drop-shadow-md flex gap-2`}>
                    <span>The {hero.name}</span>
                </h1>
            </div>
        </div>

        <button 
          onClick={onClose}
          className={`absolute top-2 right-2 z-50 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center border-2 ${scheme.bannerBorder} shadow-lg ${scheme.textMain} transition-colors`}
        >
          <X size={24} strokeWidth={3} />
        </button>

        <div className="relative flex-1 min-h-0 flex flex-col">
            <div className="absolute top-20 left-4 flex flex-col gap-1 z-10">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                        key={i} 
                        className="relative w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setVisualLevel(i)}
                    >
                         <svg viewBox="0 0 24 24" fill={i <= visualLevel ? '#fbbf24' : '#44403c'} className="w-full h-full drop-shadow-md stroke-black stroke-2">
                             <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                         </svg>
                    </div>
                ))}
            </div>
        </div>

        <div className={`relative z-10 bg-stone-900/40 border-t-4 ${scheme.border} pb-6 pt-12 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] h-[40%]`}>
             
             <div className="absolute -top-9 left-0 right-0 flex justify-center gap-3 z-30">
                 {[0, 1, 2].map((i) => (
                     <div 
                         key={i} 
                         className="relative group"
                         onClick={i === 0 ? () => setShowPassiveModal(true) : undefined}
                     >
                         {/* Circle */}
                         <div className={`
                             w-[4.5rem] h-[4.5rem] rounded-full bg-stone-800 border-2 ${scheme.skillRing} shadow-lg flex items-center justify-center relative overflow-hidden transition-transform
                             ${i === 0 ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                         `}>
                             <div className={`absolute inset-0 bg-gradient-to-b ${scheme.gradient} to-stone-900 pointer-events-none`} />
                             
                             {i === 0 ? (
                                hero.passiveIcon ? (
                                   <img src={hero.passiveIcon} className="w-full h-full object-cover z-10 relative" alt="Passive" />
                                ) : (
                                   <Shield className={scheme.textMain} size={32} />
                                )
                             ) : (
                                <Plus className="text-stone-500" size={28} strokeWidth={4} />
                             )}
                         </div>

                         {/* Tooltip */}
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-stone-950/95 border border-stone-700 text-stone-200 text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                            {i === 0 ? (
                                <span>{hero.passiveName || "Passive Ability"}</span>
                            ) : (
                                <span className="text-stone-500 italic">Empty Ability Slot</span>
                            )}
                         </div>
                     </div>
                 ))}
             </div>

             <div className="flex h-full mt-4">

                 {/* LEFT: Card List */}
                 <div className="w-1/2 pr-2 flex flex-col h-full overflow-hidden border-r border-stone-700/50">
                     <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${scheme.textAccent} border-b border-stone-700 pb-1`}>
                         Deck Cards
                     </div>
                     <div className="flex-1 overflow-y-auto pr-1 gap-1 flex flex-col custom-scrollbar">
                         {cards.map((card) => (
                             <div 
                                key={card.id}
                                onClick={() => setSelectedCardId(card.id)}
                                className={`
                                    cursor-pointer p-2 rounded border transition-all flex items-center justify-between
                                    ${activeCard?.id === card.id 
                                        ? `bg-stone-800 border-l-4 ${scheme.bannerBorder}` 
                                        : 'bg-stone-900/50 border-stone-800 hover:bg-stone-800'}
                                    ${activeCard?.id === card.id ? scheme.textMain : 'text-stone-400'}
                                `}
                             >
                                 <span className="text-sm font-medium truncate">{card.name}</span>
                                 <span className="text-[10px] bg-stone-950 px-1.5 rounded text-stone-500 font-mono">
                                     x{cardCounts.get(card.id) || 1}
                                 </span>
                             </div>
                         ))}
                     </div>
                 </div>
                 
                 {/* RIGHT: Card Preview */}
                 <div className="w-1/2 flex items-center justify-center pl-2">
                      <div className="relative w-full h-full flex items-center justify-center">
                           {activeCard ? (
                               <div className="h-full w-full flex items-center justify-center py-1">
                                    <CardComponent 
                                        {...activeCard} 
                                        smallMode={false}
                                        previewMode={true}
                                        compactPreview={true}
                                        className="h-full w-auto aspect-[2/3] max-w-full shadow-2xl hover:scale-[1.02] transition-transform duration-200 cursor-zoom-in"
                                        onClick={() => setZoomedCard(activeCard)}
                                    />
                               </div>
                           ) : (
                               <div className={`text-sm ${scheme.textMain} opacity-50 italic`}>No cards available</div>
                           )}
                      </div>
                 </div>
             </div>
        </div>
      </div>
      
      {/* Passive Detail Modal */}
      {showPassiveModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowPassiveModal(false)}>
              <div 
                  className={`bg-stone-900 border-2 ${scheme.border} p-8 rounded-xl max-w-sm w-full relative shadow-2xl flex flex-col items-center gap-4`}
                  onClick={(e) => e.stopPropagation()}
              >
                   <button 
                      onClick={() => setShowPassiveModal(false)}
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
      )}

      {/* Zoomed Card Modal */}
      {zoomedCard && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center">
             <CardPreviewModal 
                 card={zoomedCard} 
                 interactive={true} 
                 onClose={() => setZoomedCard(null)} 
             />
         </div>
      )}
    </div>
  );
};
