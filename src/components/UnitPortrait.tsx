import { Skull, Shield, Crown, User, RefreshCw, Sword, Heart, Lock, Target, Flame } from 'lucide-react';
import { Unit } from '../types';
import { StatBadge } from './StatBadge';

interface UnitPortraitProps {
  unit: Unit | null;
  isEnemy: boolean;
  onCrusaderAction?: () => void;
}

export const UnitPortrait = ({ unit, isEnemy, onCrusaderAction }: UnitPortraitProps) => {
  // Empty State - Same style for both
  if (!unit) {
    return (
      <div className="w-full h-full rounded-lg border-2 border-dashed border-stone-800 bg-black/30 flex flex-col items-center justify-center group transition-colors hover:bg-black/50">
        <div className="w-8 h-8 rounded-full border border-stone-800 bg-stone-900/50 flex items-center justify-center mb-1">
           {isEnemy ? <Skull size={14} className="text-stone-800" /> : <Shield size={14} className="text-stone-800" />}
        </div>
      </div>
    );
  }

  const isDead = unit.dead;
  // Palette: Enemy = Deep Red/Rust, Player = Deep Blue/Steel
  const borderColor = isDead ? 'border-stone-800' : (isEnemy ? 'border-red-900' : 'border-sky-900');
  const bgColor = isDead ? 'bg-stone-950' : (isEnemy ? 'bg-gradient-to-b from-red-950/80 to-black' : 'bg-gradient-to-b from-sky-950/80 to-black');
  const textColor = isDead ? 'text-stone-600' : (isEnemy ? 'text-red-400' : 'text-sky-400');
  const glowColor = isEnemy ? 'shadow-red-900/20' : 'shadow-sky-900/20';

  return (
    <div className={`
      relative w-full h-full rounded-lg border-2 flex flex-col overflow-hidden transition-all
      ${borderColor} ${bgColor} ${isDead ? 'grayscale opacity-50' : `shadow-lg ${glowColor}`}
      ${unit.buffs?.immune ? 'ring-2 ring-indigo-500/50' : ''}
    `}>
      {/* Level Badge */}
      {!isEnemy && !isDead && unit.level && (
        <div className={`absolute top-1 left-1 z-30 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black border shadow-lg ${
          unit.level === 1 ? 'bg-stone-600 text-stone-300 border-stone-500' :
          unit.level === 2 ? 'bg-green-600 text-stone-100 border-green-400' :
          unit.level === 3 ? 'bg-blue-600 text-stone-100 border-blue-400' :
          unit.level === 4 ? 'bg-purple-600 text-stone-100 border-purple-400' :
          'bg-amber-600 text-stone-100 border-amber-400'
        }`}>
          {unit.level}
        </div>
      )}
      
      {/* Header Name */}
      <div className="px-1 py-0.5 bg-black/60 border-b border-white/5 text-[8px] font-bold font-serif text-center truncate text-stone-300">
        {unit.name}
      </div>

      {/* Portrait / Icon */}
      <div className={`flex-1 flex items-center justify-center ${textColor} relative`}>
         {/* Background Glow */}
         <div className={`absolute inset-0 bg-gradient-to-t ${isEnemy ? 'from-red-900/20' : 'from-sky-900/20'} to-transparent opacity-50`} />
         <div className="relative z-10 filter drop-shadow-lg">
            {isDead ? <Skull size={24} /> : (unit.isBoss ? <Crown size={32} className="text-amber-500" /> : (isEnemy ? <User size={28} /> : <Shield size={28} />))}
         </div>
      </div>

      {/* Buffs Row */}
      {!isDead && (
        <div className="flex justify-center gap-1 pb-1 px-1 relative z-10">
           {unit.buffs?.tanking && <StatBadge icon={Shield} value="" color="text-sky-400 border-sky-800" />}
           {(unit.buffs?.augment || 0) > 0 && <StatBadge icon={Sword} value={unit.buffs.augment} color="text-amber-500 border-amber-800" />}
           {(unit.buffs?.anger || 0) > 0 && <StatBadge icon={Flame} value={unit.buffs?.anger || 0} color="text-orange-500 border-orange-800" />}
           {unit.buffs?.immune && <StatBadge icon={RefreshCw} value="" color="text-indigo-400 border-indigo-800" />}
        </div>
      )}

      {/* HP Bar */}
      {!isDead && (
        <div className="w-full px-1.5 py-1 bg-stone-950 relative border-t border-stone-800">
           <div className="flex items-center justify-center gap-0.5 flex-wrap">
             {/* Red hearts for current HP */}
             {Array.from({ length: unit.hp }).map((_, i) => (
               <Heart key={`hp-${i}`} size={10} className="text-red-600 fill-red-600" />
             ))}
             {/* Gray hearts for gray HP */}
             {Array.from({ length: unit.grayHp || 0 }).map((_, i) => (
               <Heart key={`gray-${i}`} size={10} className="text-stone-500 fill-stone-500" />
             ))}
             {/* Empty hearts for missing HP */}
             {Array.from({ length: unit.maxHp - unit.hp - (unit.grayHp || 0) }).map((_, i) => (
               <Heart key={`empty-${i}`} size={10} className="text-stone-700" />
             ))}
           </div>
        </div>
      )}

      {/* Action Button (Crusader - Provoke) */}
      {!isEnemy && !isDead && unit.id === 'crusader' && (
         <button 
           onClick={(e) => { e.stopPropagation(); if(onCrusaderAction) onCrusaderAction(); }} 
           disabled={unit.activeCooldown! > 0 || !unit.level || unit.level < 2}
           className={`absolute bottom-12 right-1 p-1 rounded-full border shadow-lg z-20 transition-all ${
             (unit.activeCooldown! > 0 || !unit.level || unit.level < 2)
               ? 'bg-stone-700 border-stone-600 shadow-stone-900/50 cursor-not-allowed opacity-50' 
               : 'bg-red-900 border-red-500 shadow-red-900/50 hover:scale-110'
           }`}
         >
            {unit.activeCooldown! > 0 ? (
              <span className="text-[8px] font-bold text-stone-400">{unit.activeCooldown}</span>
            ) : (!unit.level || unit.level < 2) ? (
              <Lock size={10} className="text-stone-400" />
            ) : (
              <Target size={10} className="text-red-200" />
            )}
         </button>
      )}
      
    </div>
  );
};
