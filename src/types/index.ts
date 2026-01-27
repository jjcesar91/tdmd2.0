export type CardType = 'BASIC' | 'SIGNATURE' | 'ULTIMATE' | 'CRAFTED';

export interface Card {
  id: string;
  type: CardType;
  actionType?: 'ATTACK' | 'DEFENSE' | 'SKILL'; // Added to support combat logic
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
