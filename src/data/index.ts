import { Card, Hero } from '../types';
import crusaderPortrait from '../assets/images/heroes/crusader/crusader-portrait.png';
import rangerPortrait from '../assets/images/heroes/loneranger/loneranger-portrait.png';
import prophetPortrait from '../assets/images/heroes/madprophet/madprophet-portrait.png';
import alchemistPortrait from '../assets/images/heroes/alchemist/alchemist-portrait.png';
import crusaderAvatar from '../assets/images/heroes/crusader/crusader-avatar.png';
import rangerAvatar from '../assets/images/heroes/loneranger/loneranger-avatar.png';
import prophetAvatar from '../assets/images/heroes/madprophet/madprophet-avatar.png';
import alchemistAvatar from '../assets/images/heroes/alchemist/alchemist-avatar.png';
import explosiveFlaskCardImage from '../assets/images/heroes/alchemist/cards/explosiveflask-card.png';
import unstableMixtureCardImage from '../assets/images/heroes/alchemist/cards/unstablemixture-card.png';
import noxiousCloudCardImage from '../assets/images/heroes/alchemist/cards/noxiouscloud-card.png';
import skilledBreweryIcon from '../assets/images/heroes/alchemist/skills/skilledbrewery-skill.png';
import stalwartIcon from '../assets/images/heroes/crusader/skills/stalwart-skill.png';
import cleaveCardImage from '../assets/images/heroes/crusader/cards/cleave-card.png';
import bloodOathCardImage from '../assets/images/heroes/crusader/cards/bloodoath-card.png';
import purgeCardImage from '../assets/images/heroes/crusader/cards/purge-card.png';
import arrowShotCardImage from '../assets/images/heroes/loneranger/cards/arrowshot-card.png';
import quetzalSightCardImage from '../assets/images/heroes/loneranger/cards/quetzalsight-card.png';
import pietrifyingCurseCardImage from '../assets/images/heroes/loneranger/cards/pietrifyingcurse-card.png';
import huntersMarkIcon from '../assets/images/heroes/loneranger/skills/huntersmark-skill.png';
import foreseeCardImage from '../assets/images/heroes/madprophet/cards/foresee-card.png';
import omenCardImage from '../assets/images/heroes/madprophet/cards/omen-card.png';
import epiphanyCardImage from '../assets/images/heroes/madprophet/cards/epiphany-card.png';
import theProphecyIcon from '../assets/images/heroes/madprophet/skills/thepropecy-skill.png';
import healingPotionImage from '../assets/images/potions/healing-potion.png';
import invisibilityPotionImage from '../assets/images/potions/invisibility-potion.png';
import augmentationPotionImage from '../assets/images/potions/augmentation-potion.png';
import hastePotionImage from '../assets/images/potions/haste-potion.png';

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
  'AoE': 'Area of Effect, effects also apply to adjacent lanes.',
  'Improve': 'Permanently increases the value of a card or unit stat.',
  'Pick': 'Choose a specific card from a selection.',
  'Augment': 'Increases Attack Damage.',
  'Gray Heart': 'Temporary HP that absorbs damage before real HP is touched.',
  'Prevent': 'Converts the defense value into Gray Hearts.',
  'Stalwart': 'Gain 1 Gray Heart each round.',
  'Scry All': 'Reveal all enemy cards.',
  'Range': 'Can target enemies X lanes away.',
  'Ranged': 'Can target enemies X lanes away.',
  'Revealed': 'Target character has a face up card on its lane.',
  'Vulnerable': 'For X turn, when damage is dealt to the character, it lose 2 more hearts (ignore defenses).',
  'Volatile': 'If this card is in your hand at the end of the turn, remove it from game.',
  'Persist': 'For the next X Cleanup Phase, it won\'t get discarded.',
  'Recoil': 'Affect the enemy lane, deal X each time a card is resolved on it.',
  'Craft': 'Create a new card and add it to your hand.',
  'Merge': 'Combine two cards into one with both effects.'
};

export const POTIONS_DB: Card[] = [
  { id: 'pot_heal', type: 'CRAFTED', effects: [{ type: 'HEAL', amount: 2, target: 'ALLY' }], name: 'Healing Potion', desc: 'Heal 2 hearts.', isPotion: true, speed: 'FAST', range: 1, color: 'bg-emerald-950', border: 'border-emerald-700', image: healingPotionImage },
  { id: 'pot_inv', type: 'CRAFTED', effects: [{ type: 'IMMUNE', amount: 1, target: 'ALLY' }], name: 'Invisible Potion', desc: 'Immune this turn.', isPotion: true, speed: 'FAST', range: 1, color: 'bg-indigo-950', border: 'border-indigo-700', image: invisibilityPotionImage },
  { id: 'pot_aug', type: 'CRAFTED', effects: [{ type: 'APPLY_MOD', modType: 'AUGMENT', modCategory: 'BUFF', amount: 2, target: 'ALLY' }], name: 'Augmented Potion', desc: 'Gain Augment 2.', isPotion: true, speed: 'FAST', range: 1, color: 'bg-amber-950', border: 'border-amber-700', image: augmentationPotionImage },
  { id: 'pot_haste', type: 'CRAFTED', effects: [{ type: 'HASTE', amount: 1, target: 'ALLY' }], name: 'Haste Potion', desc: 'Next card played here gain FAST.', isPotion: true, speed: 'FAST', range: 1, color: 'bg-orange-950', border: 'border-orange-700', image: hastePotionImage }
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
    portrait: crusaderPortrait,
    avatar: crusaderAvatar,
    lore: 'An old veteran, back to action to avenge its family',
    cards: [
      { id: 'c_cleave', type: 'BASIC', effects: [{ type: 'DEAL_DAMAGE', amount: 2, target: 'ENEMY' }], name: 'Cleave', desc: 'AoE. Deal 2.', ownerId: 'crusader', speed: 'NORMAL', lanes: 'ALL', image: cleaveCardImage, isAoE: true },
      { id: 'c_blood_oath', type: 'SIGNATURE', effects: [{ type: 'BLOOD_OATH', amount: 2, target: 'SELF' }], name: 'Blood Oath', desc: 'Lose 2 hearts. Gain Augment 2.', ownerId: 'crusader', speed: 'FAST', lanes: 'ALL', image: bloodOathCardImage },
      { id: 'c_purge', type: 'ULTIMATE', effects: [{ type: 'PURGE', amount: 0, target: 'ENEMY' }], name: 'Purge', desc: 'Deal 2, plus hero missing hearts', ownerId: 'crusader', speed: 'NORMAL', lanes: 'FRONT', image: purgeCardImage },
    ]
  },
  {
    id: 'ranger',
    name: 'Lone Ranger',
    role: 'DPS',
    desc: "Passive: Deal +1 damage against Revealed enemies.",
    passiveName: "Hunter's Mark",
    passiveIcon: huntersMarkIcon,
    hp: 4,
    maxHp: 4,
    archetype: 'BALANCE' as const,
    level: 1,
    locked: false,
    portrait: rangerPortrait,
    avatar: rangerAvatar,
    lore: 'Outcast in the wilds, seeking to restore nature balance to the land',
    cards: [
      { id: 'r_arrow_shot', type: 'BASIC', effects: [{ type: 'DEAL_DAMAGE', amount: 2, target: 'ENEMY' }], name: 'Arrow Shot', desc: 'Deal 2.', range: 2, ownerId: 'ranger', speed: 'NORMAL', lanes: 'REAR', image: arrowShotCardImage },
      { id: 'r_eye_above', type: 'SIGNATURE', effects: [{ type: 'SCRY', amount: 1, target: 'ENEMY' }], name: 'Quetzal Sight', desc: 'Reveal this lane.', range: 1, ownerId: 'ranger', speed: 'FAST', lanes: 'ALL', image: quetzalSightCardImage },
      { id: 'r_pietrifying_curse', type: 'ULTIMATE', effects: [{ type: 'DETAIN', amount: 2, target: 'ENEMY' }], name: 'Pietrifying Curse', desc: 'Detain 2', range: 2, ownerId: 'ranger', speed: 'NORMAL', lanes: 'ALL', image: pietrifyingCurseCardImage }
    ]
  },
  {
    id: 'prophet',
    name: 'Mad Prophet',
    role: 'SUPP',
    desc: 'Passive: Foresee the next nodes type on world map.',
    passiveName: 'The Prophecy',
    passiveIcon: theProphecyIcon,
    hp: 3,
    maxHp: 3,
    archetype: 'KINGDOM' as const,
    level: 1,
    locked: false,
    portrait: prophetPortrait,
    avatar: prophetAvatar,
    lore: "Once king's high priest, it bears a prophecy of restoration",
    cards: [
      { id: 'p_foresee', type: 'BASIC', effects: [{ type: 'DETAIN', amount: 1, target: 'ENEMY' }], name: 'Foresee', desc: 'Detain 1. Play on Revealed only.', range: 1, ownerId: 'prophet', speed: 'NORMAL', lanes: 'ALL', image: foreseeCardImage },
      { id: 'p_omen', type: 'SIGNATURE', effects: [{ type: 'APPLY_MOD', modType: 'VULNERABLE', modCategory: 'DEBUFF', amount: 2, target: 'ENEMY' }], name: 'Omen', desc: 'Apply Vulnerable 2', range: 1, ownerId: 'prophet', speed: 'FAST', lanes: 'ALL', image: omenCardImage },
      { id: 'p_epiphany', type: 'ULTIMATE', effects: [{ type: 'REVEAL', amount: 0, target: 'ALL_ENEMIES' }], name: 'Epiphany', desc: 'Reveal all lanes.', ownerId: 'prophet', speed: 'FAST', lanes: 'ALL', image: epiphanyCardImage }
    ]
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    role: 'WILD',
    desc: 'Passive: Before Draw Phase, Craft 1 random potion.',
    passiveName: 'Skilled Brewery',
    passiveIcon: skilledBreweryIcon,
    hp: 3,
    maxHp: 3,
    archetype: 'POWER' as const,
    level: 1,
    locked: false,
    portrait: alchemistPortrait,
    avatar: alchemistAvatar,
    lore: 'A prodigy that seeks legendary ingredients for dangerous formulas',
    cards: [
      { id: 'a_explosive_flask', type: 'BASIC', effects: [{ type: 'DEAL_DAMAGE', amount: 1, target: 'ENEMY' }], name: 'Explosive Flask', desc: 'AoE. Deal 1.', ownerId: 'alchemist', speed: 'NORMAL', range: 0, lanes: 'ALL', image: explosiveFlaskCardImage, isAoE: true },
      { id: 'a_unstable_mixture', type: 'SIGNATURE', effects: [{ type: 'UNSTABLE_MIXTURE', amount: 0, target: 'SELF' }], name: 'Unstable Mixture', desc: 'Craft 2 random potions and Merge them. The crafted card has Volatile.', ownerId: 'alchemist', speed: 'FAST', range: 0, lanes: 'ALL', image: unstableMixtureCardImage },
      { id: 'a_noxious_cloud', type: 'ULTIMATE', effects: [{ type: 'NOXIOUS', amount: 0, target: 'ENEMY' }], name: 'Noxious Cloud', desc: 'Persist 1. AoE. Apply Recoil 2.', ownerId: 'alchemist', speed: 'NORMAL', range: 0, persist: 1, recoil: 2, lanes: 'ALL', image: noxiousCloudCardImage }
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
    cards: []
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
  { name: 'Bullyfrog', hp: 6, deckType: 'special_frog_front' },
  { name: 'Tadpolearm', hp: 3, deckType: 'special_frog_mid' },
  { name: 'Frogman', hp: 5, deckType: 'special_frog_rear' },
  { name: 'ANCIENT DRAGON', hp: 15, deckType: 'boss', isBoss: true }
];
