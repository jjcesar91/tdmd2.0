export type CardType = 'BASIC' | 'SIGNATURE' | 'ULTIMATE' | 'CRAFTED';

export type ModCategory = 'BUFF' | 'DEBUFF';
export type ModType = 'AUGMENT' | 'VULNERABLE';

export type EffectType = 
    | 'DEAL_DAMAGE'       
    | 'GAIN_GRAY_HP'      
    | 'HEAL'              
    | 'APPLY_MOD'       
    | 'DETAIN'            
    | 'IMMUNE'            
    | 'TANK_ALL'          
    | 'BLOOD_OATH'        
    | 'PURGE'             
    | 'HASTE'             
    | 'SCRY'              
    | 'REVEAL'
    | 'UNSTABLE_MIXTURE'
    | 'CHEMICAL_REACTION'
    | 'NOXIOUS'
    ;

export interface CardEffect {
    type: EffectType;
    amount: number; 
    target?: 'SELF' | 'ENEMY' | 'ALLY' | 'ALL_ENEMIES' | 'ALL_ALLIES';
    modType?: ModType;
    modCategory?: ModCategory;
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
  potionLevel?: number;
  color?: string;
  border?: string;
  range?: number;
  // effect?: string; // Removed in favor of effects array
  effects: CardEffect[]; // New structured effects
  revealed?: boolean;
  archetype?: 'KINGDOM' | 'VENGEANCE' | 'BALANCE' | 'POWER';
  speed?: 'NORMAL' | 'FAST';
  lanes?: 'ALL' | 'FRONT' | 'MID' | 'REAR' | ('FRONT' | 'MID' | 'REAR')[];
  image?: string;
  isAoE?: boolean;
  detained?: number;
  volatile?: boolean;
  persistent?: boolean;
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
  fortitude?: number;
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
  aiPattern?: string[];
  aiCurrentStep?: number;
}

export interface SelectionRequest {
  type: 'HAND' | 'DISCARD' | 'DECK';
  count: number;
  filter?: (card: Card) => boolean;
  onConfirm: (selectedCardIndices: number[]) => void;
  title: string;
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
  selectionRequest?: SelectionRequest | null;
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
