import { Card, Hero } from '../types';
import stalwartIcon from '../assets/images/heroes/crusader/skills/stalwart-skill.png';
import cleaveCardImage from '../assets/images/heroes/crusader/cards/cleave-card.png';
import bloodOathCardImage from '../assets/images/heroes/crusader/cards/bloodoath-card.png';
import purgeCardImage from '../assets/images/heroes/crusader/cards/purge-card.png';

export const ZONES = ['F', 'M', 'R'];

export const KEYWORDS: Record<string, string> = {
  'Immune': 'Prevents all damage and effects for the round.',
  'Heal': 'Restores Health Points (HP).',
  'Mending': 'Restores Health Points (HP).',
  'Reveal': 'Flips a face-down enemy card face up.',
  'Scry': 'Flips an enemy card face up, revealing their intent.',
  'Detain': 'Target card cannot be flip, discarded or resolved for X turns.',
  'Tank': 'Redirects attacks from other lanes to this unit.',
  'Marked': 'The target takes double (2x) damage this round.',
  'Cleave': 'Deals damage to the target lane AND adjacent lanes.',
  'Improve': 'Permanently increases the value of a card or unit stat.',
  'Pick': 'Choose a specific card from a selection.',
  'Anger': 'Increases Attack Damage.',
  'Gray Heart': 'Temporary HP that absorbs damage before real HP is touched.',
  'Prevent': 'Reduces incoming damage by a flat amount.',
  'Stalwart': 'Gain 1 Gray Heart each round.',
  'Camouflage': 'Immune this turn.',
  'Map Vision': 'See adjacent nodes.',
  'Scry All': 'Reveal all enemy cards.',
  'Range': 'Can target enemies X lanes away.',
  'Ranged': 'Can target enemies X lanes away.',
  'Revealed': 'Target character has a face up card on its lane.'
};

export const POTIONS_DB: Card[] = [
  { id: 'pot_heal', type: 'BASIC', value: 3, name: 'Healing Potion', desc: 'Heal 3 HP', isPotion: true, color: 'bg-emerald-950', border: 'border-emerald-700' },
  { id: 'pot_inv', type: 'BASIC', value: 0, name: 'Invis. Potion', desc: 'Immune 1 round', isPotion: true, color: 'bg-indigo-950', border: 'border-indigo-700' },
  { id: 'pot_str', type: 'BASIC', value: 2, name: 'Str. Potion', desc: '+2 DMG next', isPotion: true, color: 'bg-amber-950', border: 'border-amber-700' }
];

export const HEROES_DB: Hero[] = [
  {
    id: 'crusader',
    name: 'Crusader',
    role: 'TANK',
    desc: 'Passive: Gain 1 Gray Heart each round.',
    passiveName: 'Stalwart',
    passiveIcon: stalwartIcon,
    hp: 5,
    maxHp: 5,
    archetype: 'VENGEANCE',
    level: 1,
    locked: false,
    lore: 'An old veteran, back to action to avenge its family',
    cards: [
      { id: 'c_cleave', type: 'BASIC', actionType: 'ATTACK', value: 2, name: 'Cleave', desc: 'Deal 2. Also deal 2 to adjacent lanes.', effect: 'CLEAVE', ownerId: 'crusader', speed: 'NORMAL', lanes: 'ALL', image: cleaveCardImage },
      { id: 'c_blood_oath', type: 'SIGNATURE', actionType: 'SKILL', value: 0, name: 'Blood Oath', desc: 'Lose 2 hearts. Gain Anger 2.', effect: 'BLOOD_OATH', ownerId: 'crusader', speed: 'FAST', image: bloodOathCardImage },
      { id: 'c_purge', type: 'ULTIMATE', actionType: 'ATTACK', value: 0, name: 'Purge', desc: 'Deal X. (X equals to missing hearts)', effect: 'PURGE', ownerId: 'crusader', speed: 'NORMAL', image: purgeCardImage },
    ]
  },
  {
    id: 'ranger',
    name: 'Lone Ranger',
    role: 'DPS',
    desc: "Passive: Deal double damage against Revealed enemies.",
    passiveName: "Hunter's Mark",
    hp: 3,
    maxHp: 3,
    archetype: 'BALANCE' as const,
    level: 1,
    locked: false,
    lore: 'Outcast in the wilds, seeking to restore nature balance to the land',
    cards: [
      { id: 'r_arrow_shot', type: 'BASIC', actionType: 'ATTACK', value: 2, name: 'Arrow Shot', desc: 'Deal 2.', range: 2, ownerId: 'ranger', speed: 'NORMAL' },
      { id: 'r_eye_above', type: 'SIGNATURE', actionType: 'SKILL', value: 0, name: 'Eye from above', desc: 'Reveal this lane.', range: 1, effect: 'SCRY_LANE', ownerId: 'ranger', speed: 'FAST' },
      { id: 'r_pietrifying_curse', type: 'ULTIMATE', actionType: 'SKILL', value: 2, name: 'Pietrifying Curse', desc: 'Detain 2', range: 2, effect: 'DETAIN', ownerId: 'ranger', speed: 'NORMAL' }
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
    cards: []
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
    cards: []
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
    cards: []
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
      { id: 'pri_1', type: 'BASIC', actionType: 'SKILL', value: 1, name: 'Grace', desc: 'Heal 1.', range: 1 },
      { id: 'pri_2', type: 'BASIC', actionType: 'DEFENSE', value: 1, name: 'Protect', desc: 'Prevent 1.', range: 1 },
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
    cards: []
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
