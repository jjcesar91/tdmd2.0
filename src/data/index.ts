import { Card, Hero } from '../types';

export const ZONES = ['F', 'M', 'R'];

export const POTIONS_DB: Card[] = [
  { id: 'pot_heal', type: 'SKILL', value: 3, name: 'Healing Potion', desc: 'Heal 3 HP', isPotion: true, color: 'bg-emerald-950', border: 'border-emerald-700' },
  { id: 'pot_inv', type: 'SKILL', value: 0, name: 'Invis. Potion', desc: 'Immune 1 round', isPotion: true, color: 'bg-indigo-950', border: 'border-indigo-700' },
  { id: 'pot_str', type: 'SKILL', value: 2, name: 'Str. Potion', desc: '+2 DMG next', isPotion: true, color: 'bg-amber-950', border: 'border-amber-700' }
];

export const HEROES_DB: Hero[] = [
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
    name: 'Mad Prophet',
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

export const ENEMIES_DB = [
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
