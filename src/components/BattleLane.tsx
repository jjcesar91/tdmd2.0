import { Target, X } from 'lucide-react';
import { UnitPortrait } from './UnitPortrait';
import { Card } from './Card';
import { Unit, Card as CardData } from '../types';

interface BattleLaneProps {
  zoneLabel: string;
  enemyUnit: Unit | null;
  playerUnit: Unit | null;
  enemyCard: CardData | null;
  playerCard: CardData | null;
  onPlayerSlotClick: () => void;
  onEnemyCardClick?: () => void;
  isSelected: boolean;
  isValidTarget: boolean;
  onPreviewStart: (card: CardData, locked?: boolean) => void;
  onPreviewEnd: () => void;
  onCrusaderAction?: () => void;
  showTargetArrow?: boolean;
  showDefenseArrow?: boolean;
  onLaneHover?: () => void;
  onLaneLeave?: () => void;
  isResolving?: boolean;
  provokeMode?: boolean;
  isPlayerCardFlipped?: boolean;
  isEnemyCardRevealed?: boolean;
}

export const BattleLane = ({
  zoneLabel,
  enemyUnit,
  playerUnit,
  playerCard,
  onPlayerSlotClick,
  isValidTarget,
  onPreviewStart,
  onPreviewEnd,
  onCrusaderAction,
  showTargetArrow,
  showDefenseArrow,
  onLaneHover,
  onLaneLeave,
  isResolving,
  isPlayerCardFlipped
}: BattleLaneProps) => {
  return (
    <div 
      className={`
        flex-1 flex flex-col items-center gap-1 h-full px-1 py-2 border-r border-stone-800/50 last:border-r-0 relative transition-all duration-300
        ${isValidTarget ? 'bg-sky-900/10 shadow-[inset_0_0_30px_rgba(14,165,233,0.15)]' : ''}
        ${isResolving ? 'bg-amber-900/20 shadow-[inset_0_0_40px_rgba(251,191,36,0.3)] ring-2 ring-amber-500/50' : ''}
      `}
      onMouseEnter={onLaneHover}
      onMouseLeave={onLaneLeave}
    >
      {/* Zone Label Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
         <span className="text-6xl font-black font-serif text-stone-500">{zoneLabel}</span>
      </div>
      
      {/* Resolving Lane Indicator */}
      {isResolving && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-amber-500 text-black text-[10px] font-bold px-3 py-0.5 rounded-full shadow-lg animate-pulse whitespace-nowrap">
            RESOLVING
          </div>
        </div>
      )}

      {/* 1. TOP: ENEMY UNIT */}
      <div className="w-full h-[5%] min-h-[10px] relative z-0">
         {/* Extended Overflow Container for Overlay Effect */}
         <div className="absolute top-0 left-0 right-0 h-[45vh] pointer-events-none">
            {showTargetArrow && (
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                 <div className="flex flex-col items-center">
                   <div className="text-red-500 font-bold text-xs drop-shadow-lg">TARGET</div>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-500">
                     <path d="M12 4L12 20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                 </div>
               </div>
             )}
             <UnitPortrait unit={enemyUnit} isEnemy={true} />
         </div>
      </div>

      {/* 2. MIDDLE: CLASH ZONE */}
      <div className="flex-1 w-full flex flex-col justify-end items-center gap-2 py-2 relative z-10">
         {/* Vertical Divider */}
         <div className="absolute top-0 bottom-0 w-px bg-stone-800 z-0" />

         {/* Enemy Card Slot removed as per new layout */}

         {/* VS Icon */}
         <div className={`z-10 bg-stone-900 border border-stone-700 rounded-full p-1 shadow-md transition-all duration-300 ${isResolving ? 'scale-125 border-amber-500 bg-amber-900/30' : ''}`}>
            <X size={10} className={`text-stone-500 ${isResolving ? 'text-amber-400' : ''}`} />
         </div>

         {/* Player Card Slot */}
         <div 
            onClick={onPlayerSlotClick}
            className={`w-full aspect-[3/4] max-h-[130px] z-10 cursor-pointer transition-all duration-300 mt-2 flex items-center justify-center relative
               ${!playerCard ? 'border-2 border-dashed rounded-lg' : ''}
               ${!playerCard && isValidTarget ? 'border-sky-500/50 bg-sky-900/20 scale-105 shadow-[0_0_15px_rgba(14,165,233,0.4)]' : ''}
               ${!playerCard && !isValidTarget ? 'border-stone-800 bg-stone-900/30 hover:border-stone-600 hover:bg-stone-900/50' : ''}
            `}
         >
            {playerCard ? (
               <div className={`h-[95%] aspect-[2/3] transition-transform duration-300 ${
                  isResolving ? 'scale-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]' : ''
               }`}>
                  <Card 
                    {...playerCard} 
                    smallMode={true} 
                    isHidden={isPlayerCardFlipped || (playerCard.revealed === false && (playerCard.detained || 0) > 0 && isResolving)}
                    onPreviewStart={() => onPreviewStart && onPreviewStart(playerCard)}
                    onPreviewEnd={onPreviewEnd}
                    className={`w-full h-full text-[10px] ${isResolving ? 'ring-2 ring-sky-500 shadow-lg' : ''}`}
                  />
               </div>
            ) : (
               isValidTarget ? <Target size={24} className="text-sky-500 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-stone-800" />
            )}
         </div>
      </div>

      {/* 3. BOTTOM: PLAYER UNIT */}
      <div className="w-full h-[22%] min-h-[60px] relative">
         {showDefenseArrow && (
           <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
             <div className="flex flex-col items-center">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sky-500">
                 <path d="M12 20L12 4M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
               <div className="text-sky-500 font-bold text-xs drop-shadow-lg">PROTECT</div>
             </div>
           </div>
         )}
         <UnitPortrait 
           unit={playerUnit} 
           isEnemy={false} 
           onCrusaderAction={onCrusaderAction}
         />
      </div>
    </div>
  );
};
