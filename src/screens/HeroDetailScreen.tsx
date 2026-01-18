import { Heart, Sword, Shield, Eye, Crown, Skull, Swords, Target, Layers, RefreshCw, FlaskConical, X, Lock } from 'lucide-react';
import startScreenImage from '../assets/images/splashes/TDMD-START.png';
import { Hero } from '../types';
import { Card } from '../components/Card';

interface HeroDetailScreenProps {
  hero: Hero;
  onClose: () => void;
}

export const HeroDetailScreen = ({ hero, onClose }: HeroDetailScreenProps) => {
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
          desc: 'All allies become Immune this turn. Exhaust.',
          effect: 'NON_RESISTANT', // Placeholder
          ownerId: 'crusader',
          archetype: 'VENGEANCE' as const
        },
        unlockLevel: 5
      });
    }
    else if (heroId === 'prophet') {
      // Level 2: Foretell
      cardsWithLevel.push({
        card: {
          id: 'p_fore',
          type: 'SKILL',
          value: 0,
          name: 'Foretell',
          desc: 'Scry 1. Draw 1.',
          effect: 'SCRY_DRAW',
          ownerId: 'prophet',
          archetype: 'KINGDOM' as const
        },
        unlockLevel: 2
      });
      
      // Level 3: Mending
       cardsWithLevel.push({
        card: {
          id: 'p_mend',
          type: 'SKILL',
          value: 2,
          name: 'Mending',
          desc: 'Heal 2.',
          effect: 'HEAL',
          ownerId: 'prophet',
          archetype: 'KINGDOM' as const
        },
        unlockLevel: 3
      });
    }
    else if (heroId === 'ranger') {
       // Level 4: Mark of Hunter
       cardsWithLevel.push({
        card: {
          id: 'r_mark',
          type: 'SKILL',
          value: 0,
          name: 'Mark',
          desc: 'Enemy takes double damage next hit.',
          effect: 'MARK',
          ownerId: 'ranger',
          archetype: 'BALANCE' as const
        },
        unlockLevel: 4
      });
    }

    return cardsWithLevel;
  };

  const currentLevel = hero.level || 1;
  const progression = getLevelProgression(hero.id);
  const activeAbility = getActiveAbility(hero.id);
  const uniqueCards = getAllUniqueCards(hero.id);
  
  const activeUnlockLevel = hero.id === 'crusader' ? 2 : (hero.id === 'ranger' ? 1 : (hero.id === 'prophet' ? 1 : 1));
  const passiveUnlockLevel = 1;
  const passiveUpgradeLevel = hero.id === 'crusader' ? 4 : (hero.id === 'prophet' ? 4 : (hero.id === 'ranger' ? 2 : undefined));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-sm animate-fade-in font-serif"
      style={{ animationDuration: '0.3s' }}
    >
      <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full flex flex-col relative overflow-hidden shadow-2xl border-x-4 border-stone-900 bg-stone-950">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={startScreenImage} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/40 to-stone-950/90"></div>
        </div>

        {/* Top Decorative Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent z-20" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-stone-900/90 border-2 border-indigo-500/40 hover:border-indigo-400 flex items-center justify-center transition-all hover:scale-110 group"
        >
          <X size={20} className="text-indigo-400 group-hover:text-indigo-300" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-6 pt-12">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-900/50 to-transparent blur-sm" />
                  <h2 className="relative text-3xl font-black font-serif text-indigo-400 tracking-wider px-8 py-2">
                    {hero.name}
                  </h2>
                  {/* Decorative lines */}
                  <div className="absolute left-0 top-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent to-indigo-600" />
                  <div className="absolute right-0 top-1/2 w-6 h-0.5 bg-gradient-to-l from-transparent to-indigo-600" />
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
