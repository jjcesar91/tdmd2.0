import React, { useState, useRef, useEffect } from 'react';
import { Shield, Sword, Skull, RefreshCw, Play, Crown, Castle, Map as MapIcon, User, Layers, X, Trash2, Eye, FlaskConical, Target, Swords, Heart, Lock } from 'lucide-react';
import splashScreenImage from './assets/images/TDMD.png';
import startScreenImage from './assets/images/TDMD-START.png';
import rekodeLogo from './assets/images/REKODE.png';
import clickSfx from './assets/sounds/click1.mp3';

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
  archetype?: 'KINGDOM' | 'VENGEANCE' | 'BALANCE' | 'POWER';
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
  activeCooldown?: number;
  activeCooldownMax?: number;
  archetype?: 'KINGDOM' | 'VENGEANCE' | 'BALANCE' | 'POWER';
  level?: number;
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

type Hero = {
  id: string;
  name: string;
  role: string;
  desc: string;
  hp: number;
  maxHp: number;
  archetype: 'KINGDOM' | 'VENGEANCE' | 'BALANCE' | 'POWER';
  cards: Card[];
  level: number;
  locked?: boolean;
  lore?: string;
};

const HEROES_DB: Hero[] = [
  {
    id: 'crusader',
    name: 'Crusader',
    role: 'TANK',
    desc: 'Passive: Gain 1 Gray Heart each round. Active: Provoke (Taunt 1 attack; Cooldown 0)',
    hp: 5,
    maxHp: 5,
    archetype: 'VENGEANCE',
    level: 1,
    locked: false,
    lore: 'An old veteran, back to action to avenge its family',
    cards: [
      { id: 'c_van', type: 'ATTACK', value: 1, name: 'Vanguard', desc: 'Deal 1. Prevent 1 on adjacent right lane.', effect: 'ATTACK_DEF_RIGHT' },
      { id: 'c_van', type: 'ATTACK', value: 1, name: 'Vanguard', desc: 'Deal 1. Prevent 1 on adjacent right lane.', effect: 'ATTACK_DEF_RIGHT' },
      { id: 'c_van', type: 'ATTACK', value: 1, name: 'Vanguard', desc: 'Deal 1. Prevent 1 on adjacent right lane.', effect: 'ATTACK_DEF_RIGHT' },
      { id: 'c_beh', type: 'SKILL', value: 0, name: 'Behind Me', desc: 'Tank adjacent right lane.', effect: 'TANK_RIGHT' },
      { id: 'c_beh', type: 'SKILL', value: 0, name: 'Behind Me', desc: 'Tank adjacent right lane.', effect: 'TANK_RIGHT' },
    ]
  },
  {
    id: 'ranger',
    name: 'Lone Ranger',
    role: 'DPS',
    desc: 'Active: Camouflage (Immune this turn; Cooldown 2)',
    hp: 3,
    maxHp: 3,
    archetype: 'BALANCE' as const,
    level: 1,
    locked: false,
    lore: 'Outcast in the wilds, seeking to restore nature balance to the land',
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
    desc: 'Passive: Map Vision. Active: Scry All (Cooldown 2)',
    hp: 3,
    maxHp: 3,
    archetype: 'KINGDOM' as const,
    level: 1,
    locked: false,
    lore: "Once king's high priest, it bears a prophecy of restoration",
    cards: [
      { id: 'p_div', type: 'FAST', value: 0, name: 'Divination', desc: 'Divine 1 kingdom card. If you can\'t, draw 1 card.', effect: 'DIVINE' },
      { id: 'p_div', type: 'FAST', value: 0, name: 'Divination', desc: 'Divine 1 kingdom card. If you can\'t, draw 1 card.', effect: 'DIVINE' },
    ]
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    role: 'WILD',
    desc: 'Passive: Craft potion on Draw.',
    hp: 4,
    maxHp: 4,
    archetype: 'POWER' as const,
    level: 1,
    locked: false,
    lore: 'A prodigy that seeks legendary ingredients for dangerous formulas',
    cards: [
      { id: 'a_fla', type: 'ATTACK', value: 1, name: 'Explosive', desc: 'Deal 1. Unpreventable.', effect: 'UNPREV_NEXT' },
      { id: 'a_fla', type: 'ATTACK', value: 1, name: 'Explosive', desc: 'Deal 1. Unpreventable.', effect: 'UNPREV_NEXT' },
      { id: 'a_fla', type: 'ATTACK', value: 1, name: 'Explosive', desc: 'Deal 1. Unpreventable.', effect: 'UNPREV_NEXT' },
    ]
  },
  // KINGDOM HEROES
  {
    id: 'banner',
    name: 'Banner',
    role: 'SUPP',
    desc: 'Placeholder ability',
    hp: 4,
    maxHp: 4,
    archetype: 'KINGDOM' as const,
    level: 1,
    locked: true,
    lore: "Loyal knight of the crown, is gathering people for the kingdom cause",
    cards: [
      { id: 'ban_1', type: 'ATTACK', value: 1, name: 'Rally', desc: 'Deal 1.', range: 1 },
      { id: 'ban_2', type: 'DEFENSE', value: 1, name: 'Defend', desc: 'Prevent 1.', range: 1 },
    ]
  },
  {
    id: 'princess',
    name: 'Princess',
    role: 'SUPP',
    desc: 'Placeholder ability',
    hp: 3,
    maxHp: 3,
    archetype: 'KINGDOM' as const,
    level: 1,
    locked: true,
    lore: "Daughter of crown distant relative, tend to few land survivor aside the Governor",
    cards: [
      { id: 'pri_1', type: 'SKILL', value: 1, name: 'Grace', desc: 'Heal 1.', range: 1 },
      { id: 'pri_2', type: 'DEFENSE', value: 1, name: 'Protect', desc: 'Prevent 1.', range: 1 },
    ]
  },
  {
    id: 'sentry',
    name: 'Sentry',
    role: 'TANK',
    desc: 'Placeholder ability',
    hp: 6,
    maxHp: 6,
    archetype: 'KINGDOM' as const,
    level: 1,
    locked: true,
    lore: "Old magical golem bound to protect the kingdom, even now after all this time",
    cards: [
      { id: 'sen_1', type: 'DEFENSE', value: 2, name: 'Shield', desc: 'Prevent 2.', range: 0 },
      { id: 'sen_2', type: 'ATTACK', value: 1, name: 'Strike', desc: 'Deal 1.', range: 0 },
    ]
  },
  {
    id: 'lostprince',
    name: 'Lost Prince',
    role: 'DPS',
    desc: 'Placeholder ability',
    hp: 4,
    maxHp: 4,
    archetype: 'KINGDOM' as const,
    level: 1,
    locked: true,
    lore: "The Lone Ranger transformed - the heir to the throne",
    cards: [
      { id: 'lpr_1', type: 'ATTACK', value: 2, name: 'Royal Strike', desc: 'Deal 2.', range: 1 },
      { id: 'lpr_2', type: 'ATTACK', value: 1, name: 'Command', desc: 'Deal 1.', range: 2 },
    ]
  },
  // VENGEANCE HEROES
  {
    id: 'silenced',
    name: 'Silenced',
    role: 'DPS',
    desc: 'Placeholder ability',
    hp: 3,
    maxHp: 3,
    archetype: 'VENGEANCE' as const,
    level: 1,
    locked: true,
    lore: "A bard who lost her voice in a fire caused by monsters, is ready for retribution",
    cards: [
      { id: 'sil_1', type: 'ATTACK', value: 1, name: 'Silent Fury', desc: 'Deal 1.', range: 1 },
      { id: 'sil_2', type: 'ATTACK', value: 2, name: 'Revenge', desc: 'Deal 2.', range: 0 },
    ]
  },
  {
    id: 'oathbreaker',
    name: 'Oathbreaker',
    role: 'TANK',
    desc: 'Placeholder ability',
    hp: 5,
    maxHp: 5,
    archetype: 'VENGEANCE' as const,
    level: 1,
    locked: true,
    lore: "Dishonored captain who fled the battlefield, seeks now an honorable death",
    cards: [
      { id: 'oat_1', type: 'ATTACK', value: 1, name: 'Redemption', desc: 'Deal 1.', range: 0 },
      { id: 'oat_2', type: 'DEFENSE', value: 1, name: 'Last Stand', desc: 'Prevent 1.', range: 0 },
    ]
  },
  {
    id: 'captive',
    name: 'Captive',
    role: 'DPS',
    desc: 'Placeholder ability',
    hp: 3,
    maxHp: 3,
    archetype: 'VENGEANCE' as const,
    level: 1,
    locked: true,
    lore: "Fled from some cultists, she's back to exact vengeance from her captor",
    cards: [
      { id: 'cap_1', type: 'ATTACK', value: 2, name: 'Escape', desc: 'Deal 2.', range: 1 },
      { id: 'cap_2', type: 'SKILL', value: 0, name: 'Evade', desc: 'Immune this turn.', range: 0 },
    ]
  },
  {
    id: 'cursed',
    name: 'Cursed',
    role: 'DPS',
    desc: 'Placeholder ability',
    hp: 4,
    maxHp: 4,
    archetype: 'VENGEANCE' as const,
    level: 1,
    locked: true,
    lore: "Having lost a loved one to the calamity, bound his soul to get his revenge",
    cards: [
      { id: 'cur_1', type: 'ATTACK', value: 1, name: 'Soul Strike', desc: 'Deal 1.', range: 1 },
      { id: 'cur_2', type: 'ATTACK', value: 2, name: 'Curse', desc: 'Deal 2.', range: 0 },
    ]
  },
  // BALANCE HEROES
  {
    id: 'gravekeeper',
    name: 'Gravekeeper',
    role: 'SUPP',
    desc: 'Placeholder ability',
    hp: 3,
    maxHp: 3,
    archetype: 'BALANCE' as const,
    level: 1,
    locked: true,
    lore: "Devoted mystic who vowed to extinguish the Death Plague from the land",
    cards: [
      { id: 'grv_1', type: 'SKILL', value: 1, name: 'Purify', desc: 'Heal 1.', range: 1 },
      { id: 'grv_2', type: 'ATTACK', value: 1, name: 'Smite', desc: 'Deal 1.', range: 1 },
    ]
  },
  {
    id: 'druid',
    name: 'Druid',
    role: 'SUPP',
    desc: 'Placeholder ability',
    hp: 4,
    maxHp: 4,
    archetype: 'BALANCE' as const,
    level: 1,
    locked: true,
    lore: "Keeper of earth leylines, she is determined to restore the natural order",
    cards: [
      { id: 'dru_1', type: 'DEFENSE', value: 1, name: 'Nature Ward', desc: 'Prevent 1.', range: 1 },
      { id: 'dru_2', type: 'ATTACK', value: 1, name: 'Vine Lash', desc: 'Deal 1.', range: 1 },
    ]
  },
  {
    id: 'hunter',
    name: 'Hunter',
    role: 'DPS',
    desc: 'Placeholder ability',
    hp: 4,
    maxHp: 4,
    archetype: 'BALANCE' as const,
    level: 1,
    locked: true,
    lore: "Legendary monster slayer forged for this kind of expedition",
    cards: [
      { id: 'hun_1', type: 'ATTACK', value: 2, name: 'Hunt', desc: 'Deal 2.', range: 1 },
      { id: 'hun_2', type: 'ATTACK', value: 1, name: 'Track', desc: 'Deal 1.', range: 2 },
    ]
  },
  {
    id: 'entropy',
    name: 'Entropy',
    role: 'WILD',
    desc: 'Placeholder ability',
    hp: 3,
    maxHp: 3,
    archetype: 'BALANCE' as const,
    level: 1,
    locked: true,
    lore: "A mysterious entity conjured to oppose the great evil",
    cards: [
      { id: 'ent_1', type: 'ATTACK', value: 1, name: 'Chaos', desc: 'Deal 1.', range: 1 },
      { id: 'ent_2', type: 'SKILL', value: 0, name: 'Disorder', desc: 'Random effect.', range: 1 },
    ]
  },
  // POWER HEROES
  {
    id: 'scavenger',
    name: 'Scavenger',
    role: 'WILD',
    desc: 'Placeholder ability',
    hp: 4,
    maxHp: 4,
    archetype: 'POWER' as const,
    level: 1,
    locked: true,
    lore: "Having heard of great riches hoarded by the dragon, wants a piece of the cake",
    cards: [
      { id: 'sca_1', type: 'ATTACK', value: 1, name: 'Loot', desc: 'Deal 1.', range: 1 },
      { id: 'sca_2', type: 'SKILL', value: 1, name: 'Scavenge', desc: 'Draw 1.', range: 0 },
    ]
  },
  {
    id: 'witch',
    name: 'Witch',
    role: 'DPS',
    desc: 'Placeholder ability',
    hp: 3,
    maxHp: 3,
    archetype: 'POWER' as const,
    level: 1,
    locked: true,
    lore: "Embarked to slay the dragon to perform some heinous ritual",
    cards: [
      { id: 'wit_1', type: 'ATTACK', value: 2, name: 'Hex', desc: 'Deal 2.', range: 1 },
      { id: 'wit_2', type: 'ATTACK', value: 1, name: 'Curse', desc: 'Deal 1.', range: 1 },
    ]
  },
  {
    id: 'dragonblood',
    name: 'Dragonblood',
    role: 'DPS',
    desc: 'Placeholder ability',
    hp: 4,
    maxHp: 4,
    archetype: 'POWER' as const,
    level: 1,
    locked: true,
    lore: "Imbued by draconic bloodline power, needs to slay a real dragon to finally ascend",
    cards: [
      { id: 'dbl_1', type: 'ATTACK', value: 2, name: 'Dragon Breath', desc: 'Deal 2.', range: 1 },
      { id: 'dbl_2', type: 'DEFENSE', value: 1, name: 'Dragon Scales', desc: 'Prevent 1.', range: 0 },
    ]
  },
  {
    id: 'fanatic',
    name: 'Fanatic',
    role: 'WILD',
    desc: 'Placeholder ability',
    hp: 3,
    maxHp: 3,
    archetype: 'POWER' as const,
    level: 1,
    locked: true,
    lore: "Expelled even by the cultists, he is obsessed he knows a way to control the dragon",
    cards: [
      { id: 'fan_1', type: 'ATTACK', value: 1, name: 'Obsession', desc: 'Deal 1.', range: 1 },
      { id: 'fan_2', type: 'SKILL', value: 1, name: 'Control', desc: 'Confuse enemy.', range: 1 },
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
  previewMode?: boolean;
}

const Card = ({ type, ownerId, name, desc, isHidden, onPreviewStart, onPreviewEnd, onClick, isSelected, disabled, isPotion, range, className = "", smallMode = false, previewMode = false }: CardProps) => {
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
          <span className={`${previewMode ? 'text-sm' : 'text-[8px]'} font-bold text-stone-300`}>R{range}</span>
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
           <div className="px-1 py-0.5 bg-stone-950/90 border border-stone-700 mb-1">
             <span className={`${previewMode ? 'text-sm' : 'text-[5px]'} font-bold text-stone-100 uppercase tracking-wide font-serif`}>{name}</span>
           </div>
         )}
          
         {/* Description below name */}
         {!smallMode && (
           <div className={`${previewMode ? 'text-base' : 'text-[7px]'} text-center text-stone-300 leading-tight w-full px-2 ${previewMode ? '' : 'line-clamp-3'}`}>
             {desc}
           </div>
         )}
      </div>

      {/* Bottom Info Bar */}
      {!smallMode && (
        <div className="w-full px-2 py-1 bg-black/40 border-t border-stone-800 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-1">
            <span className={`${previewMode ? 'text-xs' : 'text-[7px]'} text-stone-400 uppercase tracking-wider`}>{typeLabel}</span>
          </div>
          {ownerId && (
            <div className={`${previewMode ? 'text-xs' : 'text-[7px]'} font-bold text-stone-500 uppercase tracking-wider`}>
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
  onCrusaderAction?: () => void;
  onRangerAction?: () => void;
}

const UnitPortrait = ({ unit, isEnemy, onProphetAction, onCrusaderAction, onRangerAction }: UnitPortraitProps) => {
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
         <button 
           onClick={(e) => { e.stopPropagation(); if(onProphetAction) onProphetAction(); }} 
           disabled={unit.activeCooldown! > 0}
           className={`absolute bottom-12 right-1 p-1 rounded-full border shadow-lg z-20 transition-all ${
             unit.activeCooldown! > 0 
               ? 'bg-stone-700 border-stone-600 shadow-stone-900/50 cursor-not-allowed opacity-50' 
               : 'bg-violet-900 border-violet-500 shadow-violet-900/50 hover:scale-110'
           }`}
         >
            {unit.activeCooldown! > 0 ? (
              <span className="text-[8px] font-bold text-stone-400">{unit.activeCooldown}</span>
            ) : (
              <Eye size={10} className="text-violet-200" />
            )}
         </button>
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
      
      {/* Action Button (Ranger - Camouflage) */}
      {!isEnemy && !isDead && unit.id === 'ranger' && (
         <button 
           onClick={(e) => { e.stopPropagation(); if(onRangerAction) onRangerAction(); }} 
           disabled={unit.activeCooldown! > 0}
           className={`absolute bottom-12 right-1 p-1 rounded-full border shadow-lg z-20 transition-all ${
             unit.activeCooldown! > 0 
               ? 'bg-stone-700 border-stone-600 shadow-stone-900/50 cursor-not-allowed opacity-50' 
               : 'bg-green-900 border-green-500 shadow-green-900/50 hover:scale-110'
           }`}
         >
            {unit.activeCooldown! > 0 ? (
              <span className="text-[8px] font-bold text-stone-400">{unit.activeCooldown}</span>
            ) : (
              <RefreshCw size={10} className="text-green-200" />
            )}
         </button>
      )}
    </div>
  );
};

// --- HERO DETAIL VIEW COMPONENT ---

// --- HERO DETAIL VIEW COMPONENT ---

interface HeroDetailViewProps {
  hero: Hero;
  onClose: () => void;
}

const HeroDetailView = ({ hero, onClose }: HeroDetailViewProps) => {
  const getLevelProgression = (heroId: string) => {
    if (heroId === 'crusader') {
      return [
        { level: 1, unlock: 'Base kit: 3x Vanguard, 2x Behind Me', locked: false },
        { level: 2, unlock: 'Unlock Provoke active ability', locked: false },
        { level: 3, unlock: 'Add 2x Eye for an Eye to deck', locked: false },
        { level: 4, unlock: 'Passive: +2 Gray HP per turn (was +1)', locked: false },
        { level: 5, unlock: 'Add 1x Nothing to Lose to deck', locked: false }
      ];
    }
    if (heroId === 'prophet') {
      return [
        { level: 1, unlock: 'Base kit: 2x Divination', locked: false },
        { level: 2, unlock: 'Add 2x Foretell to deck', locked: false },
        { level: 3, unlock: 'Add 2x Mending to deck', locked: false },
        { level: 4, unlock: 'Improve and Heal increased by 1', locked: false },
        { level: 5, unlock: 'Divination becomes Pick', locked: false }
      ];
    }
    if (heroId === 'ranger') {
      return [
        { level: 1, unlock: 'Base kit: 3x Arrow Shot, 2x Track, Camouflage active', locked: false },
        { level: 2, unlock: 'Passive: Revealed enemies take +1 damage', locked: false },
        { level: 3, unlock: 'Arrow Shot damage increased to 2', locked: false },
        { level: 4, unlock: 'Add 2x Mark of Hunter to deck', locked: false },
        { level: 5, unlock: 'Camouflage grants CRIT (2x damage)', locked: false }
      ];
    }
    // Default progression for other heroes
    return [
      { level: 1, unlock: 'Base abilities unlocked', locked: false },
      { level: 2, unlock: 'Enhanced passive', locked: true },
      { level: 3, unlock: 'New card added to deck', locked: true },
      { level: 4, unlock: 'Ability upgrade', locked: true },
      { level: 5, unlock: 'Ultimate card unlocked', locked: true }
    ];
  };

  const getActiveAbility = (heroId: string) => {
    if (heroId === 'crusader') return { name: 'Provoke', desc: 'Force an enemy card to attack. The attack is revealed and stays face-up.', cooldown: 0 };
    if (heroId === 'prophet') return { name: 'Scry All', desc: 'Reveal all enemy cards for this turn.', cooldown: 2 };
    if (heroId === 'ranger') return { name: 'Camouflage', desc: 'Become immune to all damage this turn.', cooldown: 2 };
    return { name: 'Unknown', desc: 'No active ability.', cooldown: 0 };
  };

  // Get all unique cards including level-unlocked ones
  const getAllUniqueCards = (heroId: string) => {
    const cardsWithLevel: { card: any; unlockLevel: number }[] = [];
    
    // Add base cards (level 1)
    if (hero.cards) {
      const seenIds = new Set<string>();
      hero.cards.forEach((card: any) => {
        if (!seenIds.has(card.id)) {
          seenIds.add(card.id);
          cardsWithLevel.push({ card: { ...card }, unlockLevel: 1 });
        }
      });
    }
    
    // Add level-specific cards
    if (heroId === 'crusader') {
      // Level 3: Eye for an Eye
      cardsWithLevel.push({
        card: {
          id: 'c_eye',
          type: 'ATTACK',
          value: 0,
          name: 'Eye for an Eye',
          desc: 'Deal X equal to your missing hearts.',
          effect: 'EYE_FOR_EYE',
          ownerId: 'crusader',
          archetype: 'VENGEANCE' as const
        },
        unlockLevel: 3
      });
      
      // Level 5: Nothing to Lose
      cardsWithLevel.push({
        card: {
          id: 'c_nothing',
          type: 'SKILL',
          value: 0,
          name: 'Nothing to Lose',
          desc: 'Tank all lanes this turn.',
          effect: 'TANK_ALL',
          ownerId: 'crusader',
          archetype: 'VENGEANCE' as const
        },
        unlockLevel: 5
      });
    }
    
    // Prophet level-specific cards
    if (heroId === 'prophet') {
      // Level 2: Foretell
      cardsWithLevel.push({
        card: {
          id: 'p_foretell',
          type: 'FAST',
          value: 1,
          name: 'Foretell',
          desc: 'Improve 1; Range 1',
          effect: 'IMPROVE',
          range: 1,
          ownerId: 'prophet',
          archetype: 'KINGDOM' as const
        },
        unlockLevel: 2
      });
      
      // Level 3: Mending
      cardsWithLevel.push({
        card: {
          id: 'p_mending',
          type: 'FAST',
          value: 1,
          name: 'Mending',
          desc: 'Heal 1; Range 1',
          effect: 'HEAL',
          range: 1,
          ownerId: 'prophet',
          archetype: 'KINGDOM' as const
        },
        unlockLevel: 3
      });
      
      // Level 4: Improved versions shown in cards list
      cardsWithLevel.push({
        card: {
          id: 'p_foretell_up',
          type: 'FAST',
          value: 2,
          name: 'Foretell (Upgraded)',
          desc: 'Improve 2; Range 1',
          effect: 'IMPROVE',
          range: 1,
          ownerId: 'prophet',
          archetype: 'KINGDOM' as const
        },
        unlockLevel: 4
      });
      
      cardsWithLevel.push({
        card: {
          id: 'p_mending_up',
          type: 'FAST',
          value: 2,
          name: 'Mending (Upgraded)',
          desc: 'Heal 2; Range 1',
          effect: 'HEAL',
          range: 1,
          ownerId: 'prophet',
          archetype: 'KINGDOM' as const
        },
        unlockLevel: 4
      });
      
      // Level 5: Pick version of Divination
      cardsWithLevel.push({
        card: {
          id: 'p_pick',
          type: 'FAST',
          value: 0,
          name: 'Divination (Pick)',
          desc: 'Pick 1 kingdom card. If you can\'t, draw 1 card.',
          effect: 'PICK',
          ownerId: 'prophet',
          archetype: 'KINGDOM' as const
        },
        unlockLevel: 5
      });
    }
    
    // Ranger level-specific cards
    if (heroId === 'ranger') {
      // Level 3: Upgraded Arrow Shot
      cardsWithLevel.push({
        card: {
          id: 'r_arr_up',
          type: 'ATTACK',
          value: 2,
          name: 'Arrow Shot (Upgraded)',
          desc: 'Deal 2. Ranged 2.',
          range: 2,
          ownerId: 'ranger',
          archetype: 'BALANCE' as const
        },
        unlockLevel: 3
      });
      
      // Level 4: Mark of Hunter
      cardsWithLevel.push({
        card: {
          id: 'r_mark',
          type: 'FAST',
          value: 0,
          name: 'Mark of Hunter',
          desc: 'Enemy gets double damage this round.',
          effect: 'MARK_HUNTER',
          ownerId: 'ranger',
          archetype: 'BALANCE' as const
        },
        unlockLevel: 4
      });
    }
    
    return cardsWithLevel;
  };

  const progression = getLevelProgression(hero.id);
  const activeAbility = getActiveAbility(hero.id);
  const uniqueCards = getAllUniqueCards(hero.id);
  const currentLevel = hero.level || 1;
  
  // Determine unlock levels for abilities
  const passiveUnlockLevel = hero.id === 'crusader' ? 1 : 1; // Crusader passive at level 1
  const passiveUpgradeLevel = hero.id === 'crusader' ? 4 : null; // Crusader passive upgrades at level 4
  const activeUnlockLevel = hero.id === 'crusader' ? 2 : 1; // Crusader active unlocks at level 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="relative h-full max-w-[56.25vh] aspect-[9/16] w-full overflow-y-auto bg-gradient-to-b from-stone-900 via-stone-950 to-black border-4 border-amber-600/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")'
        }} />

        {/* Top ornamental border */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-stone-900/90 border-2 border-amber-600/40 hover:border-amber-500 flex items-center justify-center transition-all hover:scale-110 group"
        >
          <X size={20} className="text-amber-600 group-hover:text-amber-400" />
        </button>

        {/* Content Container */}
        <div className="relative z-10 p-8">
          {/* Stats Bar */}
          <div className="flex justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-950/80 to-red-900/60 border-2 border-red-700/50 rounded-lg shadow-lg">
              <Heart size={16} className="text-red-500" />
              <div className="text-sm">
                <span className="text-[10px] text-red-400 uppercase tracking-wider">HP</span>
                <div className="text-lg font-black text-red-100">{hero.maxHp}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-950/80 to-amber-900/60 border-2 border-amber-700/50 rounded-lg shadow-lg">
              <Sword size={16} className="text-amber-500" />
              <div className="text-sm">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider">Cards</span>
                <div className="text-lg font-black text-amber-100">{hero.cards?.length || 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-950/80 to-sky-900/60 border-2 border-sky-700/50 rounded-lg shadow-lg">
              <Shield size={16} className="text-sky-500" />
              <div className="text-sm">
                <span className="text-[10px] text-sky-400 uppercase tracking-wider">Role</span>
                <div className="text-lg font-black text-sky-100">{hero.role}</div>
              </div>
            </div>
          </div>

          {/* Hero Portrait Section */}
          <div className="relative mb-6">
            {/* Ornamental Frame */}
            <div className="relative mx-auto w-48 h-48">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-600/20 via-amber-800/10 to-transparent rounded-full blur-2xl" />
              
              {/* Portrait Circle */}
              <div className="relative w-full h-full rounded-full border-4 border-amber-600/60 bg-gradient-to-b from-stone-800 to-stone-950 flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent" />
                {/* Kingdom */}
                {hero.id === 'prophet' && <Eye size={80} className="text-violet-500/80 relative z-10" />}
                {hero.id === 'banner' && <Crown size={80} className="text-amber-500/80 relative z-10" />}
                {hero.id === 'princess' && <Crown size={80} className="text-pink-500/80 relative z-10" />}
                {hero.id === 'sentry' && <Shield size={80} className="text-slate-500/80 relative z-10" />}
                {hero.id === 'lostprince' && <Crown size={80} className="text-gold-500/80 relative z-10" />}
                
                {/* Vengeance */}
                {hero.id === 'crusader' && <Shield size={80} className="text-amber-500/80 relative z-10" />}
                {hero.id === 'silenced' && <Skull size={80} className="text-red-500/80 relative z-10" />}
                {hero.id === 'oathbreaker' && <Sword size={80} className="text-red-500/80 relative z-10" />}
                {hero.id === 'captive' && <Swords size={80} className="text-red-500/80 relative z-10" />}
                {hero.id === 'cursed' && <Skull size={80} className="text-purple-500/80 relative z-10" />}
                
                {/* Balance */}
                {hero.id === 'ranger' && <Target size={80} className="text-green-500/80 relative z-10" />}
                {hero.id === 'gravekeeper' && <Skull size={80} className="text-teal-500/80 relative z-10" />}
                {hero.id === 'druid' && <Layers size={80} className="text-green-500/80 relative z-10" />}
                {hero.id === 'hunter' && <Target size={80} className="text-brown-500/80 relative z-10" />}
                {hero.id === 'entropy' && <RefreshCw size={80} className="text-indigo-500/80 relative z-10" />}
                
                {/* Power */}
                {hero.id === 'alchemist' && <FlaskConical size={80} className="text-orange-500/80 relative z-10" />}
                {hero.id === 'scavenger' && <Sword size={80} className="text-yellow-500/80 relative z-10" />}
                {hero.id === 'witch' && <Skull size={80} className="text-purple-500/80 relative z-10" />}
                {hero.id === 'dragonblood' && <Swords size={80} className="text-red-500/80 relative z-10" />}
                {hero.id === 'fanatic' && <Eye size={80} className="text-red-500/80 relative z-10" />}
              </div>

              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 border-amber-500/60 rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 border-amber-500/60 rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 border-amber-500/60 rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 border-amber-500/60 rounded-br-lg" />
            </div>

            {/* Name Banner */}
            <div className="relative mt-4">
              <div className="text-center">
                <div className="inline-block relative">
                  {/* Banner background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-900/50 to-transparent blur-sm" />
                  <h2 className="relative text-3xl font-black font-serif text-amber-400 tracking-wider px-8 py-2">
                    {hero.name}
                  </h2>
                  {/* Decorative lines */}
                  <div className="absolute left-0 top-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent to-amber-600" />
                  <div className="absolute right-0 top-1/2 w-6 h-0.5 bg-gradient-to-l from-transparent to-amber-600" />
                </div>
                <div className="text-sm text-stone-400 uppercase tracking-widest mt-1">{hero.archetype}</div>
              </div>
            </div>
          </div>

          {/* Abilities Section */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Passive Ability */}
            <div className="bg-stone-900/60 border-2 border-stone-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-400/50 flex items-center justify-center shadow-lg">
                  <Layers size={20} className="text-amber-100" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-amber-500 uppercase tracking-wider font-bold">Passive Ability</div>
                    {currentLevel < passiveUnlockLevel && (
                      <div className="text-[10px] px-2 py-0.5 bg-stone-800 border border-amber-600 rounded-full text-amber-400">
                        Unlocks at Level {passiveUnlockLevel}
                      </div>
                    )}
                    {passiveUpgradeLevel && currentLevel < passiveUpgradeLevel && currentLevel >= passiveUnlockLevel && (
                      <div className="text-[10px] px-2 py-0.5 bg-stone-800 border border-green-600 rounded-full text-green-400">
                        Upgrade at Level {passiveUpgradeLevel}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-stone-300">
                    {hero.id === 'crusader' && 'Gain Gray Hearts each turn'}
                    {hero.id === 'prophet' && 'Map Vision - See all enemy encounters'}
                    {hero.id === 'ranger' && 'Level 5: CRIT while immune (2x damage)'}
                    {hero.id === 'alchemist' && 'Craft Potion on Draw'}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Ability */}
            <div className="bg-stone-900/60 border-2 border-stone-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400/50 flex items-center justify-center shadow-lg">
                  <Swords size={20} className="text-red-100" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-xs text-red-500 uppercase tracking-wider font-bold">Active Ability</div>
                    {currentLevel < activeUnlockLevel && (
                      <div className="text-[10px] px-2 py-0.5 bg-stone-800 border border-amber-600 rounded-full text-amber-400">
                        Unlocks at Level {activeUnlockLevel}
                      </div>
                    )}
                    {currentLevel >= activeUnlockLevel && activeAbility.cooldown > 0 && (
                      <div className="text-[10px] px-2 py-0.5 bg-stone-800 border border-stone-600 rounded-full text-stone-400">
                        Cooldown: {activeAbility.cooldown}
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-bold text-stone-100 font-serif">{activeAbility.name}</div>
                </div>
              </div>
              <div className="text-sm text-stone-400 leading-relaxed">
                {activeAbility.desc}
              </div>
            </div>
          </div>

          {/* Cards Section */}
          <div className="mb-6">
            <div className="text-center mb-3">
              <div className="inline-block px-4 py-1 bg-stone-800/80 border-2 border-amber-700/40 rounded-full">
                <span className="text-xs text-amber-500 uppercase tracking-wider font-bold">Cards</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {uniqueCards.map((cardInfo, idx) => (
                <div key={idx} className="aspect-[2/3] relative">
                  <Card {...cardInfo.card} smallMode={false} className="h-full" />
                  {/* Level Unlock Badge */}
                  <div className={`absolute -top-1 -right-1 z-20 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black border-2 shadow-lg ${
                    cardInfo.unlockLevel === 1 ? 'bg-stone-700 text-stone-300 border-stone-500' :
                    cardInfo.unlockLevel === 2 ? 'bg-green-700 text-stone-100 border-green-500' :
                    cardInfo.unlockLevel === 3 ? 'bg-blue-700 text-stone-100 border-blue-500' :
                    cardInfo.unlockLevel === 4 ? 'bg-purple-700 text-stone-100 border-purple-500' :
                    'bg-amber-700 text-stone-100 border-amber-500'
                  }`}>
                    {cardInfo.unlockLevel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Level Progression */}
          <div>
            <div className="text-center mb-3">
              <div className="inline-block px-4 py-1 bg-stone-800/80 border-2 border-amber-700/40 rounded-full">
                <span className="text-xs text-amber-500 uppercase tracking-wider font-bold">Level Progression</span>
              </div>
            </div>
            <div className="space-y-2">
              {progression.map((prog, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    prog.locked 
                      ? 'bg-stone-900/40 border-stone-800/50 opacity-60' 
                      : 'bg-gradient-to-r from-amber-950/30 to-stone-900/40 border-amber-700/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 ${
                    prog.level === 1 ? 'bg-stone-700 text-stone-300 border-stone-500' :
                    prog.level === 2 ? 'bg-green-700 text-stone-100 border-green-500' :
                    prog.level === 3 ? 'bg-blue-700 text-stone-100 border-blue-500' :
                    prog.level === 4 ? 'bg-purple-700 text-stone-100 border-purple-500' :
                    'bg-amber-700 text-stone-100 border-amber-500'
                  }`}>
                    {prog.level}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-stone-300">{prog.unlock}</div>
                  </div>
                  {prog.locked && (
                    <Lock size={16} className="text-stone-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
  onEnemyCardClick?: () => void;
  isSelected: boolean;
  isValidTarget: boolean;
  onPreviewStart: (card: Card) => void;
  onPreviewEnd: () => void;
  onProphetAction?: () => void;
  onCrusaderAction?: () => void;
  onRangerAction?: () => void;
  showTargetArrow?: boolean;
  showDefenseArrow?: boolean;
  onLaneHover?: () => void;
  onLaneLeave?: () => void;
  isResolving?: boolean;
  provokeMode?: boolean;
}

const BattleLane = ({ zoneLabel, enemyUnit, playerUnit, enemyCard, playerCard, onPlayerSlotClick, onEnemyCardClick, isValidTarget, onPreviewStart, onPreviewEnd, onProphetAction, onCrusaderAction, onRangerAction, showTargetArrow, showDefenseArrow, onLaneHover, onLaneLeave, isResolving, provokeMode }: BattleLaneProps) => {
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
         <div 
           onClick={provokeMode && enemyCard ? onEnemyCardClick : undefined}
           className={`w-full aspect-[2/3] max-h-[80px] z-10 transition-all duration-300 ${
             isResolving && enemyCard ? 'scale-110 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]' : ''
           } ${
             provokeMode && enemyCard ? 'cursor-pointer ring-2 ring-amber-500 animate-pulse' : ''
           }`}
         >
            {enemyCard ? (
               <Card 
                 {...enemyCard} 
                 isHidden={!enemyCard.revealed} 
                 smallMode={true} 
                 onPreviewStart={() => onPreviewStart && onPreviewStart(enemyCard)}
                 onPreviewEnd={onPreviewEnd}
                 className={`w-full h-full text-[10px] ${
                   isResolving ? 'ring-2 ring-red-500 shadow-lg' : ''
                 }`}
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
           onProphetAction={onProphetAction} 
           onCrusaderAction={onCrusaderAction}
           onRangerAction={onRangerAction}
         />
      </div>
    </div>
  );
};


// --- MAIN APP ---

export default function TheDragonMustDie() {
  const [view, setView] = useState<string>('START');
  const [party, setParty] = useState<Unit[]>([]);
  const [partyLanes, setPartyLanes] = useState<{[heroId: string]: number}>({});
  const [globalDeck, setGlobalDeck] = useState<Card[]>([]);
  const [mapNode, setMapNode] = useState<number>(0);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Two-step hero selection
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([]);
  const [draggedHeroIndex, setDraggedHeroIndex] = useState<number | null>(null);
  const [heroLevels, setHeroLevels] = useState<{[heroId: string]: number}>({});
  
  // Modals & UI State
  const [showDeckModal, setShowDeckModal] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);
  const [provokeMode, setProvokeMode] = useState<boolean>(false);
  const [heroDetailView, setHeroDetailView] = useState<Hero | null>(null);
  
  // Intro Sequence State
  const [introPhase, setIntroPhase] = useState<'STUDIO' | 'SPLASH' | 'NONE'>('STUDIO');
  const [showTapLabel, setShowTapLabel] = useState<boolean>(false);

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playClick = () => {
    const audio = new Audio(clickSfx);
    audio.play().catch(e => console.log("Audio play failed", e));
  };

  useEffect(() => {
    if (introPhase === 'STUDIO') {
       const timer = setTimeout(() => setIntroPhase('SPLASH'), 3000);
       return () => clearTimeout(timer);
    }

    if (introPhase === 'SPLASH') {
       // Automatic transition disabled - wait for user tap
       const labelTimer = setTimeout(() => setShowTapLabel(true), 1000);
       return () => { clearTimeout(labelTimer); };
    }
  }, [introPhase]);

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
  const startDraft = () => { 
    setParty([]); 
    setPartyLanes({}); 
    setSelectedHeroes([]);
    setHeroLevels({});
    setView('HERO_SELECTION'); 
  };
  
  const handleHeroSelect = (heroId: string) => {
    if (selectedHeroes.includes(heroId)) {
      setSelectedHeroes(selectedHeroes.filter(id => id !== heroId));
      // Remove level when hero is deselected
      const newLevels = { ...heroLevels };
      delete newLevels[heroId];
      setHeroLevels(newLevels);
    } else if (selectedHeroes.length < 3) {
      setSelectedHeroes([...selectedHeroes, heroId]);
      // Set default level to 1 when hero is selected
      setHeroLevels({ ...heroLevels, [heroId]: 1 });
    }
  };
  
  const confirmHeroSelection = () => {
    if (selectedHeroes.length !== 3) return;
    // Move to lane assignment view
    setView('LANE_ASSIGNMENT');
  };
  
  const handleDragStart = (index: number) => {
    setDraggedHeroIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (targetIndex: number) => {
    if (draggedHeroIndex === null) return;
    
    const newOrder = [...selectedHeroes];
    const [draggedHero] = newOrder.splice(draggedHeroIndex, 1);
    newOrder.splice(targetIndex, 0, draggedHero);
    
    setSelectedHeroes(newOrder);
    setDraggedHeroIndex(null);
  };
  
  const handleLevelChange = (heroId: string, delta: number) => {
    const currentLevel = heroLevels[heroId] || 1;
    const newLevel = Math.max(1, Math.min(5, currentLevel + delta));
    setHeroLevels({ ...heroLevels, [heroId]: newLevel });
  };
  
  const finalizeDraft = () => {
    if (selectedHeroes.length !== 3) return;
    
    // Create party with heroes in lane order and selected levels
    const finalParty = selectedHeroes.map((heroId) => {
      const heroData = HEROES_DB.find(h => h.id === heroId)!;
      return {
        ...heroData,
        level: heroLevels[heroId] || 1,
        dead: false,
        buffs: { immune: false, tanking: false, strength: 0 }
      } as Unit;
    });
    
    // Set party lanes (0=Front, 1=Mid, 2=Rear)
    const lanes: {[heroId: string]: number} = {};
    selectedHeroes.forEach((heroId, index) => {
      lanes[heroId] = index;
    });
    
    setParty(finalParty);
    setPartyLanes(lanes);
    
    // Build deck
    let deck: Card[] = [];
    finalParty.forEach(hero => {
      if (hero.cards) { 
        const heroCards = hero.cards.map(c => ({
          ...c, 
          ownerId: hero.id, 
          archetype: hero.archetype, 
          uid: Math.random()
        })); 
        deck = [...deck, ...heroCards]; 
      }
    });
    
    setGlobalDeck(deck); 
    setMapNode(0); 
    setView('MAP');
  };

  const enterCombat = (enemyType: string) => {
    let enemies: (Unit | null)[] = [null, null, null];
    if (enemyType === 'boss') {
      // BOSS ENCOUNTER: Dragon + Void Mages (require Prophet scry + Lone Ranger range)
      enemies[1] = { ...ENEMIES_DB.find(e => e.isBoss)!, id: 'boss', name: 'ANCIENT DRAGON', desc: '', maxHp: 15, hp: 15, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
      enemies[0] = { name: 'Void Mage', id: 'guard1', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
      enemies[2] = { name: 'Void Mage', id: 'guard2', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
    } else {
      // STRATEGIC ENCOUNTERS designed for Crusader (F) / Prophet (M) / Lone Ranger (R)
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
          // Challenge: Knight tanks, Cultist buffs him. Must kill cultist first (Lone Ranger!)
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
          // Must rush him down before overwhelmed (Lone Ranger focus!)
          enemies[1] = { name: 'Necromancer', id: 'necro', desc: '', hp: 4, maxHp: 4, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[0] = { name: 'Skeleton', id: 'minion1', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          enemies[2] = { name: 'Skeleton', id: 'minion2', desc: '', hp: 2, maxHp: 2, dead: false, buffs: { immune: false, tanking: false, strength: 0 } };
          break;
          
        case 5: // "THE EXECUTIONER" - Single massive threat
          // Challenge: Berserker deals 4-5 damage per turn
          // Crusader MUST tank it or Prophet/Lone Ranger die instantly
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
      // Initialize cooldown based on hero
      let cooldownMax = 0;
      if (hero.id === 'prophet') cooldownMax = 2;
      else if (hero.id === 'ranger') cooldownMax = 2;
      else if (hero.id === 'crusader') cooldownMax = 0;
      
      combatParty[laneIdx] = { 
        ...hero, 
        grayHp: 0, 
        buffs: { immune: false, tanking: false, strength: 0 },
        activeCooldown: 0,
        activeCooldownMax: cooldownMax
      };
    });
    
    // Add level-specific cards to deck
    let combatDeck = [...globalDeck].sort(() => Math.random() - 0.5);
    party.forEach(hero => {
      const heroLevel = hero.level || 1;
      let levelCards: Card[] = [];
      
      // Crusader level cards
      if (hero.id === 'crusader') {
        if (heroLevel >= 3) {
          // Level 3: Add 2x Eye for an Eye
          levelCards.push(
            { id: 'c_eye', type: 'ATTACK', value: 0, name: 'Eye for an Eye', desc: 'Deal X equal to your missing hearts.', effect: 'EYE_FOR_EYE', ownerId: 'crusader', archetype: 'VENGEANCE' as const, uid: Math.random() },
            { id: 'c_eye', type: 'ATTACK', value: 0, name: 'Eye for an Eye', desc: 'Deal X equal to your missing hearts.', effect: 'EYE_FOR_EYE', ownerId: 'crusader', archetype: 'VENGEANCE' as const, uid: Math.random() }
          );
        }
        if (heroLevel >= 5) {
          // Level 5: Add 1x Nothing to Lose
          levelCards.push(
            { id: 'c_nothing', type: 'SKILL', value: 0, name: 'Nothing to Lose', desc: 'Tank all lanes this turn.', effect: 'TANK_ALL', ownerId: 'crusader', archetype: 'VENGEANCE' as const, uid: Math.random() }
          );
        }
      }
      
      // Ranger level cards
      if (hero.id === 'ranger') {
        if (heroLevel >= 3) {
          // Level 3: Upgrade Arrow Shot to deal 2 damage
          // Replace existing Arrow Shot cards with upgraded versions
          combatDeck = combatDeck.map(card => {
            if (card.id === 'r_arr' && card.ownerId === 'ranger') {
              return { ...card, value: 2, desc: 'Deal 2. Ranged 2.' };
            }
            return card;
          });
        }
        if (heroLevel >= 4) {
          // Level 4: Add 2x Mark of Hunter
          levelCards.push(
            { id: 'r_mark', type: 'FAST', value: 0, name: 'Mark of Hunter', desc: 'Enemy gets double damage this round.', effect: 'MARK_HUNTER', ownerId: 'ranger', archetype: 'BALANCE' as const, uid: Math.random() },
            { id: 'r_mark', type: 'FAST', value: 0, name: 'Mark of Hunter', desc: 'Enemy gets double damage this round.', effect: 'MARK_HUNTER', ownerId: 'ranger', archetype: 'BALANCE' as const, uid: Math.random() }
          );
        }
      }
      
      // Prophet level cards
      if (hero.id === 'prophet') {
        if (heroLevel >= 2) {
          // Level 2: Add 2x Foretell
          const improveValue = heroLevel >= 4 ? 2 : 1; // Level 4 increases Improve by 1
          levelCards.push(
            { id: 'p_foretell', type: 'FAST', value: improveValue, name: 'Foretell', desc: `Improve ${improveValue}; Range 1`, effect: 'IMPROVE', range: 1, ownerId: 'prophet', archetype: 'KINGDOM' as const, uid: Math.random() },
            { id: 'p_foretell', type: 'FAST', value: improveValue, name: 'Foretell', desc: `Improve ${improveValue}; Range 1`, effect: 'IMPROVE', range: 1, ownerId: 'prophet', archetype: 'KINGDOM' as const, uid: Math.random() }
          );
        }
        if (heroLevel >= 3) {
          // Level 3: Add 2x Mending
          const healValue = heroLevel >= 4 ? 2 : 1; // Level 4 increases Heal by 1
          levelCards.push(
            { id: 'p_mending', type: 'FAST', value: healValue, name: 'Mending', desc: `Heal ${healValue}; Range 1`, effect: 'HEAL', range: 1, ownerId: 'prophet', archetype: 'KINGDOM' as const, uid: Math.random() },
            { id: 'p_mending', type: 'FAST', value: healValue, name: 'Mending', desc: `Heal ${healValue}; Range 1`, effect: 'HEAL', range: 1, ownerId: 'prophet', archetype: 'KINGDOM' as const, uid: Math.random() }
          );
        }
        if (heroLevel >= 5) {
          // Level 5: Divination changes to Pick
          // Update existing Divination cards
          combatDeck = combatDeck.map(card => {
            if (card.id === 'p_div' && card.ownerId === 'prophet') {
              return { ...card, desc: 'Pick 1 kingdom card. If you can\'t, draw 1 card.', effect: 'PICK' };
            }
            return card;
          });
        }
      }
      
      combatDeck = [...combatDeck, ...levelCards];
    });
    
    combatDeck = combatDeck.sort(() => Math.random() - 0.5);
    
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
          // Crusader passive: Gain Gray HP based on level
          if (unit.id === 'crusader') {
            const grayHpGain = (unit.level && unit.level >= 4) ? 2 : 1;
            unit.grayHp = (unit.grayHp || 0) + grayHpGain;
          }
          // Decrement cooldown each turn
          if (unit.activeCooldown && unit.activeCooldown > 0) {
              unit.activeCooldown = unit.activeCooldown - 1;
          }
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
     
     // Find prophet unit and check cooldown
     const prophetUnit = combatState.playerUnits.find(u => u && u.id === 'prophet');
     if (!prophetUnit || prophetUnit.activeCooldown! > 0) return;
     
     // Reveal all enemy cards immediately
     const newPlayerUnits = combatState.playerUnits.map(u => {
       if (u && u.id === 'prophet') {
         return { ...u, activeCooldown: u.activeCooldownMax || 0 };
       }
       return u;
     });
     
     setCombatState(prev => ({ 
       ...prev!, 
       scryActive: true,
       playerUnits: newPlayerUnits,
       enemyZoneCards: prev!.enemyZoneCards.map(c => c ? { ...c, revealed: true } : null)
     }));
     addLog("Prophet reveals all enemy intentions!");
  };

  const onCrusaderAction = () => {
     if (!combatState || combatState.phase !== 'planning') return;
     
     // Find crusader unit and check cooldown
     const crusaderUnit = combatState.playerUnits.find(u => u && u.id === 'crusader');
     if (!crusaderUnit || crusaderUnit.activeCooldown! > 0) return;
     
     // Check if Provoke is unlocked (level 2+)
     if (!crusaderUnit.level || crusaderUnit.level < 2) {
       addLog("Provoke locked! Requires Level 2.");
       return;
     }
     
     // Activate Provoke mode - player must select an enemy card
     setProvokeMode(true);
     addLog("Crusader Provoke: Select an enemy card to force an attack!");
  };

  const onRangerAction = () => {
     if (!combatState || combatState.phase !== 'planning') return;
     
     // Find ranger unit and check cooldown
     const rangerUnit = combatState.playerUnits.find(u => u && u.id === 'ranger');
     if (!rangerUnit || rangerUnit.activeCooldown! > 0) return;
     
     // Camouflage: Get Immune this round
     const newPlayerUnits = combatState.playerUnits.map(u => {
       if (u && u.id === 'ranger') {
         return { 
           ...u, 
           activeCooldown: u.activeCooldownMax || 0,
           buffs: { ...u.buffs, immune: true }
         };
       }
       return u;
     });
     
     setCombatState(prev => ({ ...prev!, playerUnits: newPlayerUnits }));
     addLog("Ranger uses Camouflage! Immune this turn!");
  };

  const handleProvokeClick = (laneIdx: number) => {
    if (!combatState || !provokeMode) return;
    
    const enemyCard = combatState.enemyZoneCards[laneIdx];
    const enemyUnit = combatState.enemyUnits[laneIdx];
    
    if (!enemyCard || !enemyUnit || enemyUnit.dead) {
      addLog("No valid target!");
      return;
    }
    
    // Generate an attack card, preferring one from the targeted enemy
    const enemyDeckType = (enemyUnit as any).deckType || 'medium';
    let attackValue = 2;
    
    // Generate attack based on enemy type
    switch (enemyDeckType) {
      case 'burst':
      case 'big_damage':
        attackValue = 3 + Math.floor(Math.random() * 2);
        break;
      case 'boss':
        attackValue = 3 + Math.floor(Math.random() * 3);
        break;
      case 'medium':
      case 'tricky':
        attackValue = 2 + Math.floor(Math.random() * 2);
        break;
      default:
        attackValue = 1 + Math.floor(Math.random() * 2);
    }
    
    const attackCard: Card = {
      id: 'enemy_provoked',
      type: 'ATTACK',
      value: attackValue,
      name: 'Provoked Strike',
      desc: '',
      revealed: true // Provoked cards stay revealed
    };
    
    // Replace the enemy card and set cooldown
    const newPlayerUnits = combatState.playerUnits.map(u => {
      if (u && u.id === 'crusader') {
        return { ...u, activeCooldown: u.activeCooldownMax || 0 };
      }
      return u;
    });
    
    const newEnemyZones = [...combatState.enemyZoneCards];
    const oldCard = newEnemyZones[laneIdx];
    newEnemyZones[laneIdx] = attackCard;
    
    // Discard the old card
    const newEnemyDiscard = oldCard ? [...(combatState.discardPile || []), oldCard] : combatState.discardPile;
    
    setCombatState(prev => ({
      ...prev!,
      playerUnits: newPlayerUnits,
      enemyZoneCards: newEnemyZones,
      discardPile: newEnemyDiscard
    }));
    
    setProvokeMode(false);
    addLog(`Crusader provokes ${enemyUnit.name} into attacking with ${attackValue} damage!`);
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
          
          // Handle DIVINE effect
          if (card.effect === 'DIVINE') {
              // Divine: draw a random KINGDOM archetype card from deck (only Prophet)
              const kingdomCardsInDeck = combatState.drawPile.filter(c => 
                  c.archetype === 'KINGDOM'
              );
              
              if (kingdomCardsInDeck.length > 0) {
                  // Divine: draw a random kingdom card from deck
                  const randomIndex = Math.floor(Math.random() * kingdomCardsInDeck.length);
                  const divinedCard = kingdomCardsInDeck[randomIndex];
                  
                  setCombatState(prev => ({
                      ...prev!,
                      playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx).concat(divinedCard),
                      drawPile: prev!.drawPile.filter(c => c.uid !== divinedCard.uid),
                      discardPile: [...prev!.discardPile, card],
                      selectedCardIdx: null
                  }));
                  addLog(`Divine: Drew ${divinedCard.name} from deck!`);
              } else {
                  // No kingdom cards in deck, draw 1 card normally
                  if (combatState.drawPile.length > 0) {
                      const drawnCard = combatState.drawPile[0];
                      setCombatState(prev => ({
                          ...prev!,
                          playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx).concat(drawnCard),
                          drawPile: prev!.drawPile.slice(1),
                          discardPile: [...prev!.discardPile, card],
                          selectedCardIdx: null
                      }));
                      addLog(`Divine failed: Drew ${drawnCard.name} instead`);
                  } else {
                      // No cards in deck at all
                      setCombatState(prev => ({
                          ...prev!,
                          playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx),
                          discardPile: [...prev!.discardPile, card],
                          selectedCardIdx: null
                      }));
                      addLog("Divine failed: No cards in deck!");
                  }
              }
              return;
          }
          
          // Handle PICK effect (level 5 upgrade of DIVINE)
          if (card.effect === 'PICK') {
              // Pick: search deck for kingdom cards and let player choose
              const kingdomCardsInDeck = combatState.drawPile.filter(c => 
                  c.archetype === 'KINGDOM'
              );
              
              if (kingdomCardsInDeck.length > 0) {
                  // For now, auto-pick the first kingdom card
                  // TODO: Add UI for player to choose
                  const pickedCard = kingdomCardsInDeck[0];
                  
                  setCombatState(prev => ({
                      ...prev!,
                      playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx).concat(pickedCard),
                      drawPile: prev!.drawPile.filter(c => c.uid !== pickedCard.uid),
                      discardPile: [...prev!.discardPile, card],
                      selectedCardIdx: null
                  }));
                  addLog(`Pick: Added ${pickedCard.name} to hand!`);
              } else {
                  // No kingdom cards in deck, draw 1 card normally
                  if (combatState.drawPile.length > 0) {
                      const drawnCard = combatState.drawPile[0];
                      setCombatState(prev => ({
                          ...prev!,
                          playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx).concat(drawnCard),
                          drawPile: prev!.drawPile.slice(1),
                          discardPile: [...prev!.discardPile, card],
                          selectedCardIdx: null
                      }));
                      addLog(`Pick failed: Drew ${drawnCard.name} instead`);
                  } else {
                      // No cards in deck at all
                      setCombatState(prev => ({
                          ...prev!,
                          playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx),
                          discardPile: [...prev!.discardPile, card],
                          selectedCardIdx: null
                      }));
                      addLog("Pick failed: No cards in deck!");
                  }
              }
              return;
          }
          
          // Handle IMPROVE effect
          if (card.effect === 'IMPROVE') {
              // Improve: add bonus to the card already in the zone
              const newPlayerZones = [...combatState.playerZoneCards];
              if (newPlayerZones[idx]) {
                // Add improve bonus to existing card
                const existingCard = newPlayerZones[idx]!;
                newPlayerZones[idx] = { 
                  ...existingCard, 
                  value: existingCard.value + card.value,
                  desc: existingCard.desc + ` (+${card.value})`
                };
                
                setCombatState(prev => ({
                    ...prev!,
                    playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx),
                    playerZoneCards: newPlayerZones,
                    discardPile: [...prev!.discardPile, card],
                    enemyZoneCards: newEnemyZones,
                    selectedCardIdx: null
                }));
                addLog(`Foretell: +${card.value} to lane ${idx}!`);
              } else {
                addLog("No card in lane to improve!");
                setCombatState(prev => ({
                    ...prev!,
                    selectedCardIdx: null
                }));
              }
              return;
          }
          
          // Handle HEAL effect
          if (card.effect === 'HEAL') {
              // Heal: immediately heal the hero in target lane
              const healAmount = card.value;
              const newPlayerUnits = [...combatState.playerUnits];
              if (newPlayerUnits[idx]) {
                  const hero = newPlayerUnits[idx]!;
                  const oldHp = hero.hp;
                  hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
                  const actualHeal = hero.hp - oldHp;
                  
                  setCombatState(prev => ({
                      ...prev!,
                      playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx),
                      playerUnits: newPlayerUnits,
                      discardPile: [...prev!.discardPile, card],
                      enemyZoneCards: newEnemyZones,
                      selectedCardIdx: null
                  }));
                  addLog(`Mending: Healed ${hero.name} for ${actualHeal} HP!`);
              } else {
                  addLog("No hero in lane to heal!");
                  setCombatState(prev => ({
                      ...prev!,
                      selectedCardIdx: null
                  }));
              }
              return;
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
    setProvokeMode(false); // Cancel provoke mode when ending turn
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
        if (card.effect === 'TANK_ALL') {
          // Tank all lanes: set tanking on this unit and apply to all lanes
          sourceUnit.buffs.tanking = true;
        }
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
            // Eye for an Eye: damage equals missing hearts
            if (pCard.effect === 'EYE_FOR_EYE') {
              dmg = pUnit.maxHp - pUnit.hp;
            }
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
            
            // Ranger Level 5: CRIT - If ranger is immune, double damage
            const rangerUnit = pUnits.find(u => u && u.id === 'ranger' && !u.dead && (u.level || 1) >= 5);
            if (rangerUnit && rangerUnit.buffs.immune && pCard.ownerId === 'ranger') {
              dmg *= 2;
              msg += "CRIT! ";
            }
            
            let reduction = (eZones[targetIdx]?.type === 'DEFENSE') ? (eZones[targetIdx]?.value || 0) : 0;
            let finalDmg = Math.max(0, dmg - reduction);
            
            // Ranger Level 2: Revealed enemies get +1 damage from all sources
            const targetEnemy = eUnits[targetIdx];
            if (targetEnemy && eZones[targetIdx]?.revealed) {
              const hasRangerLevel2 = pUnits.some(u => u && u.id === 'ranger' && !u.dead && (u.level || 1) >= 2);
              if (hasRangerLevel2 && finalDmg > 0) {
                finalDmg += 1;
                msg += "+1 Revealed! ";
              }
            }
            
            // Mark of Hunter: Double damage this round
            if (eZones[targetIdx]?.effect === 'MARK_HUNTER' && finalDmg > 0) {
              finalDmg *= 2;
              msg += "Marked! ";
            }
            
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
            
            // Check for tanking: TANK_RIGHT tanks for right lane, TANK_ALL tanks for all lanes
            const tankingUnit = pUnits.find((u, idx) => {
              if (!u || u.dead || !u.buffs.tanking) return false;
              // TANK_ALL: check if any player zone card has TANK_ALL effect
              const hasTankAll = pZones.some(c => c?.effect === 'TANK_ALL' && c.ownerId === u.id);
              if (hasTankAll) return true;
              // TANK_RIGHT: only tank for the lane to the right (idx+1 === targetIdx)
              return idx + 1 === targetIdx;
            });
            
            if (tankingUnit) { 
              targetUnit = tankingUnit; 
              msg += "Tank! "; 
            }

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

  if (introPhase === 'STUDIO') {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden relative z-[200]">
         <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full relative shadow-2xl bg-black flex items-center justify-center">
            <img 
              key="studio-logo"
              src={rekodeLogo} 
              alt="Rekode Studio" 
              className="w-2/3 object-contain opacity-0 animate-fade-in"
              style={{ animationDuration: '1.5s' }}
            />
         </div>
      </div>
    );
  }

  if (introPhase === 'SPLASH') {
    return (
      <div 
        className="w-full h-screen bg-black flex items-center justify-center cursor-pointer overflow-hidden relative z-[200]"
        onClick={() => { playClick(); setIntroPhase('NONE'); }}
      >
         <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full relative shadow-2xl">
            <img 
              key="splash-logo"
              src={splashScreenImage} 
              alt="The Dragon Must Die" 
              className="w-full h-full object-cover opacity-0 animate-fade-in"
              style={{ animationDuration: '1s' }}
            />
            {showTapLabel && (
                <div className="absolute bottom-16 left-0 right-0 text-center animate-pulse z-10">
                    <span className="text-white font-serif tracking-widest text-xl uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] border-b-2 border-transparent pb-1">
                        Tap to continue
                    </span>
                </div>
            )}
         </div>
         <audio ref={audioRef} src={clickSfx} preload="auto" />
      </div>
    );
  }

  // Hero Detail View Modal (renders on top of any view)
  if (heroDetailView) {
    return <HeroDetailView hero={heroDetailView} onClose={() => setHeroDetailView(null)} />;
  }
  
  if (view === 'START') {
    return (
       <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif">
          {/* Global Audio for other views */}
          <audio ref={audioRef} src={clickSfx} preload="auto" /> 
          <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full flex flex-col items-center justify-end border-4 border-stone-800 bg-stone-950 relative overflow-hidden shadow-2xl pb-24 opacity-0 animate-fade-in">
             {/* Background */}
             <div className="absolute inset-0">
               <img src={startScreenImage} alt="" className="w-full h-full object-cover opacity-80" />
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
             </div>
             
             <div className="z-10 text-center w-full px-8 relative">
                <button onClick={() => { playClick(); startDraft(); }} className="w-full py-4 bg-indigo-950 hover:bg-indigo-900 text-stone-200 font-bold rounded-lg border-2 border-indigo-800/50 shadow-xl shadow-black/50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider backdrop-blur-sm">
                   <Play size={20} className="fill-stone-200" /> Start Game
                </button>
             </div>
          </div>
       </div>
    );
  }

  // HERO SELECTION VIEW (Step 1: Pick 3 heroes)
  if (view === 'HERO_SELECTION') {
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
                      onClick={() => !isLocked && handleHeroSelect(hero.id)}
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
  }

  // LANE ASSIGNMENT VIEW (Step 2: Drag & drop to assign lanes)
  if (view === 'LANE_ASSIGNMENT') {
    const laneNames = ['Front Line', 'Mid Line', 'Rear Line'];
    const laneLabels = ['FRONT', 'MID', 'REAR'];
    // const laneDescriptions = [
    //   'Vanguards who charge into the fray first, bearing the brunt of enemy assault',
    //   'Tactical support maintaining balance between offense and defense',
    //   'Strategic reserves striking from safety with devastating precision'
    // ];
    
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
                onClick={() => setView('HERO_SELECTION')}
                className="px-6 py-3 font-bold text-sm rounded-full uppercase tracking-wider border-2 border-stone-500 bg-stone-700 hover:bg-stone-600 text-stone-300 transition-all shadow-lg active:scale-95"
              >
                Back
              </button>
              <button
                onClick={finalizeDraft}
                className="px-8 py-3 font-bold text-sm rounded-full uppercase tracking-wider border-2 border-amber-300 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-500/50 hover:shadow-amber-500/70 hover:scale-105 transition-all"
              >
                Start Adventure
              </button>
            </div>
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

          {/* PROVOKE MODE BANNER */}
          {provokeMode && (
            <div className="absolute top-12 left-0 right-0 z-50 bg-amber-900/95 border-y-2 border-amber-500 shadow-2xl backdrop-blur-md py-2 px-4 flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-amber-200" />
                <span className="text-sm font-bold text-amber-100 uppercase tracking-wider">Provoke Mode: Select Enemy Card</span>
              </div>
              <button 
                onClick={() => setProvokeMode(false)}
                className="px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-xs font-bold text-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

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
                let calculatedDefenseLane: number | null = null;
                
                if (hoveredLane !== null && selectedCard && !selectedCard.isPotion) {
                    calculatedTargetLane = hoveredLane;
                    
                    // Check if card has Tank/Defense effects that protect adjacent/all lanes
                    if (selectedCard.effect === 'TANK_ALL') {
                        // TANK_ALL: Show defense arrow on all lanes (we'll show arrows on all)
                        // For simplicity, we'll handle this in the render loop
                    } else if (selectedCard.effect === 'TANK_RIGHT' || selectedCard.effect === 'ATTACK_DEF_RIGHT') {
                        // Show defense arrow on the lane to the right (hoveredLane + 1)
                        if (hoveredLane < 2) {
                            calculatedDefenseLane = hoveredLane + 1;
                        }
                    }
                    
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
                    
                    // Check if this lane should show defense arrow
                    let shouldShowDefenseArrow = false;
                    if (hoveredLane !== null && selectedCard && !selectedCard.isPotion) {
                        if (selectedCard.effect === 'TANK_ALL') {
                            // TANK_ALL: Show defense arrow on all lanes except the hovered one
                            shouldShowDefenseArrow = laneIdx !== hoveredLane;
                        } else {
                            // TANK_RIGHT: Show arrow on calculated defense lane
                            shouldShowDefenseArrow = calculatedDefenseLane === laneIdx;
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
                         onEnemyCardClick={() => handleProvokeClick(laneIdx)}
                         isSelected={false}
                         isValidTarget={isValidTarget}
                         onPreviewStart={setPreviewCard}
                         onPreviewEnd={() => setPreviewCard(null)}
                         onProphetAction={onProphetAction}
                         onCrusaderAction={onCrusaderAction}
                         onRangerAction={onRangerAction}
                         showTargetArrow={calculatedTargetLane === laneIdx && hoveredLane !== null}
                         showDefenseArrow={shouldShowDefenseArrow}
                         onLaneHover={() => setHoveredLane(laneIdx)}
                         onLaneLeave={() => setHoveredLane(null)}
                         isResolving={resolvingLane === laneIdx}
                         provokeMode={provokeMode}
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
                          className={`aspect-[2/3] h-[140px] transition-transform duration-300 ${
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
                   <Card {...previewCard} disabled={false} previewMode={true} className="w-full h-full" />
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