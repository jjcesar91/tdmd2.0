import React, { useState, useRef, useEffect } from 'react';
import clickSfx from './assets/sounds/sfx/click1.mp3';
import themeMusic from './assets/sounds/theme/main.mp3';
import { Card as CardData, Unit, CombatState, Hero } from './types';
import { POTIONS_DB, HEROES_DB, ENEMIES_DB } from './data';
import { HeroDetailView } from './components/HeroDetailView';
// Screens
import { IntroScreen } from './screens/IntroScreen';
import { StartScreen } from './screens/StartScreen';
import { HeroSelectionScreen } from './screens/HeroSelectionScreen';
import { LaneAssignmentScreen } from './screens/LaneAssignmentScreen';
import { MapScreen } from './screens/MapScreen';
import { CombatScreen } from './screens/CombatScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { GameOverScreen } from './screens/GameOverScreen';

// --- TYPE DEFINITIONS ---






// --- CONFIGURAZIONE ---





// --- MAIN APP ---

export default function TheDragonMustDie() {
  const [view, setView] = useState<string>('START');
  const [party, setParty] = useState<Unit[]>([]);
  const [partyLanes, setPartyLanes] = useState<{[heroId: string]: number}>({});
  const [globalDeck, setGlobalDeck] = useState<CardData[]>([]);
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
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);
  const [provokeMode, setProvokeMode] = useState<boolean>(false);
  const [heroDetailView, setHeroDetailView] = useState<Hero | null>(null);
  
  // Intro Sequence State
  const [introPhase, setIntroPhase] = useState<'STUDIO' | 'SPLASH' | 'NONE'>('STUDIO');
  const [showTapLabel, setShowTapLabel] = useState<boolean>(false);

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const themeAudioRef = useRef<HTMLAudioElement | null>(null);

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

       const musicTimer = setTimeout(() => {
         if (!themeAudioRef.current) {
           themeAudioRef.current = new Audio(themeMusic);
           themeAudioRef.current.loop = true;
         }
         themeAudioRef.current.play().catch(() => {
            console.log("Audio autoplay prevented. Waiting for interaction to start music.");
            const playOnInteract = () => {
                if (themeAudioRef.current) {
                  themeAudioRef.current.play().catch(e => console.error("Interacted play failed", e));
                }
                document.removeEventListener('click', playOnInteract);
                document.removeEventListener('keydown', playOnInteract);
                document.removeEventListener('touchstart', playOnInteract);
            };
            document.addEventListener('click', playOnInteract);
            document.addEventListener('keydown', playOnInteract);
            document.addEventListener('touchstart', playOnInteract);
         });
       }, 500);

       return () => { 
         clearTimeout(labelTimer);
         clearTimeout(musicTimer);
       };
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
    let deck: CardData[] = [];
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
      let levelCards: CardData[] = [];
      
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
      let newDraw = [...(state.drawPile || [])]; let newDiscard = [...(state.discardPile || [])]; let newHand: CardData[] = [];
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
      const eHand: CardData[] = [];
      const aliveEnemies = (state.enemyUnits || []).filter((e: Unit | null) => e && !e.dead);
      const count = aliveEnemies.length + 1;
      
      // Generate cards matching enemy deck types for flavor and strategy
      for(let i=0; i<count; i++) {
        const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        const enemyData = randomEnemy ? ENEMIES_DB.find(e => e.name === randomEnemy.name) : null;
        const deckType = enemyData?.deckType || 'weak';
        
        let card: CardData;
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
      
      let enemyZones: (CardData | null)[] = [null, null, null];
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
    
    const attackCard: CardData = {
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

    const applyEffects = (card: CardData | null, sourceUnit: Unit | null) => {
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
    let newDiscard = [...combatState.discardPile, ...pZones.filter((c): c is CardData => c !== null), ...combatState.playerHand];
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

  if (introPhase !== 'NONE') {
    return (
      <IntroScreen 
        phase={introPhase as 'STUDIO' | 'SPLASH'} 
        onSplashClick={() => { playClick(); setIntroPhase('NONE'); }}
        showTapLabel={showTapLabel}
      />
    );
  }

  // Hero Detail View Modal (renders on top of any view)
  if (heroDetailView) {
    return <HeroDetailView hero={heroDetailView} onClose={() => setHeroDetailView(null)} />;
  }
  
  if (view === 'START') {
    return <StartScreen onStart={() => { playClick(); startDraft(); }} />;
  }

  if (view === 'HERO_SELECTION') {
    return (
      <HeroSelectionScreen 
        selectedHeroes={selectedHeroes}
        onHeroSelect={handleHeroSelect}
        onNext={confirmHeroSelection}
        onBack={() => setView('START')}
        heroLevels={heroLevels}
        onLevelChange={handleLevelChange}
        setHeroDetailView={setHeroDetailView}
      />
    );
  }

  if (view === 'LANE_ASSIGNMENT') {
    return (
      <LaneAssignmentScreen
        selectedHeroes={selectedHeroes}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        draggedHeroIndex={draggedHeroIndex}
        onBack={() => setView('HERO_SELECTION')}
        onStartAdventure={finalizeDraft}
        heroLevels={heroLevels}
        onLevelChange={handleLevelChange}
      />
    );
  }

  if (view === 'MAP') {
     return (
       <MapScreen 
         mapNode={mapNode}
         enterCombat={(type) => enterCombat(type)}
       />
     );
  }

  if (view === 'COMBAT' && combatState) {
    return (
      <CombatScreen
        combatState={combatState}
        showDeckModal={showDeckModal}
        setShowDeckModal={setShowDeckModal}
        showDiscardModal={showDiscardModal}
        setShowDiscardModal={setShowDiscardModal}
        showLogs={showLogs}
        setShowLogs={setShowLogs}
        logs={logs}
        provokeMode={provokeMode}
        setProvokeMode={setProvokeMode}
        hoveredLane={hoveredLane}
        setHoveredLane={setHoveredLane}
        handleEndTurn={handleEndTurn}
        handleZoneClick={handleZoneClick}
        handleProvokeClick={handleProvokeClick}
        previewCard={previewCard}
        setPreviewCard={setPreviewCard}
        onProphetAction={onProphetAction}
        onCrusaderAction={onCrusaderAction}
        onRangerAction={onRangerAction}
        setCombatState={setCombatState}
      />
    );
  }

  if (view === 'VICTORY') {
    return <VictoryScreen onRestart={() => setView('START')} />;
  }

  if (view === 'GAMEOVER' || view === 'GAME_OVER') {
    return <GameOverScreen onRestart={() => setView('START')} />;
  }

  return (
    <div className="w-full h-screen bg-black text-white flex items-center justify-center">
       <button onClick={() => setView('START')} className="px-6 py-2 border rounded">Reset Game</button>
    </div>
  );
}