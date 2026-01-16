import React from 'react';
import { Lock, Eye, Crown, Shield, Sword, Swords, Skull, Target, Layers, RefreshCw, FlaskConical } from 'lucide-react';
import { HEROES_DB } from '../data';
import { Hero } from '../types';

interface HeroSelectionScreenProps {
  selectedHeroes: string[];
  onHeroSelect: (heroId: string) => void;
  confirmHeroSelection: () => void;
  setHeroDetailView: (hero: Hero) => void;
}

export const HeroSelectionScreen: React.FC<HeroSelectionScreenProps> = ({
  selectedHeroes,
  onHeroSelect,
  confirmHeroSelection,
  setHeroDetailView
}) => {
  return (
    <div className="w-full h-screen bg-[#D4B896] text-stone-800 flex items-center justify-center font-sans">
      <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full bg-gradient-to-b from-[#E8D4B8] to-[#C4A876] flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* Ornamental Header Border */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-amber-700/20 to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-amber-600/30 rounded-b-full" />
        
        {/* Header */}
        <div className="relative pt-6 pb-4 px-4">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-amber-600/50" />
              <h2 className="text-2xl font-bold text-amber-800 font-serif tracking-wide drop-shadow-sm">Heroes</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-600/50 to-amber-600/50" />
            </div>
            <p className="text-[10px] text-amber-700 uppercase tracking-[0.2em] font-bold">Choose Your Champions</p>
          </div>
          
          {/* Selection Indicators */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full border-3 transition-all flex items-center justify-center ${
                selectedHeroes.length > i 
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-700 shadow-lg scale-110' 
                  : 'bg-[#C4A876] border-amber-700/40'
              }`}>
                {selectedHeroes.length > i && (
                  <span className="text-sm font-black text-white drop-shadow">{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Heroes Grid - Vertical Columns */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {HEROES_DB.filter(hero => hero.id !== 'lostprince').map(hero => {
              const isSelected = selectedHeroes.includes(hero.id);
              const selectionOrder = selectedHeroes.indexOf(hero.id);
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
                    className={`w-full aspect-[1/2] relative rounded-t-3xl rounded-b-lg overflow-hidden transition-all ${
                      isLocked 
                        ? 'cursor-not-allowed opacity-60 grayscale' 
                        : 'cursor-pointer ' + (isSelected
                          ? 'ring-4 ring-amber-500 shadow-[0_0_25px_rgba(217,119,6,0.6)] scale-[1.02]'
                          : 'shadow-lg hover:shadow-xl hover:scale-[1.01]')
                    }`}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(180deg, #92400E 0%, #78350F 50%, #451A03 100%)'
                        : 'linear-gradient(180deg, #57534E 0%, #44403C 50%, #292524 100%)'
                    }}
                  >
                    {/* Locked Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40">
                        <Lock size={32} className="text-stone-400" />
                      </div>
                    )}
                    
                    {/* Ornamental Top Border */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                    
                    {/* Info Button - Shows on Hover or Selected */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeroDetailView(hero);
                      }}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-amber-600 border-2 border-amber-400 flex items-center justify-center transition-all shadow-lg hover:scale-110 z-30 ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Eye size={16} className="text-white" />
                    </button>
                    
                    {/* Selection Badge */}
                    {isSelected && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-3 border-white flex items-center justify-center shadow-xl z-20">
                        <span className="text-lg font-black text-white drop-shadow">{selectionOrder + 1}</span>
                      </div>
                    )}
                    
                    {/* Side Ornaments */}
                    <div className="absolute top-8 left-0 w-1 h-16 bg-gradient-to-b from-amber-500/60 to-transparent" />
                    <div className="absolute top-8 right-0 w-1 h-16 bg-gradient-to-b from-amber-500/60 to-transparent" />
                    
                    {/* Main Portrait Area - Top Icon */}
                    <div className="relative h-[35%] flex items-center justify-center border-b-2 border-amber-700/30">
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-amber-800/40' : 'bg-stone-800/40'
                      } border-2 ${isSelected ? 'border-amber-500' : 'border-stone-600'}`}>
                        {/* Kingdom */}
                        {hero.id === 'prophet' && <Eye size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'banner' && <Crown size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'princess' && <Crown size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'sentry' && <Shield size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'lostprince' && <Crown size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        
                        {/* Vengeance */}
                        {hero.id === 'crusader' && <Shield size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'silenced' && <Skull size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'oathbreaker' && <Sword size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'captive' && <Swords size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'cursed' && <Skull size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        
                        {/* Balance */}
                        {hero.id === 'ranger' && <Target size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'gravekeeper' && <Skull size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'druid' && <Layers size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'hunter' && <Target size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'entropy' && <RefreshCw size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        
                        {/* Power */}
                        {hero.id === 'alchemist' && <FlaskConical size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'scavenger' && <Sword size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'witch' && <Skull size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'dragonblood' && <Swords size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                        {hero.id === 'fanatic' && <Eye size={40} className={isSelected ? 'text-amber-300' : 'text-stone-400'} />}
                      </div>
                    </div>
                    
                    {/* Center - Hero Name */}
                    <div className="relative h-[40%] flex flex-col items-center justify-center px-2">
                      <div className="text-center">
                        <div className={`text-base font-bold font-serif leading-tight mb-1 ${
                          isSelected ? 'text-amber-200' : 'text-stone-300'
                        }`}>
                          {hero.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom - Archetype */}
                    <div className="relative h-[25%] flex items-center justify-center border-t-2 border-amber-700/30 pb-2">
                      <div className="text-center px-1">
                        <div className={`text-[9px] font-bold uppercase tracking-wider ${
                          isSelected ? 'text-amber-300' : 'text-stone-400'
                        }`}>
                          {hero.archetype}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom ornamental curve */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="relative bg-gradient-to-b from-[#78350F] to-[#451A03] border-t-2 border-amber-700/50 px-4 py-3">
          <div className="flex justify-center">
            <button
              onClick={confirmHeroSelection}
              disabled={selectedHeroes.length !== 3}
              className={`px-8 py-3 font-bold text-sm rounded-full uppercase tracking-wider border-2 transition-all shadow-lg ${
                selectedHeroes.length === 3
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-300 text-white shadow-amber-500/50 hover:shadow-amber-500/70 hover:scale-105'
                  : 'bg-stone-700 border-stone-600 text-stone-500 cursor-not-allowed opacity-50'
              }`}
            >
              {selectedHeroes.length === 3 ? 'Continue' : `${selectedHeroes.length}/3 Selected`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
