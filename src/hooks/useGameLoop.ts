import { useState } from 'react';
import { Card as CardData, Unit, CombatState } from '../types';
import { POTIONS_DB, ENEMIES_DB } from '../data';
import { generateEncounter } from '../engine/EncounterGenerator';
import { generateEnemyCard, generateProvokedAttack } from '../engine/EnemyAI';
import { applyRoundBuffs, resolveLane } from '../engine/CombatResolver';
import { processCardEffect } from '../engine/CardEffectSystem';

interface UseGameLoopProps {
    combatState: CombatState | null;
    setCombatState: React.Dispatch<React.SetStateAction<CombatState | null>>;
    party: Unit[];
    partyLanes: { [heroId: string]: number };
    globalDeck: CardData[];
    setGlobalDeck: (deck: CardData[]) => void;
    mapNode: number;
    setMapNode: (node: number | ((prev: number) => number)) => void;
    addLog: (msg: string) => void;
    setLogs: (logs: string[]) => void;
    setView: (view: string) => void;
    setParty: (party: Unit[]) => void;
}

export function useGameLoop({
    combatState, setCombatState, party, partyLanes, globalDeck, setGlobalDeck, 
    mapNode, setMapNode, addLog, setLogs, setView, setParty
}: UseGameLoopProps) {
    const [provokeMode, setProvokeMode] = useState<boolean>(false);

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
          
          const card = generateEnemyCard(deckType);
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

    const enterCombat = (enemyType: string) => {
        const enemies = generateEncounter(enemyType);
        
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
                { id: 'c_eye', type: 'SIGNATURE', actionType: 'ATTACK', value: 0, name: 'Eye for an Eye', desc: 'Deal X equal to your missing hearts.', effect: 'EYE_FOR_EYE', ownerId: 'crusader', archetype: 'VENGEANCE' as const, uid: Math.random() },
                { id: 'c_eye', type: 'SIGNATURE', actionType: 'ATTACK', value: 0, name: 'Eye for an Eye', desc: 'Deal X equal to your missing hearts.', effect: 'EYE_FOR_EYE', ownerId: 'crusader', archetype: 'VENGEANCE' as const, uid: Math.random() }
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
              const result = processCardEffect(combatState, card, selectedCardIdx, idx);
              
              if (result.logs && result.logs.length > 0) {
                  result.logs.forEach(log => addLog(log));
              }
              
              setCombatState(prev => ({ ...prev!, ...result.newState }));
              return;
          }
          
          // Normal cards are placed in zone
          let newEnemyZones = [...enemyZoneCards];
          // SCRY_LANE handled by CardEffectSystem or distinct effect
          setCombatState(prev => ({...prev!, playerHand: prev!.playerHand.filter((_, i) => i !== selectedCardIdx), playerZoneCards: prev!.playerZoneCards.map((c, i) => i === idx ? card : c), enemyZoneCards: newEnemyZones, selectedCardIdx: null }));
        }
      };

      const handleEndTurn = async () => {
        // Since we need to use 'combatState' inside async execution, we must be careful with closures. 
        // ideally we would use a ref, but here we assume 'combatState' is fresh enough or we rely on functional updates.
        // However, this logic is heavy.
        
        if (!combatState || combatState.phase !== 'planning') return;
        setProvokeMode(false); // Cancel provoke mode when ending turn
        setCombatState(prev => ({ ...prev!, phase: 'resolving', selectedCardIdx: null }));
        setCombatState(prev => ({ ...prev!, enemyZoneCards: prev!.enemyZoneCards.map(c => c ? { ...c, revealed: true } : null) }));
        await new Promise(r => setTimeout(r, 800));
    
        let pUnits = [...combatState.playerUnits]; 
        let eUnits = [...combatState.enemyUnits];
        let pZones = combatState.playerZoneCards; 
        let eZones = combatState.enemyZoneCards.map(c => c ? { ...c, revealed: true } : null);
    
        // Apply start-of-turn buffs (potions, tanking)
        pUnits = applyRoundBuffs(pUnits, pZones);
    
        for (let i = 0; i < 3; i++) {
            // Highlight current resolving lane
            setCombatState(prev => ({ ...prev!, resolvingLane: i }));
            await new Promise(r => setTimeout(r, 400));
            
            // Resolve logic for this lane using pure function
            const result = resolveLane(i, pUnits, eUnits, pZones, eZones);
            
            // Update local state for next iteration
            pUnits = result.playerUnits;
            eUnits = result.enemyUnits;
            
            // Add logs
            if (result.logs.length > 0) {
                result.logs.forEach(msg => addLog(msg));
            }
    
            // Update React state to show damage immediately
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
    
        setCombatState({ ...combatState, drawPile: newDrawPile, discardPile: newDiscard, playerUnits: pUnits, enemyUnits: eUnits, playerHand: [], turn: combatState.turn + 1 });
        startTurnLogic({ turn: combatState.turn + 1, playerUnits: pUnits, enemyUnits: eUnits, drawPile: newDrawPile, discardPile: newDiscard, enemyHand: [] });
        setGlobalDeck(newGlobalDeck);
    };

    const handleProvokeClick = (laneIdx: number) => {
        if (!combatState || !provokeMode) return;
        
        const enemyCard = combatState.enemyZoneCards[laneIdx];
        const enemyUnit = combatState.enemyUnits[laneIdx];
        
        if (!enemyCard || !enemyUnit || enemyUnit.dead) {
          addLog("No valid target!");
          return;
        }
        
        const enemyDeckType = (enemyUnit as any).deckType || 'medium';
        const attackCard = generateProvokedAttack(enemyDeckType);
        
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
        addLog(`Crusader provokes ${enemyUnit.name} into attacking with ${attackCard.value} damage!`);
    };

    const onProphetAction = () => {
         if (!combatState || combatState.scryActive) return;
         
         const prophetUnit = combatState.playerUnits.find(u => u && u.id === 'prophet');
         if (!prophetUnit || prophetUnit.activeCooldown! > 0) return;
         
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
         
         const crusaderUnit = combatState.playerUnits.find(u => u && u.id === 'crusader');
         if (!crusaderUnit || crusaderUnit.activeCooldown! > 0) return;
         
         if (!crusaderUnit.level || crusaderUnit.level < 2) {
           addLog("Provoke locked! Requires Level 2.");
           return;
         }
         
         setProvokeMode(true);
         addLog("Crusader Provoke: Select an enemy card to force an attack!");
    };
    
    const onRangerAction = () => {
         if (!combatState || combatState.phase !== 'planning') return;
         
         const rangerUnit = combatState.playerUnits.find(u => u && u.id === 'ranger');
         if (!rangerUnit || rangerUnit.activeCooldown! > 0) return;
         
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

    return {
        provokeMode,
        setProvokeMode,
        enterCombat,
        handleZoneClick,
        handleEndTurn,
        handleProvokeClick,
        onProphetAction,
        onCrusaderAction,
        onRangerAction
    };
}
