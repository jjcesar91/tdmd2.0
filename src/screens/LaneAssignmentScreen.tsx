import React from 'react';
import { Eye, Crown, Shield, Sword, Swords, Skull, Target, Layers, RefreshCw, FlaskConical } from 'lucide-react';
import { HEROES_DB } from '../data';

interface LaneAssignmentScreenProps {
  selectedHeroes: string[];
  draggedHeroIndex: number | null;
  heroLevels: {[heroId: string]: number};
  onBack: () => void;
  onFinalize: () => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (index: number) => void;
  handleLevelChange: (heroId: string, amount: number) => void;
}

export const LaneAssignmentScreen: React.FC<LaneAssignmentScreenProps> = ({
  selectedHeroes,
  draggedHeroIndex,
  heroLevels,
  onBack,
  onFinalize,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleLevelChange
}) => {
  const laneNames = ['Front Line', 'Mid Line', 'Rear Line'];
  const laneLabels = ['FRONT', 'MID', 'REAR'];

  return (
    <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-sans">
      <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full bg-gradient-to-b from-[#D4B896] to-[#C4A876] border-4 border-[#8B6F47] flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* Header with ornamental design */}
        <div className="relative p-6 bg-gradient-to-b from-[#78350F] to-[#451A03] border-b-4 border-amber-900/50">
          {/* Top decorative border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          
          <div className="relative z-10 text-center">
            <h2 className="text-2xl font-bold text-amber-300 font-serif mb-1 tracking-wider drop-shadow-lg">
              Formation
            </h2>
            <p className="text-xs text-amber-200/70 uppercase tracking-[0.3em]">Arrange Your Heroes</p>
          </div>
          
          {/* Bottom decorative border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent"></div>
        </div>

        {/* Instruction Disclaimer */}
        <div className="px-4 py-4 bg-amber-900/20 border-b border-amber-700/30">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2 text-amber-900 mb-2">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
                <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
                <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
              </div>
              <p className="text-xs font-bold tracking-wide uppercase">
                Drag to Reorder
              </p>
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
                <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
                <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[9px] leading-tight text-amber-950/80">
            <div>
              <div className="font-black uppercase mb-0.5 text-amber-800">Front</div>
              <div className="font-medium">First into battle</div>
            </div>
            <div>
              <div className="font-black uppercase mb-0.5 text-amber-800">Mid</div>
              <div className="font-medium">Tactical support</div>
            </div>
            <div>
              <div className="font-black uppercase mb-0.5 text-amber-800">Rear</div>
              <div className="font-medium">Strategic strikes</div>
            </div>
          </div>
        </div>

        {/* Hero Cards in Horizontal Layout */}
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="grid grid-cols-3 gap-2 w-full max-w-md">
            {selectedHeroes.map((heroId, index) => {
              const hero = HEROES_DB.find(h => h.id === heroId)!;
              const isDragging = draggedHeroIndex === index;
              
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`relative transition-all cursor-move ${
                    isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:scale-[1.02]'
                  }`}
                >
                  {/* Banner-shaped card with shield bottom */}
                  <div className="relative w-full rounded-t-2xl shadow-2xl overflow-visible">
                    
                    {/* Lane position badge at top right */}
                    <div className="absolute -top-3 -right-2 z-20 px-2 py-1 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-500 flex items-center justify-center shadow-lg">
                      <span className="text-[8px] font-black text-white uppercase tracking-tight">{laneLabels[index]}</span>
                    </div>

                    {/* Main card container with rounded top */}
                    <div className="relative bg-gradient-to-b from-stone-100 to-white rounded-t-2xl border-3 border-stone-200 overflow-hidden" style={{ paddingBottom: '300%' }}>
                      
                      {/* Hero illustration section (upper ~65%) */}
                      <div className="absolute top-0 left-0 right-0" style={{ height: '65%' }}>
                        <div className="w-full h-full bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-3">
                          {/* Placeholder for hero illustration - using icon for now */}
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-3 border-amber-300 flex items-center justify-center shadow-lg">
                              {/* Kingdom */}
                              {hero.id === 'prophet' && <Eye size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'banner' && <Crown size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'princess' && <Crown size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'sentry' && <Shield size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'lostprince' && <Crown size={32} className="text-white drop-shadow-lg" />}
                              
                              {/* Vengeance */}
                              {hero.id === 'crusader' && <Shield size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'silenced' && <Skull size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'oathbreaker' && <Sword size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'captive' && <Swords size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'cursed' && <Skull size={32} className="text-white drop-shadow-lg" />}
                              
                              {/* Balance */}
                              {hero.id === 'ranger' && <Target size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'gravekeeper' && <Skull size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'druid' && <Layers size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'hunter' && <Target size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'entropy' && <RefreshCw size={32} className="text-white drop-shadow-lg" />}
                              
                              {/* Power */}
                              {hero.id === 'alchemist' && <FlaskConical size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'scavenger' && <Sword size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'witch' && <Skull size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'dragonblood' && <Swords size={32} className="text-white drop-shadow-lg" />}
                              {hero.id === 'fanatic' && <Eye size={32} className="text-white drop-shadow-lg" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Golden banner section with shield point (lower ~35%) */}
                      <div className="absolute left-0 right-0" style={{ top: '65%', bottom: 0 }}>
                        {/* Shield-shaped banner with pointed bottom */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                              <stop offset="50%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
                              <stop offset="100%" style={{ stopColor: '#b45309', stopOpacity: 1 }} />
                            </linearGradient>
                          </defs>
                          <path 
                            d="M 0,0 L 100,0 L 100,70 L 85,80 L 70,90 L 50,100 L 30,90 L 15,80 L 0,70 Z" 
                            fill={`url(#grad-${index})`}
                          />
                        </svg>
                        
                        {/* Content over the banner */}
                        <div className="relative z-10 flex flex-col items-center justify-start h-full pt-3 px-2 pb-4">
                          <div className="text-xs font-bold text-white text-center mb-1 drop-shadow-md leading-tight">
                            {hero.name}
                          </div>
                          <div className="text-[9px] px-1.5 py-0.5 bg-amber-900/40 border border-amber-300/50 rounded-full text-amber-100 uppercase tracking-wide backdrop-blur-sm mb-2">
                            {laneNames[index]}
                          </div>
                          
                          {/* Level Selector */}
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLevelChange(heroId, -1);
                              }}
                              disabled={(heroLevels[heroId] || 1) <= 1}
                              className="w-5 h-5 rounded-full bg-amber-800/60 hover:bg-amber-700/80 disabled:opacity-30 disabled:cursor-not-allowed border border-amber-300/50 flex items-center justify-center text-white font-bold text-xs transition-all"
                            >
                              -
                            </button>
                            <div className={`px-2 py-0.5 rounded-full border-2 font-bold text-[10px] min-w-[2.5rem] text-center ${
                              (heroLevels[heroId] || 1) === 1 ? 'bg-stone-600 text-stone-100 border-stone-400' :
                              (heroLevels[heroId] || 1) === 2 ? 'bg-green-600 text-white border-green-400' :
                              (heroLevels[heroId] || 1) === 3 ? 'bg-blue-600 text-white border-blue-400' :
                              (heroLevels[heroId] || 1) === 4 ? 'bg-purple-600 text-white border-purple-400' :
                              'bg-amber-600 text-white border-amber-400'
                            }`}>
                              LV {heroLevels[heroId] || 1}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLevelChange(heroId, 1);
                              }}
                              disabled={(heroLevels[heroId] || 1) >= 5}
                              className="w-5 h-5 rounded-full bg-amber-800/60 hover:bg-amber-700/80 disabled:opacity-30 disabled:cursor-not-allowed border border-amber-300/50 flex items-center justify-center text-white font-bold text-xs transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drag indicator dots below card */}
                  <div className="flex justify-center gap-1 mt-2">
                    <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
                    <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
                    <div className="w-1 h-1 rounded-full bg-amber-700/60"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="relative bg-gradient-to-b from-[#78350F] to-[#451A03] border-t-2 border-amber-700/50 px-4 py-4">
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 font-bold text-sm rounded-full uppercase tracking-wider border-2 border-stone-500 bg-stone-700 hover:bg-stone-600 text-stone-300 transition-all shadow-lg active:scale-95"
            >
              Back
            </button>
            <button
              onClick={onFinalize}
              className="px-8 py-3 font-bold text-sm rounded-full uppercase tracking-wider border-2 border-amber-300 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-500/50 hover:shadow-amber-500/70 hover:scale-105 transition-all"
            >
              Start Adventure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
