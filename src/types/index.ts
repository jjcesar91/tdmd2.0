export type CardType = 'BASIC' | 'SIGNATURE' | 'ULTIMATE' | 'CRAFTED';

export type EffectType = 
    | 'DEAL_DAMAGE'       
    | 'GAIN_GRAY_HP'      
    | 'HEAL'              
    | 'BUFF_ATTACK'       
    | 'BUFF_DEFENSE'      
    | 'VULNERABLE'        
    | 'DETAIN'            
    | 'STUN'              
    | 'IMMUNE'            
    | 'TANK_RIGHT'        
    | 'TANK_ALL'          
    | 'DEF_RIGHT'         
    | 'CLEAVE'            
    | 'BLOOD_OATH'        
    | 'PURGE'             
    | 'EYE_FOR_EYE'       
    | 'MARK_HUNTER'       
    | 'HASTE'             
    | 'SCRY'              
    | 'REVEAL'
    | 'UNSTABLE_MIXTURE'
    | 'NOXIOUS'
    ;

export interface CardEffect {
    type: EffectType;
    amount: number; 
    target?: 'SELF' | 'ENEMY' | 'ALLY' | 'ALL_ENEMIES' | 'ALL_ALLIES';
}

export interface Card {
  id: string;
  type: CardType;
  // value: number; // Removed in favor of effects array
  name: string;
  desc: string;
  ownerId?: string;
  uid?: number;
  isPotion?: boolean;
  color?: string;
  border?: string;
  range?: number;
  // effect?: string; // Removed in favor of effects array
  effects: CardEffect[]; // New structured effects
  revealed?: boolean;
  archetype?: 'KINGDOM' | 'VENGEANCE' | 'BALANCE' | 'POWER';
  speed?: 'NORMAL' | 'FAST';
  lanes?: 'ALL' | 'FRONT' | 'MID' | 'REAR';
  image?: string;
  detained?: number;
  volatile?: boolean;
  mergedCards?: Card[];
  persist?: number;
  recoil?: number;
  resolved?: boolean;
}

export interface Buffs {
  immune: boolean;
  tanking: boolean;
  augment: number;
  anger?: number;
  vulnerable?: number;
}

export interface Unit {
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
  portrait?: string;
  avatar?: string;
}

export interface CombatState {
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
  laneEffects: { [key: number]: string[] }; // e.g. laneEffects[0] = ['HASTE']
}

export type Hero = {
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
  passiveName?: string;
  passiveIcon?: string;
  portrait?: string;
  avatar?: string;
};
