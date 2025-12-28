import React, { useState, useRef, useEffect } from 'react';
import { Shield, Sword, Skull, RefreshCw, Play, Crown, Castle, Map as MapIcon, User, Layers, X, Trash2, Eye, FlaskConical, Target, Swords, Heart } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type CardType = 'ATTACK' | 'DEFENSE' | 'SKILL' | 'FAST';

interface Card {
  id: string;
  type: CardType;
  value: number;
  name: string;
  desc: string;
  ownerId?: string;
  uid?: number;
  isPotion?: boolean;
  color?: string;
  border?: string;
  range?: number;
  effect?: string;
  revealed?: boolean;
}

interface Buffs {
  immune: boolean;
  tanking: boolean;
  strength: number;
}

interface Unit {
  id: string;
  name: string;
  role?: string;
  desc: string;
  hp: number;
  maxHp: number;
  dead: boolean;
  buffs: Buffs;
  grayHp?: number;
  cards?: Card[];
  isBoss?: boolean;
}

interface CombatState {
  turn: number;
  phase: 'planning' | 'resolving';
  playerUnits: (Unit | null)[];
  enemyUnits: (Unit | null)[];
  playerHand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  enemyHand: Card[];
  playerZoneCards: (Card | null)[];
  enemyZoneCards: (Card | null)[];
  selectedCardIdx: number | null;
  scryActive: boolean;
  newlyDrawnCards: Set<number>;
  resolvingLane: number | null;
}

// --- CONFIGURAZIONE ---

const ZONES = ['F', 'M', 'R'];

const POTIONS_DB: Card[] = [
  { id: 'pot_heal', type: 'SKILL', value: 3, name: 'Healing Potion', desc: 'Heal 3 HP', isPotion: true, color: 'bg-emerald-950', border: 'border-emerald-700' },
  { id: 'pot_inv', type: 'SKILL', value: 0, name: 'Invis. Potion', desc: 'Immune 1 round', isPotion: true, color: 'bg-indigo-950', border: 'border-indigo-700' },
  { id: 'pot_str', type: 'SKILL', value: 2, name: 'Str. Potion', desc: '+2 DMG next', isPotion: true, color: 'bg-amber-950', border: 'border-amber-700' }
];

const HEROES_DB = [
  {
    id: 'crusader',
    name: 'Crusader',
    role: 'TANK',
    desc: 'Passive: Gain 1 Gray Heart each round.',
    hp: 5,
    maxHp: 5,
    cards: [
      { id: 'c_van', type: 'ATTACK', value: 1, name: 'Vanguard', desc: 'Deal 1. Tank Right.', effect: 'TANK_RIGHT' },
      { id: 'c_van', type: 'ATTACK', value: 1, name: 'Vanguard', desc: 'Deal 1. Tank Right.', effect: 'TANK_RIGHT' },
      { id: 'c_van', type: 'ATTACK', value: 1, name: 'Vanguard', desc: 'Deal 1. Tank Right.', effect: 'TANK_RIGHT' },
      { id: 'c_beh', type: 'DEFENSE', value: 1, name: 'Behind Me', desc: 'Prevent 1 Right.', effect: 'DEF_RIGHT' },
      { id: 'c_beh', type: 'DEFENSE', value: 1, name: 'Behind Me', desc: 'Prevent 1 Right.', effect: 'DEF_RIGHT' },
    ]
  },
  {
    id: 'ranger',
    name: 'Ranger',
    role: 'DPS',
    desc: 'Cards can target distant lanes.',
    hp: 3,
    maxHp: 3,
    cards: [
      { id: 'r_arr', type: 'ATTACK', value: 1, name: 'Arrow Shot', desc: 'Deal 1. Ranged 2.', range: 2 },
      { id: 'r_arr', type: 'ATTACK', value: 1, name: 'Arrow Shot', desc: 'Deal 1. Ranged 2.', range: 2 },
      { id: 'r_arr', type: 'ATTACK', value: 1, name: 'Arrow Shot', desc: 'Deal 1. Ranged 2.', range: 2 },
      { id: 'r_trk', type: 'FAST', value: 0, name: 'Track', desc: 'Scry enemy lane.', effect: 'SCRY_LANE', range: 1 },
      { id: 'r_trk', type: 'FAST', value: 0, name: 'Track', desc: 'Scry enemy lane.', effect: 'SCRY_LANE', range: 1 },
    ]
  },
  {
    id: 'prophet',
    name: 'Prophet',
    role: 'SUPP',
    desc: 'Passive: Map Vision. Active: Scry All.',
    hp: 3,
    maxHp: 3,
    cards: [] // No cards in deck
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    role: 'WILD',
    desc: 'Passive: Craft potion on Draw.',
    hp: 4,
    maxHp: 4,
    cards: [
      { id: 'a_fla', type: 'ATTACK', value: 1, name: 'Explosive', desc: 'Deal 1. Unpreventable.', effect: 'UNPREV_NEXT' },
      { id: 'a_fla', type: 'ATTACK', value: 1, name: 'Explosive', desc: 'Deal 1. Unpreventable.', effect: 'UNPREV_NEXT' },
      { id: 'a_fla', type: 'ATTACK', value: 1, name: 'Explosive', desc: 'Deal 1. Unpreventable.', effect: 'UNPREV_NEXT' },
    ]
  }
];

const ENEMIES_DB = [
  { name: 'Skeleton', hp: 2, deckType: 'weak' },
  { name: 'Orc Warrior', hp: 5, deckType: 'medium' },
  { name: 'Shadow Wraith', hp: 3, deckType: 'tricky' },
  { name: 'Goblin Shaman', hp: 3, deckType: 'support' },
  { name: 'Armored Knight', hp: 6, deckType: 'tank' },
  { name: 'Dark Assassin', hp: 4, deckType: 'burst' },
  { name: 'Necromancer', hp: 4, deckType: 'summoner' },
  { name: 'Blood Cultist', hp: 4, deckType: 'buff_enemy' },
  { name: 'Void Mage', hp: 3, deckType: 'defense_spam' },
  { name: 'Berserker', hp: 5, deckType: 'big_damage' },
  { name: 'Plague Doctor', hp: 3, deckType: 'multi_hit' },
  { name: 'ANCIENT DRAGON', hp: 15, deckType: 'boss', isBoss: true }
];

// --- UI HELPERS ---

const StatBadge = ({ icon: Icon, value, color }: { icon: any; value: number | string; color: string }) => (
  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 border border-stone-600 shadow-sm backdrop-blur-md ${color}`}>
    <Icon size={10} />
    {value && <span className="text-[10px] font-bold font-serif">{value}</span>}
  </div>
);

// --- CARD COMPONENT ---

interface CardProps extends Partial<Card> {
  isHidden?: boolean;
  onPreviewStart?: () => void;
  onPreviewEnd?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  className?: string;
  smallMode?: boolean;
}

const Card = ({ type, ownerId, name, desc, isHidden, onPreviewStart, onPreviewEnd, onClick, isSelected, disabled, isPotion, range, className = "", smallMode = false }: CardProps) => {
  const timerRef = useRef<number | null>(null);

  const handleStart = (_e: React.MouseEvent | React.TouchEvent) => {
    if (!disabled && onPreviewStart) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onPreviewStart();
      }, 1000);
    }
  };

  const handleEnd = (_e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (onPreviewEnd) onPreviewEnd();
  };

  if (isHidden) {
    return (
      <div className={`relative bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 border-3 border-stone-600 rounded-xl shadow-2xl overflow-hidden ${className}`}>
        {/* Diagonal stripe pattern - more visible */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)',
        }} />
        
        {/* Ornamental borders - more solid */}
        <div className="absolute inset-2 border-2 border-stone-600/80 rounded-lg" />
        <div className="absolute inset-4 border border-stone-500/60 rounded-md" />
        
        {/* Center symbol - more solid */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Outer diamond */}
            <div className="w-12 h-12 bg-stone-700/80 border-2 border-stone-500/80 rotate-45 shadow-lg" />
            {/* Inner diamond */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-stone-800/90 border-2 border-stone-400/70 rotate-45" />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-stone-400 rounded-full shadow-inner" />
          </div>
        </div>
      </div>
    );
  }

  const isAttack = type === 'ATTACK';
  const isSkill = type === 'SKILL';
  const isFast = type === 'FAST';
  
  // Neutral card design - only icon has color
  let iconColor = isPotion ? "text-emerald-400" : (isAttack ? "text-red-400" : (isFast ? "text-amber-400" : (isSkill ? "text-indigo-400" : "text-blue-400")));
  let highlightColor = isPotion ? "shadow-emerald-500/30" : (isAttack ? "shadow-red-500/30" : (isFast ? "shadow-amber-500/30" : (isSkill ? "shadow-indigo-500/30" : "shadow-blue-500/30")));

  if (disabled) {
      iconColor = "text-stone-500";
  }

  const typeLabel = isAttack ? 'ATTACK' : (isFast ? 'FAST' : (isSkill ? 'SKILL' : 'DEFENSE'));

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      className={`
        relative rounded-xl shadow-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col select-none
        bg-gradient-to-br from-stone-800 via-stone-900 to-black border-stone-700
        ${isSelected ? `ring-4 ring-amber-400/80 scale-105 z-20 ${highlightColor}` : 'active:scale-95'}
        ${disabled ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:-translate-y-2 hover:shadow-2xl'}
        ${className}
      `}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* Top corner indicator */}
      {!smallMode && range !== undefined && range > 0 && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-950/80 border border-stone-600 flex items-center justify-center z-10">
          <span className="text-[8px] font-bold text-stone-300">R{range}</span>
        </div>
      )}

      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-2 relative z-10">
         {/* Icon above name */}
         {!smallMode && (
           <div className={`${iconColor} drop-shadow-lg mb-2`}>
              {isPotion ? <FlaskConical size={32}/> : (isAttack ? <Sword size={32} /> : (isFast ? <Target size={32}/> : (isSkill ? <Eye size={32}/> : <Shield size={32} />)))}
           </div>
         )}
         
         {/* Icon for small mode */}
         {smallMode && (
           <div className={`${iconColor} drop-shadow-lg`}>
              {isPotion ? <FlaskConical size={20}/> : (isAttack ? <Sword size={20} /> : (isFast ? <Target size={20}/> : (isSkill ? <Eye size={20}/> : <Shield size={20} />)))}
           </div>
         )}

         {/* Card Name - Always centered */}
         {!smallMode && (
           <div className="px-1.5 py-0.5 bg-stone-950/90 border border-stone-700 rounded-full mb-1">
             <span className="text-[6px] font-bold text-stone-100 uppercase tracking-wide font-serif">{name}</span>
           </div>
         )}
          
         {/* Description below name */}
         {!smallMode && (
           <div className="text-[7px] text-center text-stone-300 leading-tight w-full px-2 line-clamp-3">
             {desc}
           </div>
         )}
      </div>

      {/* Bottom Info Bar */}
      {!smallMode && (
        <div className="w-full px-2 py-1 bg-black/40 border-t border-stone-800 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-1">
            <span className="text-[7px] text-stone-400 uppercase tracking-wider">{typeLabel}</span>
          </div>
          {ownerId && (
            <div className="text-[7px] font-bold text-stone-500 uppercase tracking-wider">
              {ownerId === 'crusader' ? 'KNIGHT' : ownerId.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- UNIT COMPONENT ---

interface UnitPortraitProps {
  unit: Unit | null;
  isEnemy: boolean;
  onProphetAction?: () => void;
}

const UnitPortrait = ({ unit, isEnemy, onProphetAction }: UnitPortraitProps) => {
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
           {unit.buffs?.strength > 0 && <StatBadge icon={Sword} value={unit.buffs.strength} color="text-amber-500 border-amber-800" />}
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

      {/* Action Button (Prophet) */}
      {!isEnemy && !isDead && unit.id === 'prophet' && (
         <button onClick={(e) => { e.stopPropagation(); if(onProphetAction) onProphetAction(); }} className="absolute bottom-12 right-1 p-1 bg-violet-900 rounded-full border border-violet-500 shadow-lg shadow-violet-900/50 hover:scale-110 z-20">
            <Eye size={10} className="text-violet-200" />
         </button>
      )}
    </div>
  );
};

// --- BATTLE LANE COMPONENT ---

interface BattleLaneProps {
  zoneLabel: string;
  enemyUnit: Unit | null;
  playerUnit: Unit | null;
  enemyCard: Card | null;
  playerCard: Card | null;
  onPlayerSlotClick: () => void;
  isSelected: boolean;
  isValidTarget: boolean;
  onPreviewStart: (card: Card) => void;
  onPreviewEnd: () => void;
  onProphetAction?: () => void;
  showTargetArrow?: boolean;
  onLaneHover?: () => void;
  onLaneLeave?: () => void;
  isResolving?: boolean;
}

const BattleLane = ({ zoneLabel, enemyUnit, playerUnit, enemyCard, playerCard, onPlayerSlotClick, isValidTarget, onPreviewStart, onPreviewEnd, onProphetAction, showTargetArrow, onLaneHover, onLaneLeave, isResolving }: BattleLaneProps) => {
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
      <div className="w-full h-[22%] min-h-[60px] relative">
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

      {/* 2. MIDDLE: CLASH ZONE */}
      <div className="flex-1 w-full flex flex-col justify-center items-center gap-2 py-2 relative">
         {/* Vertical Divider */}
         <div className="absolute top-0 bottom-0 w-px bg-stone-800 z-0" />

         {/* Enemy Card Slot */}
         <div className={`w-full aspect-[2/3] max-h-[80px] z-10 transition-all duration-300 ${isResolving && enemyCard ? 'scale-110 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]' : ''}`}>
            {enemyCard ? (
               <Card 
                 {...enemyCard} 
                 isHidden={!enemyCard.revealed} 
                 smallMode={true} 
                 onPreviewStart={() => onPreviewStart && onPreviewStart(enemyCard)}
                 onPreviewEnd={onPreviewEnd}
                 className={`w-full h-full text-[10px] ${isResolving ? 'ring-2 ring-red-500 shadow-lg' : ''}`}
               />
            ) : (
               // Empty Enemy Slot - Matches Player Style
               <div className="w-full h-full border-2 border-dashed border-stone-800 bg-stone-900/20 rounded-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
               </div>
            )}
         </div>

         {/* VS Icon */}
         <div className={`z-10 bg-stone-900 border border-stone-700 rounded-full p-1 shadow-md transition-all duration-300 ${isResolving ? 'scale-125 border-amber-500 bg-amber-900/30' : ''}`}>
            <X size={10} className={`text-stone-500 ${isResolving ? 'text-amber-400' : ''}`} />
         </div>

         {/* Player Card Slot */}
         <div 
            onClick={onPlayerSlotClick}
            className={`w-full aspect-[2/3] max-h-[80px] z-10 cursor-pointer transition-all duration-300 mt-2
              ${!playerCard && isValidTarget ? 'scale-105 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.4)]' : ''}
              ${isResolving && playerCard ? 'scale-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]' : ''}
            `}
         >
            {playerCard ? (
               <Card 
                 {...playerCard} 
                 smallMode={true} 
                 onPreviewStart={() => onPreviewStart && onPreviewStart(playerCard)}
                 onPreviewEnd={onPreviewEnd}
                 className={`w-full h-full text-[10px] ${isResolving ? 'ring-2 ring-sky-500 shadow-lg' : ''}`}
               />
            ) : (
               <div className={`w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center transition-colors 
                  ${isValidTarget ? 'border-sky-500/50 bg-sky-900/20' : 'border-stone-800 bg-stone-900/30 hover:border-stone-600 hover:bg-stone-900/50'}`}>
                  {isValidTarget ? <Target size={16} className="text-sky-500 animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />}
               </div>
            )}
         </div>
      </div>

      {/* 3. BOTTOM: PLAYER UNIT */}
      <div className="w-full h-[22%] min-h-[60px]">
         <UnitPortrait unit={playerUnit} isEnemy={false} onProphetAction={onProphetAction} />
      </div>
    </div>
  );
};


// --- MAIN APP ---

export default function TheDragonMustDie() {
  const [view, setView] = useState<string>('START');
  const [party, setParty] = useState<Unit[]>([]);
  const [partyLanes, setPartyLanes] = useState<{[heroId: string]: number}>({});
  const [selectedHero, setSelectedHero] = useState<string | null>(null);
  const [globalDeck, setGlobalDeck] = useState<Card[]>([]);
  const [mapNode, setMapNode] = useState<number>(0);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Modals & UI State
  const [showDeckModal, setShowDeckModal] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);

  // Clear animation flags after animation completes
  useEffect(() => {
    if (view === 'COMBAT' && combatState?.newlyDrawnCards && combatState.newlyDrawnCards.size > 0) {
      const timer = setTimeout(() => {
        setCombatState(prev => prev ? { ...prev, newlyDrawnCards: new Set() } : prev);
      }, 600); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [view, combatState?.newlyDrawnCards]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 3));

  // --- LOGIC FUNCTIONS (Unchanged logic) ---
  const startDraft = () => { setParty([]); setPartyLanes({}); setSelectedHero(null); setView('DRAFT'); };
  const handleDraftSelect = (hero: any) => {
    if (party.find(p => p.id === hero.id)) {
      setParty(party.filter(p => p.id !== hero.id));
      const newLanes = {...partyLanes};
      delete newLanes[hero.id];
      setPartyLanes(newLanes);
      setSelectedHero(null);
    }
    else if (party.length < 3) {
      setParty([...party, hero]);
      setSelectedHero(hero.id);
    }
  };
  
  const handleLaneSelect = (laneIdx: number) => {
    if (!selectedHero) return;
    
    const laneTaken = Object.entries(partyLanes).find(([id, lane]) => lane === laneIdx && id !== selectedHero);
    if (laneTaken) {
      // Swap lanes
      const [otherId] = laneTaken;
      const currentLane = partyLanes[selectedHero];
      setPartyLanes({...partyLanes, [selectedHero]: laneIdx, [otherId]: currentLane});
    } else {
      setPartyLanes({...partyLanes, [selectedHero]: laneIdx});
    }
    setSelectedHero(null);
  };
  const finalizeDraft = () => {
    if (party.length !== 3) return;
    let deck: Card[] = [];
    party.forEach(hero => {
      if (hero.cards) { const heroCards = hero.cards.map(c => ({...c, ownerId: hero.id, uid: Math.random()})); deck = [...deck, ...heroCards]; }
    });
    setGlobalDeck(deck); setMapNode(0); setView('MAP');
  };

  const enterCombat = (enemyType: string) => {
    let enemies: (Unit | null)[] = [null, null, null];
    if (enemyType === 'boss') {
      // BOSS ENCOUNTER: Dragon + Void Mages (require Prophet scry + Ranger range)
      enemies[1] = { ...ENEMIES_DB.find(e => e.isBoss)!, id: 'boss', name: 'ANCIENT DRAGON', desc: '', maxHp: 15, hp: 15, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
      enemies[0] = { name: 'Void Mage', id: 'guard1', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
      enemies[2] = { name: 'Void Mage', id: 'guard2', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
    } else {
      // STRATEGIC ENCOUNTERS designed for Crusader (F) / Prophet (M) / Ranger (R)
      const encounterType = Math.floor(Math.random() * 8);
      
      switch(encounterType) {
        case 0: // "THE PRESSURE" - Swarm with surprise burst
          // Challenge: Multiple weak enemies + one assassin. Requires prioritization.
          // Prophet scry reveals which skeleton is actually the assassin!
          enemies[0] = { name: 'Skeleton', id: 'fake1', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[1] = { name: 'Dark Assassin', id: 'assassin', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[2] = { name: 'Skeleton', id: 'fake2', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 1: // "THE WALL" - Tank + Support behind
          // Challenge: Knight tanks, Cultist buffs him. Must kill cultist first (Ranger!)
          // If cultist survives, knight becomes unkillable
          enemies[0] = { name: 'Armored Knight', id: 'tank', desc: '', hp: 6, maxHp: 6, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[2] = { name: 'Blood Cultist', id: 'buffer', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 2: // "THE FLANKERS" - Speed vs Defense choice
          // Challenge: 2 Wraiths on sides deal big damage if not blocked
          // Crusader can only tank one side! Which one?
          enemies[0] = { name: 'Shadow Wraith', id: 'wraith1', desc: '', hp: 3, maxHp: 3, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[2] = { name: 'Shadow Wraith', id: 'wraith2', desc: '', hp: 3, maxHp: 3, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 3: // "THE SHIELD WALL" - Defense spam test
          // Challenge: Void Mage + Knight both spam defense
          // Requires multi-turn setup or unprevantable damage (Alchemist explosive)
          enemies[1] = { name: 'Void Mage', id: 'mage', desc: '', hp: 3, maxHp: 3, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[0] = { name: 'Armored Knight', id: 'knight', desc: '', hp: 6, maxHp: 6, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 4: // "THE NECROMANCER" - Value race
          // Challenge: Necromancer summons minions each turn
          // Must rush him down before overwhelmed (Ranger focus!)
          enemies[1] = { name: 'Necromancer', id: 'necro', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[0] = { name: 'Skeleton', id: 'minion1', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[2] = { name: 'Skeleton', id: 'minion2', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 5: // "THE EXECUTIONER" - Single massive threat
          // Challenge: Berserker deals 4-5 damage per turn
          // Crusader MUST tank it or Prophet/Ranger die instantly
          enemies[1] = { name: 'Berserker', id: 'zerk', desc: '', hp: 5, maxHp: 5, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 6: // "THE PLAGUE" - Multi-hit nightmare
          // Challenge: Plague Doctor hits all lanes for 1 damage
          // Prophet scry essential to know when to defend all lanes
          enemies[1] = { name: 'Plague Doctor', id: 'plague', desc: '', hp: 3, maxHp: 3, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[0] = { name: 'Skeleton', id: 'carrier1', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[2] = { name: 'Skeleton', id: 'carrier2', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 7: // "THE CULT" - Synergy hell
          // Challenge: Blood Cultist buffs Warrior, Shaman provides defense
          // Must kill in correct order or face stacked buffs
          enemies[0] = { name: 'Orc Warrior', id: 'warrior', desc: '', hp: 5, maxHp: 5, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[1] = { name: 'Blood Cultist', id: 'cultist', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[2] = { name: 'Goblin Shaman', id: 'shaman', desc: '', hp: 3, maxHp: 3, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
      }
    }
    
    // Place heroes in their assigned lanes
    const combatParty: (Unit | null)[] = [null, null, null];
    party.forEach(hero => {
      const laneIdx = partyLanes[hero.id] !== undefined ? partyLanes[hero.id] : party.indexOf(hero);
      combatParty[laneIdx] = { ...hero, grayHp: 0, buffs: { immune: false, tanking: false, strength: 0 } };
    });
    
    const combatDeck = [...globalDeck].sort(() => Math.random() - 0.5);
    
    // Strategic encounter descriptions
    let encounterHint = "Battle Started!";
    if (enemyType !== 'boss') {
      const enemyNames = enemies.filter(e => e !== null).map(e => e!.name).join(', ');
      encounterHint = `Encounter: ${enemyNames}`;
    }

    setCombatState({
      turn: 1, phase: 'planning', playerUnits: combatParty, enemyUnits: enemies, playerHand: [], drawPile: combatDeck, discardPile: [], enemyHand: [], playerZoneCards: [null, null, null], enemyZoneCards: [null, null, null], selectedCardIdx: null, scryActive: false, newlyDrawnCards: new Set(), resolvingLane: null
    });
    
    startTurnLogic({ turn: 1, playerUnits: combatParty, enemyUnits: enemies, drawPile: combatDeck, discardPile: [], enemyHand: [] });
    setLogs([encounterHint]); setView('COMBAT');
  };

  const startTurnLogic = (state: Partial<CombatState>) => {
      let newPUnits = (state.playerUnits || []).map((u: Unit | null) => {
          if (!u || u.dead) return u;
          let unit = { ...u, buffs: { ...u.buffs, tanking: false, immune: false, strength: 0 } };
          if (unit.id === 'crusader') unit.grayHp = (unit.grayHp || 0) + 1;
          return unit;
      });
      let newDraw = [...(state.drawPile || [])]; let newDiscard = [...(state.discardPile || [])]; let newHand: Card[] = [];
      const newlyDrawnSet = new Set<number>();
      const alchemist = newPUnits.find((u: Unit | null) => u && !u.dead && u.id === 'alchemist');
      if (alchemist) { const pot = POTIONS_DB[Math.floor(Math.random() * POTIONS_DB.length)]; const uid = Math.random(); newHand.push({ ...pot, uid, ownerId: 'alchemist' }); newlyDrawnSet.add(uid); }
      for(let i=0; i<5; i++) {
        if (newDraw.length === 0) { if (newDiscard.length === 0) break; newDraw = newDiscard.sort(()=>Math.random()-0.5); newDiscard = []; }
        const drawnCard = newDraw.pop()!;
        newlyDrawnSet.add(drawnCard.uid || Math.random());
        newHand.push(drawnCard);
      }
      // Generate enemy cards based on enemy types for strategic variety
      const eHand: Card[] = [];
      const aliveEnemies = (state.enemyUnits || []).filter((e: Unit | null) => e && !e.dead);
      const count = aliveEnemies.length + 1;
      
      // Generate cards matching enemy deck types for flavor and strategy
      for(let i=0; i<count; i++) {
        const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        const enemyData = randomEnemy ? ENEMIES_DB.find(e => e.name === randomEnemy.name) : null;
        const deckType = enemyData?.deckType || 'weak';
        
        let card: Card;
        switch(deckType) {
          case 'weak': // Skeletons: low damage, mostly attack
            card = { id: 'enemy_card', type: 'ATTACK', value: 1, name: 'Rusty Blade', desc: '' };
            break;
          case 'medium': // Orc Warrior: balanced
            card = { id: 'enemy_card', type: Math.random() > 0.5 ? 'ATTACK' : 'DEFENSE', value: 2, name: 'Warrior Strike', desc: '' };
            break;
          case 'tricky': // Shadow Wraith: unpredictable mix
            card = { id: 'enemy_card', type: Math.random() > 0.7 ? 'DEFENSE' : 'ATTACK', value: 1 + Math.floor(Math.random()*2), name: 'Shadow Move', desc: '' };
            break;
          case 'support': // Goblin Shaman: mostly defense
            card = { id: 'enemy_card', type: 'DEFENSE', value: 2, name: 'Mystic Ward', desc: '' };
            break;
          case 'tank': // Armored Knight: high defense
            card = { id: 'enemy_card', type: 'DEFENSE', value: 3, name: 'Shield Wall', desc: '' };
            break;
          case 'burst': // Dark Assassin: high attack, low defense
            card = { id: 'enemy_card', type: Math.random() > 0.8 ? 'DEFENSE' : 'ATTACK', value: 3, name: 'Assassinate', desc: '' };
            break;
          case 'buff_enemy': // Blood Cultist: buffs nearby enemies (simulated as high defense)
            card = { id: 'enemy_card', type: 'DEFENSE', value: 2 + Math.floor(Math.random()*2), name: 'Blood Ritual', desc: '' };
            break;
          case 'defense_spam': // Void Mage: spam defense cards
            card = { id: 'enemy_card', type: 'DEFENSE', value: 2 + Math.floor(Math.random()*2), name: 'Void Barrier', desc: '' };
            break;
          case 'big_damage': // Berserker: huge damage
            card = { id: 'enemy_card', type: 'ATTACK', value: 4 + Math.floor(Math.random()*2), name: 'Brutal Cleave', desc: '' };
            break;
          case 'multi_hit': // Plague Doctor: multiple small hits (simulated as consistent 2 damage)
            card = { id: 'enemy_card', type: 'ATTACK', value: 2, name: 'Plague Spit', desc: '' };
            break;
          case 'summoner': // Necromancer: balanced with more cards
            card = { id: 'enemy_card', type: Math.random() > 0.6 ? 'ATTACK' : 'DEFENSE', value: 1 + Math.floor(Math.random()*2), name: 'Dark Magic', desc: '' };
            break;
          case 'boss': // Dragon: devastating attacks
            card = { id: 'enemy_card', type: Math.random() > 0.7 ? 'DEFENSE' : 'ATTACK', value: 3 + Math.floor(Math.random()*3), name: 'Dragon Fury', desc: '' };
            break;
          default:
            card = { id: 'enemy_card', type: Math.random() > 0.6 ? 'ATTACK' : 'DEFENSE', value: 1 + Math.floor(Math.random()*2), name: 'Action', desc: '' };
        }
        eHand.push(card);
      }
      
      let enemyZones: (Card | null)[] = [null, null, null];
      const indices = [0, 1, 2].sort(() => Math.random() - 0.5);
      for (let idx of indices) { 
          if (eHand.length > 0 && !enemyZones[idx] && state.enemyUnits && state.enemyUnits[idx] && !state.enemyUnits[idx]!.dead) {
              enemyZones[idx] = { ...eHand.pop()!, revealed: false }; 
          }
      }

      setCombatState(prev => ({
          ...prev!, ...state, phase: 'planning', playerUnits: newPUnits, playerHand: newHand, drawPile: newDraw, discardPile: newDiscard, enemyHand: eHand, playerZoneCards: [null, null, null], enemyZoneCards: enemyZones, scryActive: false, newlyDrawnCards: newlyDrawnSet, resolvingLane: null
      }));
  };

  const onProphetAction = () => {
     if (!combatState || combatState.scryActive) return;
     // Reveal all enemy cards immediately
     setCombatState(prev => ({ 
       ...prev!, 
       scryActive: true,
       enemyZoneCards: prev!.enemyZoneCards.map(c => c ? { ...c, revealed: true } : null)
     }));
     addLog("Prophet reveals all enemy intentions!");
  };

  const handleZoneClick = (idx: number) => {
    if (!combatState || combatState.phase !== 'planning') return;
    const { playerZoneCards, playerHand, selectedCardIdx, playerUnits, enemyZoneCards } = combatState;
    if (playerZoneCards[idx]) { 
      const card = playerZoneCards[idx]!;
      setCombatState(prev => ({...prev!, playerHand: [...prev!.playerHand, card], playerZoneCards: prev!.playerZoneCards.map((c, i) => i === idx ? null : c)}));
      return;
    }
    if (selectedCardIdx !== null) { 
      const card = playerHand[selectedCardIdx];
      const ownerIndex = playerUnits.findIndex((u: Unit | null) => u && u.id === card.ownerId);
      if (!card.isPotion) {
          if (ownerIndex === -1) { addLog("Hero is missing!"); return; } 
          const distance = Math.abs(idx - ownerIndex);
          const range = card.range || 0;
          if (distance > range) { addLog(range > 0 ? `Out of Range (${range})` : "Must play in Hero's lane"); return; }
      } else { if (!playerUnits[idx]) return; }

      // Handle FAST cards - activate immediately and discard
      if (card.type === 'FAST') {
          let newEnemyZones = [...enemyZoneCards];
          if (card.effect === 'SCRY_LANE' && newEnemyZones[idx]) {
              newEnemyZones[idx] = { ...newEnemyZones[idx]!, revealed: true };
              addLog("Scried Enemy Intent!");
          }
          // FAST cards are discarded immediately, not placed in zone
          setCombatState(prev => ({
              ...prev!, 
              playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx), 
              discardPile: [...prev!.discardPile, card],
              enemyZoneCards: newEnemyZones, 
              selectedCardIdx: null 
          }));
          return;
      }
      
      // Normal cards are placed in zone
      let newEnemyZones = [...enemyZoneCards];
      if (card.effect === 'SCRY_LANE' && newEnemyZones[idx]) {
          newEnemyZones[idx] = { ...newEnemyZones[idx]!, revealed: true };
          addLog("Scried Enemy Intent!");
      }
      setCombatState(prev => ({...prev!, playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx), playerZoneCards: prev!.playerZoneCards.map((c, i) => i === idx ? card : c), enemyZoneCards: newEnemyZones, selectedCardIdx: null }));
    }
  };

  const handleEndTurn = async () => {
    if (!combatState || combatState.phase !== 'planning') return;
    setCombatState(prev => ({ ...prev!, phase: 'resolving', selectedCardIdx: null }));
    setCombatState(prev => ({ ...prev!, enemyZoneCards: prev!.enemyZoneCards.map(c => c ? { ...c, revealed: true } : null) }));
    await new Promise(r => setTimeout(r, 800));

    let pUnits = [...combatState.playerUnits]; let eUnits = [...combatState.enemyUnits];
    let pZones = combatState.playerZoneCards; let eZones = combatState.enemyZoneCards.map(c => c ? { ...c, revealed: true } : null);

    const applyEffects = (card: Card | null, sourceUnit: Unit | null) => {
        if (!card || !sourceUnit || sourceUnit.dead) return;
        if (card.id === 'pot_heal') sourceUnit.hp = Math.min(sourceUnit.maxHp, sourceUnit.hp + 3);
        if (card.id === 'pot_inv') sourceUnit.buffs.immune = true;
        if (card.id === 'pot_str') sourceUnit.buffs.strength += 2;
        if (card.effect === 'TANK_RIGHT') sourceUnit.buffs.tanking = true;
    };
    for (let i = 0; i < 3; i++) applyEffects(pZones[i], pUnits[i]);

    for (let i = 0; i < 3; i++) {
        // Highlight current resolving lane
        setCombatState(prev => ({ ...prev!, resolvingLane: i }));
        await new Promise(r => setTimeout(r, 400));
        
        const pCard = pZones[i]; const eCard = eZones[i]; const pUnit = pUnits[i]; const eUnit = eUnits[i];
        let msg = "";
        
        if (pUnit && !pUnit.dead && pCard) {
            let dmg = (pCard.type === 'ATTACK' ? pCard.value : 0) + (pUnit.buffs.strength || 0);
            let targetIdx = i; 
            // If enemy lane is empty/dead, find adjacent or farthest alive enemy
            if (!eUnits[i] || eUnits[i]!.dead) {
                // Priority 1: Left adjacent (i-1)
                if (i > 0 && eUnits[i-1] && !eUnits[i-1]!.dead) {
                    targetIdx = i - 1;
                }
                // Priority 2: Right adjacent (i+1)
                else if (i < 2 && eUnits[i+1] && !eUnits[i+1]!.dead) {
                    targetIdx = i + 1;
                }
                // Priority 3: Farthest alive enemy
                else {
                    const candidates = [0,1,2].filter(idx => eUnits[idx] && !eUnits[idx]!.dead);
                    if (candidates.length > 0) {
                        // Find farthest from current lane
                        targetIdx = candidates.reduce((farthest, current) => 
                            Math.abs(current - i) > Math.abs(farthest - i) ? current : farthest
                        );
                    }
                }
            }
            let reduction = (eZones[targetIdx]?.type === 'DEFENSE') ? (eZones[targetIdx]?.value || 0) : 0;
            let finalDmg = Math.max(0, dmg - reduction);
            if (finalDmg > 0 && eUnits[targetIdx]) {
                eUnits[targetIdx]!.hp -= finalDmg;
                if (eUnits[targetIdx]!.hp <= 0) { eUnits[targetIdx]!.dead = true; eUnits[targetIdx]!.hp = 0; }
                msg += `Hit ${finalDmg}! `;
            }
        }
        
        if (eUnit && !eUnit.dead && eCard) {
            let dmg = (eCard.type === 'ATTACK' ? eCard.value : 0);
            let targetIdx = i;
            if (!pUnits[i] || pUnits[i]!.dead) {
               const candidates = [0,1,2].filter(idx => pUnits[idx] && !pUnits[idx]!.dead);
               if (candidates.length > 0) targetIdx = candidates[0];
            }
            let targetUnit = pUnits[targetIdx];
            if (targetIdx > 0 && pUnits[targetIdx-1]?.buffs?.tanking && !pUnits[targetIdx-1]!.dead) { targetUnit = pUnits[targetIdx-1]; msg += "Tank! "; }

            if (targetUnit) {
                if (targetUnit.buffs.immune) { msg += "Immune! "; } else {
                    let reduction = (pZones[targetIdx]?.type === 'DEFENSE') ? (pZones[targetIdx]?.value || 0) : 0;
                    if (targetIdx > 0 && pZones[targetIdx-1]?.effect === 'DEF_RIGHT') reduction += (pZones[targetIdx-1]?.value || 0);
                    let finalDmg = Math.max(0, dmg - reduction);
                    if (finalDmg > 0 && (targetUnit.grayHp || 0) > 0) { const abs = Math.min(finalDmg, targetUnit.grayHp || 0); targetUnit.grayHp = (targetUnit.grayHp || 0) - abs; finalDmg -= abs; }
                    if (finalDmg > 0) {
                        targetUnit.hp -= finalDmg;
                        if (targetUnit.hp <= 0) { targetUnit.dead = true; targetUnit.hp = 0; msg += "Down! "; }
                        else msg += `Took ${finalDmg}. `;
                    }
                }
            }
        }
        if (msg) addLog(msg);
        setCombatState(prev => ({ ...prev!, playerUnits: [...pUnits], enemyUnits: [...eUnits] }));
        await new Promise(r => setTimeout(r, 600));
    }
    
    // Clear resolving lane highlight
    setCombatState(prev => ({ ...prev!, resolvingLane: null }));

    const deadHeroes = pUnits.filter((u): u is Unit => u !== null && u.dead);
    let newGlobalDeck = [...globalDeck];
    let newDiscard = [...combatState.discardPile, ...pZones.filter((c): c is Card => c !== null), ...combatState.playerHand];
    let newDrawPile = [...combatState.drawPile];
    pUnits = pUnits.map(u => u ? {...u, grayHp: 0} : null);

    if (deadHeroes.length > 0) {
        deadHeroes.forEach(hero => {
            newGlobalDeck = newGlobalDeck.filter(c => c.ownerId !== hero.id);
            newDrawPile = newDrawPile.filter(c => c.ownerId !== hero.id);
            newDiscard = newDiscard.filter(c => c.ownerId !== hero.id);
        });
    }

    const allHeroesDead = pUnits.every(u => !u || u.dead);
    const allEnemiesDead = eUnits.every(u => !u || u.dead);

    if (allHeroesDead) { setView('GAMEOVER'); setLogs(['Expedition Failed.']); return; }
    if (allEnemiesDead) {
        setLogs(['Victory!']); setGlobalDeck(newGlobalDeck); setParty(pUnits.filter((u): u is Unit => u !== null && !u.dead));
        if (mapNode >= 4) setView('VICTORY'); else { setMapNode(n => n + 1); setTimeout(() => setView('MAP'), 1500); }
        return;
    }

    setCombatState(prev => ({ ...prev!, drawPile: newDrawPile, discardPile: newDiscard, playerUnits: pUnits, enemyUnits: eUnits, playerHand: [], turn: prev!.turn + 1 }));
    startTurnLogic({ turn: combatState.turn + 1, playerUnits: pUnits, enemyUnits: eUnits, drawPile: newDrawPile, discardPile: newDiscard, enemyHand: [] });
    setGlobalDeck(newGlobalDeck);
  };

  // --- RENDERING ---

  if (view === 'START') {
    return (
       <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif">
          <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full flex flex-col items-center justify-center border-4 border-stone-800 bg-gradient-to-br from-stone-900 via-stone-950 to-red-950 relative overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30"></div>
             <div className="z-10 text-center space-y-12 p-8 relative">
                <div>
                    <h1 className="text-5xl font-black text-red-700 tracking-tighter drop-shadow-lg mb-2 uppercase">The Dragon</h1>
                    <h2 className="text-3xl font-bold text-stone-300 tracking-widest uppercase">Must Die</h2>
                </div>
                <button onClick={startDraft} className="w-full py-4 bg-red-900 hover:bg-red-800 text-stone-100 font-bold rounded-lg border-2 border-red-700 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider">
                   <Play size={20} className="fill-stone-100" /> New Expedition
                </button>
             </div>
          </div>
       </div>
    );
  }

  if (view === 'DRAFT') {
    return (
      <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-sans">
        <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full bg-stone-900 border-4 border-stone-700 flex flex-col relative overflow-hidden shadow-2xl">
          <div className="p-4 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
             <div>
                <h2 className="text-lg font-bold text-amber-500 font-serif">Draft Party</h2>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest">Select Heroes & Assign Lanes</p>
             </div>
             <div className="text-xl font-black text-stone-300">{party.length}/3</div>
          </div>
          
          {/* Lane Selection - Always Visible */}
          <div className="flex-none bg-stone-950 border-b border-stone-800 p-4">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-2 text-center">
              {selectedHero ? 'Click a lane to assign hero' : 'Select a hero first'}
            </div>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map(laneIdx => {
                const heroInLane = party.find(h => partyLanes[h.id] === laneIdx);
                const isClickable = selectedHero !== null;
                return (
                  <div 
                    key={laneIdx} 
                    onClick={() => isClickable && handleLaneSelect(laneIdx)}
                    className={`flex-1 flex flex-col items-center gap-1 transition-all ${isClickable ? 'cursor-pointer' : ''}`}
                  >
                    <div className="text-[8px] text-stone-500 font-bold uppercase tracking-wider">{['Front', 'Mid', 'Rear'][laneIdx]}</div>
                    <div className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                      isClickable && !heroInLane
                        ? 'border-sky-500/50 bg-sky-900/20 scale-105 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                        : heroInLane 
                          ? selectedHero === heroInLane.id
                            ? 'bg-amber-900/40 border-amber-400 ring-2 ring-amber-500 scale-105'
                            : 'bg-amber-900/20 border-amber-600'
                          : 'border-dashed border-stone-700 bg-stone-900/50'
                    }`}>
                      {heroInLane ? (
                        <div className="text-center">
                          <User size={20} className={selectedHero === heroInLane.id ? 'text-amber-400' : 'text-amber-500'} />
                          <div className="text-[8px] font-bold text-stone-200">{heroInLane.name}</div>
                        </div>
                      ) : isClickable ? (
                        <Target size={16} className="text-sky-500 animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-stone-700" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
             {HEROES_DB.map(hero => {
               const selected = party.find(p => p.id === hero.id);
               const isSelected = selectedHero === hero.id;
               const assignedLane = partyLanes[hero.id];
               return (
                 <div 
                   key={hero.id} 
                   onClick={() => selected && setSelectedHero(hero.id)}
                   className={`p-3 rounded-lg border transition-all relative ${
                     isSelected 
                       ? 'border-amber-400 bg-amber-900/30 ring-2 ring-amber-500 scale-105' 
                       : selected 
                         ? 'border-amber-600 bg-amber-900/20 cursor-pointer hover:bg-amber-900/30' 
                         : 'border-stone-700 bg-stone-900 hover:bg-stone-800 cursor-pointer'
                   }`}
                 >
                    <div onClick={(e) => { if (!selected) { e.stopPropagation(); handleDraftSelect(hero); } }} className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-stone-800 rounded flex items-center justify-center border border-stone-600">
                          <User size={24} className={selected ? 'text-amber-500' : 'text-stone-500'} />
                       </div>
                       <div className="flex-1">
                          <div className="font-bold text-sm text-stone-100 font-serif">{hero.name}</div>
                          <div className="text-[10px] text-stone-500 uppercase tracking-wider">{hero.role}</div>
                          {selected && assignedLane !== undefined && (
                            <div className="text-[9px] text-amber-400 font-bold mt-1">Lane: {['Front', 'Mid', 'Rear'][assignedLane]}</div>
                          )}
                       </div>
                       {selected && (
                         <div className="flex items-center gap-2">
                           {assignedLane !== undefined && <div className="text-[10px] text-stone-400 bg-stone-800 px-2 py-1 rounded">{['F', 'M', 'R'][assignedLane]}</div>}
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDraftSelect(hero); }}
                             className="w-6 h-6 rounded-full bg-red-900 hover:bg-red-800 border border-red-700 flex items-center justify-center font-bold text-xs"
                           >
                             ✕
                           </button>
                         </div>
                       )}
                       {!selected && <div className="w-6 h-6 rounded-full border-2 border-stone-600 bg-stone-800 flex items-center justify-center text-stone-600 font-bold text-xs">+</div>}
                    </div>
                 </div>
               );
             })}
          </div>
          <div className="p-4 bg-stone-950 border-t border-stone-800">
             <button onClick={finalizeDraft} disabled={party.length !== 3} className={`w-full py-4 font-bold rounded-lg uppercase tracking-widest border-2 ${party.length === 3 ? 'bg-amber-700 hover:bg-amber-600 border-amber-500 text-stone-100' : 'bg-stone-800 border-stone-700 text-stone-600 cursor-not-allowed'}`}>Embark</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'MAP') {
     return (
      <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif">
        <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full bg-stone-900 border-4 border-stone-700 flex flex-col relative overflow-hidden shadow-2xl">
           <div className="p-4 text-center bg-stone-950 border-b border-stone-800 shadow-md z-10">
              <h2 className="text-lg font-bold text-stone-200 tracking-widest uppercase">Kingdom Map</h2>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center gap-8 relative bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
              <div className="absolute top-10 bottom-10 w-1 bg-stone-700 z-0" />
              {[4, 3, 2, 1, 0].map(nodeIdx => {
                 const isCurrent = mapNode === nodeIdx;
                 const isPast = mapNode > nodeIdx;
                 const isBoss = nodeIdx === 4;
                 return (
                    <div key={nodeIdx} 
                         onClick={() => isCurrent ? enterCombat(isBoss ? 'boss' : 'normal') : null}
                         className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-500
                         ${isCurrent ? 'scale-110 border-amber-500 bg-amber-900 cursor-pointer animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 
                           (isPast ? 'border-stone-700 bg-stone-800 opacity-40 grayscale' : 'border-stone-600 bg-stone-800 opacity-60')}`}>
                       {isBoss ? <Castle size={24} className={isCurrent ? "text-amber-100" : "text-stone-500"} /> : <MapIcon size={20} className={isCurrent ? "text-amber-100" : "text-stone-500"} />}
                       {isCurrent && <div className="absolute -right-24 bg-amber-700 text-[10px] px-3 py-1 rounded-r-full border-l-4 border-amber-400 text-stone-100 font-bold shadow-lg animate-in slide-in-from-left-2">YOU ARE HERE</div>}
                    </div>
                 );
              })}
           </div>
           <div className="p-4 bg-stone-950 text-center text-[10px] text-stone-500 border-t border-stone-800 uppercase tracking-widest">
              Defeat the Dragon to win
           </div>
        </div>
      </div>
     );
  }

  if (view === 'COMBAT' && combatState) {
    const { turn, phase, playerHand, playerZoneCards, enemyZoneCards, playerUnits, enemyUnits, selectedCardIdx, drawPile, discardPile, resolvingLane } = combatState;
    const isPlayerTurn = phase === 'planning';

    return (
      <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-sans">
        <div className="relative h-full w-full max-w-[56.25vh] aspect-[9/16] bg-stone-900 border-4 border-stone-800 flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
          
          {/* TOP BAR */}
          <div className="flex-none bg-stone-950 border-b border-stone-800 p-2 flex justify-between items-center z-20 shadow-md h-12">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-red-900/20 border border-red-900/50 flex items-center justify-center">
                   <Sword size={16} className="text-red-500" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Turn</span>
                   <span className="text-sm font-black text-stone-200 leading-none">{turn}</span>
                </div>
             </div>
             
             {/* Deck Controls */}
             <div className="flex gap-2">
                <button onClick={() => setShowDiscardModal(true)} className="flex flex-col items-center justify-center w-10 h-8 rounded bg-stone-800 border border-stone-700 hover:border-stone-500 transition-colors">
                   <Trash2 size={12} className="text-stone-400" />
                   <span className="text-[8px] font-bold text-stone-500">{discardPile.length}</span>
                </button>
                <button onClick={() => setShowDeckModal(true)} className="flex flex-col items-center justify-center w-10 h-8 rounded bg-stone-800 border border-stone-700 hover:border-stone-500 transition-colors">
                   <Layers size={12} className="text-sky-500" />
                   <span className="text-[8px] font-bold text-sky-700">{drawPile.length}</span>
                </button>
                <button 
                  onClick={() => setShowLogs(!showLogs)}
                  className="relative flex flex-col items-center justify-center w-10 h-8 rounded bg-stone-800 border border-stone-700 hover:border-amber-500 transition-colors"
                >
                  <Eye size={12} className="text-amber-500" />
                  <span className="text-[8px] font-bold text-amber-700">{logs.length}</span>
                  {logs.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-red-800 rounded-full animate-pulse" />
                  )}
                </button>
             </div>
          </div>

          {/* LOG PANEL */}
          {showLogs && (
            <div className="absolute top-14 right-2 z-50 w-64 max-h-96 bg-stone-900/95 border-2 border-stone-700 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="p-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Battle Log</h3>
                <button onClick={() => setShowLogs(false)}>
                  <X size={16} className="text-stone-500 hover:text-stone-200" />
                </button>
              </div>
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center text-stone-600 text-xs italic py-4">No events yet</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`px-3 py-2 rounded border text-[10px] font-bold uppercase tracking-wide ${i===0 ? 'bg-amber-900/20 border-amber-900/50 text-amber-100' : 'bg-stone-950/50 border-stone-800 text-stone-400'}`}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* BATTLEFIELD - 3 LANES */}
          <div className="flex-1 flex min-h-0 bg-stone-900 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] relative">
             {/* CENTER ACTION BUTTON */}
             <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <button 
                  onClick={handleEndTurn}
                  disabled={!isPlayerTurn}
                  className={`pointer-events-auto w-12 h-12 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all active:scale-90
                    ${isPlayerTurn 
                      ? 'bg-red-900 border-red-700 text-stone-100 hover:bg-red-800 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse' 
                      : 'bg-stone-800 border-stone-700 text-stone-600 cursor-not-allowed'}
                  `}
                >
                  {isPlayerTurn ? <Swords size={20} /> : <RefreshCw size={20} className="animate-spin" />}
                </button>
             </div>

             {(() => {
                const selectedCard = selectedCardIdx !== null ? playerHand[selectedCardIdx] : null;
                
                // Calculate target lane once for hovered lane
                let calculatedTargetLane: number | null = null;
                if (hoveredLane !== null && selectedCard && !selectedCard.isPotion) {
                    calculatedTargetLane = hoveredLane;
                    // Use same logic as damage resolution
                    if (!enemyUnits[hoveredLane] || enemyUnits[hoveredLane]!.dead) {
                        // Priority 1: Left adjacent
                        if (hoveredLane > 0 && enemyUnits[hoveredLane-1] && !enemyUnits[hoveredLane-1]!.dead) {
                            calculatedTargetLane = hoveredLane - 1;
                        }
                        // Priority 2: Right adjacent
                        else if (hoveredLane < 2 && enemyUnits[hoveredLane+1] && !enemyUnits[hoveredLane+1]!.dead) {
                            calculatedTargetLane = hoveredLane + 1;
                        }
                        // Priority 3: Farthest alive enemy
                        else {
                            const candidates = [0,1,2].filter(idx => enemyUnits[idx] && !enemyUnits[idx]!.dead);
                            if (candidates.length > 0) {
                                calculatedTargetLane = candidates.reduce((farthest, current) => 
                                    Math.abs(current - hoveredLane) > Math.abs(farthest - hoveredLane) ? current : farthest
                                );
                            }
                        }
                    }
                }

                return [0, 1, 2].map(laneIdx => {
                    // Highlight logic with Range
                    const pUnit = playerUnits[laneIdx];
                    const cardOwner = playerUnits.find((u: Unit | null) => u && u.id === selectedCard?.ownerId);
                    const ownerIdx = playerUnits.indexOf(cardOwner!);
                    
                    let isValidTarget = false;
                    if (selectedCard) {
                        if (selectedCard.isPotion) {
                            isValidTarget = !!pUnit;
                        } else if (cardOwner) {
                            const dist = Math.abs(laneIdx - ownerIdx);
                            const range = selectedCard.range || 0;
                            isValidTarget = dist <= range;
                        }
                    }
                    
                    return (
                      <BattleLane 
                         key={laneIdx}
                         zoneLabel={ZONES[laneIdx]}
                         enemyUnit={enemyUnits[laneIdx]}
                         playerUnit={playerUnits[laneIdx]}
                         enemyCard={enemyZoneCards[laneIdx]}
                         playerCard={playerZoneCards[laneIdx]}
                         onPlayerSlotClick={() => { handleZoneClick(laneIdx); setHoveredLane(null); }}
                         isSelected={false}
                         isValidTarget={isValidTarget}
                         onPreviewStart={setPreviewCard}
                         onPreviewEnd={() => setPreviewCard(null)}
                         onProphetAction={onProphetAction}
                         showTargetArrow={calculatedTargetLane === laneIdx && hoveredLane !== null}
                         onLaneHover={() => setHoveredLane(laneIdx)}
                         onLaneLeave={() => setHoveredLane(null)}
                         isResolving={resolvingLane === laneIdx}
                      />
                    );
                });
             })()}
          </div>

          {/* PLAYER HAND AREA */}
          <div className="flex-none h-[22%] bg-stone-950 border-t border-stone-800 flex flex-col relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
             {/* Cards Fan Layout */}
             <div className="flex-1 relative flex items-end justify-center pb-2 overflow-visible px-4">
                {playerHand.length === 0 && <div className="w-full text-center text-[10px] text-stone-600 font-bold uppercase tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">No Cards Available</div>}
                <div className="relative h-full w-full max-w-full">
                  {playerHand.map((card: Card, i: number) => {
                    const totalCards = playerHand.length;
                    const centerIndex = (totalCards - 1) / 2;
                    const offset = i - centerIndex;
                    const rotation = offset * 2; // Cards lean outward
                    const cardSpacing = Math.max(30, Math.min(60, 400 / totalCards)); // Dynamic spacing based on card count
                    const translateX = offset * cardSpacing; // Overlapping cards with dynamic spacing
                    const translateY = Math.abs(offset) * 5; // Subtle concave curve
                    const isNewlyDrawn = combatState?.newlyDrawnCards?.has(card.uid || i) || false;
                    
                    return (
                      <div 
                        key={card.uid || i} 
                        className="absolute bottom-0 left-1/2 transition-all duration-300 ease-out"
                        style={{
                          transform: `translateX(calc(-50% + ${translateX}px)) translateY(${translateY}px) rotate(${rotation}deg)`,
                          zIndex: selectedCardIdx === i ? 50 : 10 + i,
                          transformOrigin: 'bottom center'
                        }}
                      >
                        <div 
                          className={`aspect-[2/3] h-[130px] transition-transform duration-300 ${
                            selectedCardIdx === i ? 'scale-110 -translate-y-4' : 'hover:scale-105 hover:-translate-y-2'
                          } ${isNewlyDrawn ? 'animate-[flipIn_0.6s_ease-out]' : ''}`}
                          style={{ cursor: isPlayerTurn ? 'pointer' : 'not-allowed' }}
                        >
                          <Card 
                            {...card}
                            isSelected={selectedCardIdx === i}
                            onClick={() => { if (isPlayerTurn) setCombatState(p => ({...p!, selectedCardIdx: p!.selectedCardIdx === i ? null : i})); }}
                            disabled={!isPlayerTurn}
                            onPreviewStart={() => setPreviewCard(card)}
                            onPreviewEnd={() => setPreviewCard(null)}
                            className="w-full h-full text-[10px]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>

          {/* CARD PREVIEW OVERLAY */}
          {previewCard && (
             <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <div className="w-64 aspect-[2/3] pointer-events-auto shadow-2xl">
                   <Card {...previewCard} disabled={false} className="w-full h-full text-sm" />
                </div>
             </div>
          )}

          {/* MODALS */}
          {(showDeckModal || showDiscardModal) && (
            <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
              <div className="bg-stone-900 border-2 border-stone-700 rounded-xl w-full h-[70%] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                   <h3 className="font-bold text-stone-200 flex items-center gap-2 uppercase tracking-wider text-xs">
                     {showDeckModal ? <><Layers size={14}/> Draw Pile</> : <><Trash2 size={14}/> Discard Pile</>}
                   </h3>
                   <button onClick={()=>{setShowDeckModal(false);setShowDiscardModal(false)}}><X size={20} className="text-stone-500 hover:text-stone-200"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2 content-start bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                   {(showDeckModal ? drawPile : discardPile).map((c: Card, i: number) => (
                      <div key={i} className="aspect-[2/3]"><Card {...c} smallMode disabled className="w-full h-full text-[8px]" /></div>
                   ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black text-white flex items-center justify-center">
       <button onClick={() => setView('START')} className="px-6 py-2 border rounded">Reset Game</button>
    </div>
  );
}