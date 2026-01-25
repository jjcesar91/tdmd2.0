import React, { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { HEROES_DB } from '../data';
import { SkillModal } from '../components/SkillModal';

interface LoadoutScreenProps {
  selectedHeroes: string[];
  onBack: () => void;
  onStart: () => void;
}

export const LoadoutScreen: React.FC<LoadoutScreenProps> = ({
  selectedHeroes,
  onBack,
  onStart
}) => {
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const activeHeroId = selectedHeroes[activeHeroIndex];
  const activeHero = HEROES_DB.find(h => h.id === activeHeroId);

  if (!activeHero) return null;

  return (
    <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif overflow-hidden">
        {/* Main "Phone" Container */}
        <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full flex flex-col relative overflow-hidden shadow-2xl border-x-4 border-stone-900 bg-stone-900">
            
            {/* Background Image (Hero Art) */}
            <div className="absolute inset-0 z-0 transition-opacity duration-500 ease-in-out">
                 {activeHero.portrait ? (
                     <>
                        <img 
                            key={activeHero.id}
                            src={activeHero.portrait} 
                            alt={activeHero.name} 
                            className="w-full h-full object-cover object-top opacity-60 animate-fade-in"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 via-stone-900/40 to-stone-900"></div>
                     </>
                 ) : (
                    <div className={`w-full h-full bg-gradient-to-b from-stone-800 to-stone-950 opacity-50`} />
                 )}
            </div>

             {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                 <button onClick={onBack} className="absolute left-4 p-1 hover:bg-white/10 rounded-full transition-colors z-20">
                    <ChevronLeft size={24} className="text-stone-300" />
                </button>
                
                <div className="w-full flex justify-center">
                     <h1 className="text-xl font-bold tracking-widest text-[#d4b483]">LOADOUT</h1>
                </div>
            </div>

            {/* Main Content Area - Center */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none"> 
                {/* Visuals are absolute usually, but we layout them relatively for now */}
                
                 {/* Hero Figure (Placeholder for now) */}
                 <div className="absolute inset-0 flex items-center justify-center z-[-1]">
                    {/* If we have a full body image, it goes here. For now, we simulate it or use the portrait large */}
                     {/* <img src={activeHero.image} ... /> */}
                 </div>
            </div>

             {/* Center Panel (Slots) */}
            <div className="relative z-10 px-4 mb-4 mt-auto">
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {Array.from({ length: 3 }).map((_, index) => {
                        const heroId = selectedHeroes[index];
                        const hero = heroId ? HEROES_DB.find(h => h.id === heroId) : null;
                        const isActive = index === activeHeroIndex;

                        return (
                            <button
                                key={heroId || index}
                                onClick={() => hero && setActiveHeroIndex(index)}
                                className={`aspect-[3/4] bg-stone-800/80 border rounded-lg p-2 flex flex-col relative overflow-hidden group transition-all duration-300 text-left ${
                                    isActive 
                                    ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105 z-10' 
                                    : 'border-stone-600 opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0'
                                }`}
                            >
                                {/* Card Art / Portrait */}
                                <div className="absolute inset-0 bg-stone-900">
                                    {hero?.portrait ? (
                                        <img src={hero.portrait} alt={hero.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-stone-900">
                                            {hero ? <span className="text-4xl">🛡️</span> : <div className="flex flex-col items-center opacity-30"><Plus size={24} /><span className="text-[10px] mt-1">EMPTY</span></div>}
                                        </div>
                                    )}
                                </div>
                                
                                {hero && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                                        <div className="relative z-10 mt-auto p-1">
                                            <div className={`text-[10px] font-bold leading-tight ${isActive ? 'text-yellow-400' : 'text-stone-300'}`}>{hero.name}</div>
                                            <div className="text-[9px] text-stone-400">Lvl {hero.level}</div>
                                        </div>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Item Slots */}
                <div className="flex justify-center gap-4 mb-24 px-4">
                     <div 
                        onClick={() => setShowSkillModal(true)}
                        className="w-16 h-16 bg-stone-900 border border-yellow-600 rounded-lg shadow-[0_0_10px_rgba(234,179,8,0.2)] flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                     >
                            {activeHero.passiveIcon ? (
                            <img src={activeHero.passiveIcon} alt="Skill" className="w-full h-full object-cover" />
                            ) : (
                            <span className="text-xs text-yellow-500 font-bold text-center p-1">{activeHero.passiveName || 'SKILL'}</span>
                            )}
                     </div>
                     
                     {[1, 2].map(i => (
                        <div key={i} className="w-16 h-16 bg-stone-900/80 border border-stone-700 border-dashed rounded-lg flex items-center justify-center hover:border-stone-500 transition-colors cursor-pointer">
                            <Plus size={24} className="text-stone-600" />
                        </div>
                     ))}
                </div>

            </div>

            {/* Skill Modal */}
            {showSkillModal && (
                <SkillModal
                    hero={activeHero}
                    onClose={() => setShowSkillModal(false)}
                />
            )}

            {/* Bottom Fixed Action Button */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pb-8">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-stone-800/80 border border-yellow-600/60 py-3 rounded text-[#d4b483] font-bold text-sm uppercase tracking-wide shadow-lg hover:bg-stone-700 transition-colors">
                        Choose Loadout
                    </button>
                    <button 
                        onClick={onStart}
                        className="bg-[#d4b483] border border-[#b59e75] py-3 rounded text-stone-900 font-black text-sm uppercase tracking-wide shadow-[0_0_10px_rgba(212,180,131,0.3)] hover:bg-[#e6cca0] hover:shadow-[0_0_20px_rgba(212,180,131,0.5)] transition-all cursor-pointer"
                    >
                        Start Journey
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};
