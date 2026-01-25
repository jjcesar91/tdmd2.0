import React, { useState } from 'react';
import { ChevronLeft, X, Plus, Lock, Settings, Play } from 'lucide-react';
import { HEROES_DB } from '../data';

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
                     <div className="text-[200px] opacity-10 font-black text-white">{activeHero.name[0]}</div>
                 </div>
            </div>

             {/* Center Panel (Slots) */}
            <div className="relative z-10 px-4 mb-4 mt-auto">
                 {/* Hero Selection Tabs (To switch between selected heroes) */}
                 <div className="flex justify-center gap-2 mb-8">
                    {selectedHeroes.map((hid, idx) => {
                        const hero = HEROES_DB.find(h => h.id === hid);
                        const isSelected = idx === activeHeroIndex;
                        return (
                            <button 
                                key={hid}
                                onClick={() => setActiveHeroIndex(idx)}
                                className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${isSelected ? 'border-yellow-500 scale-110 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-stone-600 grayscale brightness-50'}`}
                            >
                                {hero?.portrait ? (
                                    <img src={hero.portrait} alt={hero.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-xs font-bold">
                                        {hero?.name.substring(0, 2)}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                 </div>

                {/* The Grids from image */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Left: Current Hero Info/Card */}
                    <div className="aspect-[3/4] bg-stone-800/80 border border-stone-600 rounded-lg p-2 flex flex-col relative overflow-hidden group">
                         {/* Card Art / Portrait */}
                         <div className="absolute inset-0 bg-stone-900">
                             {activeHero.portrait ? (
                                <img src={activeHero.portrait} alt={activeHero.name} className="w-full h-full object-cover opacity-80" />
                             ) : (
                                <div className="w-full h-full flex items-end justify-center bg-indigo-950/50">
                                    <span className="text-4xl">🛡️</span>
                                </div>
                             )}
                         </div>
                         <div className="relative z-10 mt-auto">
                             <div className="text-xs font-bold text-stone-300">{activeHero.name}</div>
                             <div className="text-[10px] text-yellow-500">Lvl {activeHero.level}</div>
                         </div>
                         
                         <div className="absolute top-1 right-1 text-white text-[10px] font-bold">III</div>
                    </div>

                    {/* Center: Add Support */}
                    <div className="aspect-[3/4] bg-black/60 border border-yellow-600/50 rounded-lg flex flex-col items-center justify-center relative backdrop-blur-sm group cursor-pointer hover:bg-black/80 transition-colors">
                        <div className="absolute inset-0 border border-yellow-600/30 m-1 rounded pointer-events-none"></div>
                        <div className="text-[10px] text-stone-300 mb-2 font-bold tracking-wider">ADD SUPPORT</div>
                        <Plus className="text-stone-400 group-hover:text-white transition-colors" size={32} />
                        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-yellow-900/20 to-transparent"></div>
                    </div>

                    {/* Right: Unlock */}
                    <div className="aspect-[3/4] bg-black/60 border border-stone-700/50 rounded-lg flex flex-col items-center justify-center relative backdrop-blur-sm">
                        <div className="absolute inset-0 border border-stone-700/30 m-1 rounded pointer-events-none"></div>
                        <div className="text-[10px] text-stone-500 mb-2 font-bold tracking-wider text-center px-1">UNLOCK:<br/>Requirement A</div>
                        <Lock className="text-stone-600" size={24} />
                    </div>
                </div>

                {/* Buttons Row */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button className="bg-stone-800/80 border border-yellow-600/60 py-3 rounded text-[#d4b483] font-bold text-sm uppercase tracking-wide shadow-lg hover:bg-stone-700 transition-colors">
                        Auto Select
                    </button>
                    <button className="bg-stone-800/80 border border-yellow-600/60 py-3 rounded text-[#d4b483] font-bold text-sm uppercase tracking-wide shadow-lg hover:bg-stone-700 transition-colors">
                        Reinforcements
                    </button>
                </div>

                {/* Bottom Item Slots */}
                <div className="flex justify-between gap-2 mb-20 px-2">
                     {[1, 2, 3, 4].map(i => (
                         <div key={i} className="aspect-square w-14 bg-stone-900/80 border border-stone-600 rounded flex items-center justify-center">
                             {i <= 2 ? (
                                <div className="w-full h-full p-2">
                                     {/* Mock item */}
                                    <div className="w-full h-full bg-slate-700 rounded flex items-center justify-center">
                                         <span className="text-[10px] text-slate-400">III</span>
                                    </div>
                                </div>
                             ) : (
                                <Plus size={16} className="text-stone-600" />
                             )}
                         </div>
                     ))}
                </div>

            </div>

            {/* Bottom Fixed Action Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pb-8">
                 <button 
                    onClick={onStart}
                    className="w-full relative group"
                 >
                    {/* Button Background with "Rough" edges look */}
                    <div className="absolute inset-0 transform skew-x-[-10deg] rounded-sm bg-[#8c7a59] group-hover:bg-[#9d8a67] border-2 border-[#b59e75] shadow-[0_0_20px_rgba(140,122,89,0.3)] transition-colors"></div>
                     <div className="relative flex items-center justify-center gap-2 py-3 px-6">
                         <span className="text-stone-900 font-black text-xl tracking-widest uppercase">Start Battle</span>
                     </div>
                 </button>
            </div>

        </div>
    </div>
  );
};
