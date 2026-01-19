export type CardType = 'BASIC' | 'SIGNATURE' | 'ULTIMATE';

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
}

export interface Buffs {
  immune: boolean;
  tanking: boolean;
  strength: number;
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
};
