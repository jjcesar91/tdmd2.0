import { X, Sword, Zap, Flame, Plus } from 'lucide-react';
import { Hero, Card } from '../types';
import { useState, useMemo } from 'react';
import { Card as CardComponent } from '../components/Card';

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
             
             <div className="absolute -top-8 left-0 right-0 flex justify-center gap-3 z-30">
                 {[0, 1, 2, 3, 4].map((i) => (
                     <div key={i} className={`w-14 h-14 rounded-full bg-stone-800 border-2 ${scheme.skillRing} shadow-lg flex items-center justify-center relative overflow-hidden group`}>
                         <div className={`absolute inset-0 bg-gradient-to-b ${scheme.gradient} to-stone-900 pointer-events-none`} />
                         
                         {i === 0 && <Flame className={scheme.textAccent} size={24} />}
                         {i === 1 && <Sword className={scheme.textMain} size={24} />}
                         {i === 2 && <Zap className={scheme.textAccent} size={24} />}
                         {i >= 3 && <Plus className="text-stone-500" size={28} strokeWidth={4} />}

                         {/* Selection ring */}
                         {i === 2 && <div className={`absolute inset-0 border-2 ${scheme.textAccent} rounded-full animate-pulse opacity-50`} />}
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
                                     {card.value}
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
                                        className="h-full w-auto aspect-[2/3] max-w-full shadow-2xl hover:scale-[1.02] transition-transform duration-200"
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
    </div>
  );
};
