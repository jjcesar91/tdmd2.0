import React from 'react';
import { Lock, Eye, Skull, Target, FlaskConical, Flag, ShieldCheck, Axe, Link, Crosshair, Shovel, Shuffle, Hammer, Moon, Flame, Zap, Gem, Scroll, Ghost, Leaf } from 'lucide-react';
import startScreenImage from '../assets/images/splashes/TDMD-START.png';
import crusaderPortrait from '../assets/images/heroes/crusader/crusader-portrait.png';
import rangerPortrait from '../assets/images/heroes/loneranger/loneranger-portrait.png';
import prophetPortrait from '../assets/images/heroes/madprophet/madprophet-portrait.png';
import bucketheadPortrait from '../assets/images/heroes/alchemist/alchemist-portrait.png';
import crusaderIcon from '../assets/images/heroes/crusader/crusader-icon.png';
import rangerIcon from '../assets/images/heroes/loneranger/loneranger-icon.png';
import { HEROES_DB } from '../data';
import { Hero } from '../types';

interface HeroSelectionScreenProps {
  selectedHeroes: string[];
  onHeroSelect: (heroId: string) => void;
  onNext: () => void;
  onBack: () => void;
  heroLevels: { [heroId: string]: number };
  onLevelChange: (heroId: string, delta: number) => void;
  setHeroDetailView: (hero: Hero) => void;
}

export const HeroSelectionScreen: React.FC<HeroSelectionScreenProps> = ({
  selectedHeroes,
  onHeroSelect,
  onNext,
  setHeroDetailView
}) => {
  return (
    <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif">
      <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full flex flex-col relative overflow-hidden shadow-2xl border-x-4 border-stone-900 bg-stone-950">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={startScreenImage} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/40 to-stone-950/90"></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full">

            {/* Ornamental Header Border */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="relative pt-8 pb-6 px-4">
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-indigo-500/10" />
                <h2 className="text-3xl font-bold text-stone-100 font-serif tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">Heroes</h2>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-indigo-500/50 to-indigo-500/10" />
                </div>
                <p className="text-[10px] text-indigo-300/80 uppercase tracking-[0.3em] font-medium text-shadow-sm">Assemble Your Party</p>
            </div>
            
            {/* Selection Indicators */}
            <div className="flex justify-center gap-4">
                {[0, 1, 2].map(i => {
                    const heroId = selectedHeroes[i];
                    const selectedHero = heroId ? HEROES_DB.find(h => h.id === heroId) : null;
                    
                    return (
                        <div key={i} className={`w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center backdrop-blur-sm ${
                            selectedHero 
                            ? 'bg-indigo-900/80 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' 
                            : 'bg-stone-900/60 border-stone-700/50'
                        }`}>
                            {selectedHero && (
                                <div className="text-white drop-shadow-md animate-fade-in">
                                    {selectedHero.id === 'prophet' && <Scroll size={24} />}
                                    {selectedHero.id === 'banner' && <Flag size={24} />}
                                    {selectedHero.id === 'princess' && <Gem size={24} />}
                                    {selectedHero.id === 'sentry' && <ShieldCheck size={24} />}
                                    
                                    {selectedHero.id === 'crusader' && <img src={crusaderIcon} alt="Crusader" className="w-6 h-6 object-contain" />}
                                    {selectedHero.id === 'silenced' && <Ghost size={24} />}
                                    {selectedHero.id === 'oathbreaker' && <Axe size={24} />}
                                    {selectedHero.id === 'captive' && <Link size={24} />}
                                    {selectedHero.id === 'cursed' && <Skull size={24} />}
                                    
                                    {selectedHero.id === 'ranger' && <img src={rangerIcon} alt="Ranger" className="w-6 h-6 object-contain" />}
                                    {selectedHero.id === 'gravekeeper' && <Shovel size={24} />}
                                    {selectedHero.id === 'druid' && <Leaf size={24} />}
                                    {selectedHero.id === 'hunter' && <Target size={24} />}
                                    {selectedHero.id === 'entropy' && <Shuffle size={24} />}
                                    
                                    {selectedHero.id === 'alchemist' && <FlaskConical size={24} />}
                                    {selectedHero.id === 'scavenger' && <Hammer size={24} />}
                                    {selectedHero.id === 'witch' && <Moon size={24} />}
                                    {selectedHero.id === 'dragonblood' && <Flame size={24} />}
                                    {selectedHero.id === 'fanatic' && <Zap size={24} />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            </div>

            {/* Heroes Grid - Vertical Columns */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide mask-image-b">
            <div className="grid grid-cols-3 gap-3 pt-[10px]">
                {HEROES_DB.filter(hero => hero.id !== 'lostprince').map(hero => {
                const isSelected = selectedHeroes.includes(hero.id);
                const isLocked = hero.locked || false;
                
                return (
                    <div key={hero.id} className="flex flex-col relative group">
                    {/* Hero Banner Card */}
                    <div
                        onClick={() => !isLocked && onHeroSelect(hero.id)}
                        onContextMenu={(e) => {
                        e.preventDefault();
                        setHeroDetailView(hero);
                        }}
                        className={`w-full aspect-[1/2] relative rounded-t-xl rounded-b-md overflow-hidden transition-all duration-300 ${
                        isLocked 
                            ? 'cursor-not-allowed opacity-50 grayscale contrast-125' 
                            : 'cursor-pointer ' + (isSelected
                            ? 'ring-2 ring-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-[1.02] z-10'
                            : 'hover:shadow-lg hover:shadow-black/60 hover:scale-[1.02] border border-stone-800/50 hover:border-stone-600')
                        }`}
                        style={{
                        background: isSelected 
                            ? 'linear-gradient(180deg, rgba(49, 46, 129, 0.7) 0%, rgba(30, 27, 75, 0.8) 100%)' // Indigo gradient
                            : 'linear-gradient(180deg, rgba(28, 25, 23, 0.8) 0%, rgba(12, 10, 9, 0.85) 100%)'  // Dark Stone gradient
                        }}
                    >
                        {/* Locked Overlay */}
                        {isLocked && (
                        <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center z-40">
                            <Lock size={24} className="text-stone-500" />
                        </div>
                        )}
                        
                        {/* Info Button - Top Right */}
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setHeroDetailView(hero);
                        }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-stone-900/80 border border-stone-600 hover:bg-indigo-900 hover:border-indigo-400 flex items-center justify-center transition-all shadow-lg z-30 ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        >
                        <Eye size={14} className="text-stone-300 group-hover:text-indigo-200" />
                        </button>
                        
                        {/* Hero Icon - Center Division */}
                        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 translate-y-1/2 z-20" title={hero.archetype}>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors duration-300 ${
                                 isSelected ? 'bg-indigo-900 border-indigo-400 shadow-indigo-500/50' : 'bg-stone-900 border-stone-600 shadow-black/50'
                             }`}>
                                {hero.id === 'prophet' && <Scroll size={20} className="text-indigo-200" />}
                                {hero.id === 'banner' && <Flag size={20} className="text-amber-200" />}
                                {hero.id === 'princess' && <Gem size={20} className="text-pink-200" />}
                                {hero.id === 'sentry' && <ShieldCheck size={20} className="text-slate-200" />}
                                
                                {hero.id === 'crusader' && <img src={crusaderIcon} alt="Crusader" className="w-5 h-5 object-contain" />}
                                {hero.id === 'silenced' && <Ghost size={20} className="text-stone-200" />}
                                {hero.id === 'oathbreaker' && <Axe size={20} className="text-orange-200" />}
                                {hero.id === 'captive' && <Link size={20} className="text-rose-200" />}
                                {hero.id === 'cursed' && <Skull size={20} className="text-purple-200" />}
                                
                                {hero.id === 'ranger' && <img src={rangerIcon} alt="Ranger" className="w-5 h-5 object-contain" />}
                                {hero.id === 'gravekeeper' && <Shovel size={20} className="text-teal-200" />}
                                {hero.id === 'druid' && <Leaf size={20} className="text-green-200" />}
                                {hero.id === 'hunter' && <Target size={20} className="text-lime-200" />}
                                {hero.id === 'entropy' && <Shuffle size={20} className="text-cyan-200" />}
                                
                                {hero.id === 'alchemist' && <FlaskConical size={20} className="text-yellow-200" />}
                                {hero.id === 'scavenger' && <Hammer size={20} className="text-orange-200" />}
                                {hero.id === 'witch' && <Moon size={20} className="text-violet-200" />}
                                {hero.id === 'dragonblood' && <Flame size={20} className="text-red-300" />}
                                {hero.id === 'fanatic' && <Zap size={20} className="text-rose-300" />}
                             </div>
                        </div>

                        {/* HERO IMAGE AREA (Merged Icon + Background) */}
                        <div className="relative h-[80%] w-full flex items-center justify-center overflow-hidden">
                            {hero.id === 'crusader' ? (
                                <img 
                                    src={crusaderPortrait} 
                                    alt={hero.name} 
                                    className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                                />
                            ) : hero.id === 'ranger' ? (
                                <img 
                                    src={rangerPortrait} 
                                    alt={hero.name} 
                                    className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                                />
                            ) : hero.id === 'prophet' ? (
                                <img 
                                    src={prophetPortrait} 
                                    alt={hero.name} 
                                    className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                                />
                            ) : hero.id === 'alchemist' ? (
                                <img 
                                    src={bucketheadPortrait} 
                                    alt={hero.name} 
                                    className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                                />
                            ) : (
                                <>
                                    {/* Placeholder generic background or specific per archetype? */}
                                    <div className={`absolute inset-0 opacity-30 ${
                                        hero.archetype === 'KINGDOM' ? 'bg-amber-900' :
                                        hero.archetype === 'VENGEANCE' ? 'bg-stone-800' :
                                        hero.archetype === 'BALANCE' ? 'bg-emerald-900' :
                                        'bg-indigo-900'
                                    }`} />
                                </>
                            )}
                        </div>
                        
                        {/* Name Bar */}
                        <div className={`relative h-[20%] flex flex-col items-center justify-center px-1 border-t ${
                             isSelected ? 'border-indigo-500/30 bg-indigo-950/90' : 'border-stone-800/80 bg-stone-950/80'
                        }`}>
                            <div className={`text-xs font-bold font-serif leading-tight text-center truncate w-full ${
                            isSelected ? 'text-indigo-100' : 'text-stone-400 group-hover:text-stone-200'
                            }`}>
                            The {hero.name}
                            </div>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="relative bg-stone-950/80 border-t border-stone-800 px-6 py-6 backdrop-blur-md">
            <div className="flex justify-center w-full">
                <button
                onClick={onNext}
                disabled={selectedHeroes.length !== 3}
                className={`w-full py-4 text-base font-bold rounded-lg uppercase tracking-widest border transition-all active:scale-95 shadow-xl ${
                    selectedHeroes.length === 3
                    ? 'bg-indigo-950 hover:bg-indigo-900 text-stone-200 border-indigo-800/50 shadow-black/50 hover:shadow-indigo-900/20'
                    : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed opacity-50'
                }`}
                >
                {selectedHeroes.length === 3 ? 'Start Adventure' : `${selectedHeroes.length}/3 Selected`}
                </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};
