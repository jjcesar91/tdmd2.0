import { useState } from 'react';
import { Card as CardData, Unit, CombatState } from '../types';
import { POTIONS_DB } from '../data';
import { generateEncounter } from '../engine/EncounterGenerator';
import { generateProvokedAttack } from '../engine/EnemyAI';
import { getEnemyDecision, PlannedMove } from '../engine/EnemyLogic';
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

    const checkVictory = (pUnits: (Unit | null)[], eUnits: (Unit | null)[]) => {
        const allHeroesDead = pUnits.every(u => !u || u.dead);
        const allEnemiesDead = eUnits.every(u => !u || u.dead);
    
        if (allHeroesDead) { setView('GAMEOVER'); setLogs(['Expedition Failed.']); return true; }
        if (allEnemiesDead) {
            setLogs(['Victory!']); 
            
            // Clean global deck
            const deadHeroes = pUnits.filter((u): u is Unit => u !== null && u.dead);
            let newGlobalDeck = [...globalDeck];
            if (deadHeroes.length > 0) {
                deadHeroes.forEach(hero => {
                    newGlobalDeck = newGlobalDeck.filter(c => c.ownerId !== hero.id);
                });
            }
            setGlobalDeck(newGlobalDeck); 
            
            setParty(pUnits.filter((u): u is Unit => u !== null && !u.dead));
            if (mapNode >= 4) setView('VICTORY'); else { setMapNode(n => n + 1); setTimeout(() => setView('MAP'), 1500); }
            return true;
        }
        return false;
    };

    const startTurnLogic = (state: Partial<CombatState>) => {
        let newPUnits = (state.playerUnits || []).map((u: Unit | null) => {
            if (!u || u.dead) return u;
            let unit = { ...u, buffs: { ...u.buffs, tanking: false, immune: false } };
            
            // Cleanup Phase: Reset Gray HP
            unit.grayHp = 0;

            // Decrement Vulnerable
            if (unit.buffs.vulnerable) {
                 unit.buffs.vulnerable -= 1;
                 if (unit.buffs.vulnerable <= 0) delete unit.buffs.vulnerable;
            }

            // Fortitude Buff Logic:
            // "Gain 1 gray heart for 3 turns"
            // If we have fortitude buff > 0, we apply +1 Gray HP.
            // Requirement says "3 turns counting the turn it is activated".
            // Implementation: Activated Turn 1 (Instant +1).
            // Start Turn 2 (Fortitude=3 -> 2). Apply +1.
            // Start Turn 3 (Fortitude=2 -> 1). Apply +1.
            // Start Turn 4 (Fortitude=1 -> 0). Buff expires, no +1.
            if (unit.buffs.fortitude && unit.buffs.fortitude > 0) {
                 unit.buffs.fortitude -= 1;
                 if (unit.buffs.fortitude > 0) {
                    unit.grayHp = (unit.grayHp || 0) + 1;
                 } else {
                    delete unit.buffs.fortitude;
                 }
            }

            // Crusader passive: Gain Gray HP based on level (Applied AFTER cleanup)
            if (unit.id === 'crusader') {
              const grayHpGain = (unit.level && unit.level >= 4) ? 2 : 1;
              unit.grayHp = grayHpGain; // Was reset to 0 above
            }
            // Decrement cooldown each turn
            if (unit.activeCooldown && unit.activeCooldown > 0) {
                unit.activeCooldown = unit.activeCooldown - 1;
            }
            return unit;
        });

        let newEUnits = (state.enemyUnits || []).map((u: Unit | null) => {
            if (!u || u.dead) return u;
            let unit = { ...u, buffs: { ...u.buffs, tanking: false, immune: false } };
            
            // Cleanup Phase: Reset Gray HP
            unit.grayHp = 0;
            // Passive: Bullyfrog
            if (unit.id === 'frog_bully') unit.grayHp = 1;

            if (unit.buffs.vulnerable) {
                 unit.buffs.vulnerable -= 1;
                 if (unit.buffs.vulnerable <= 0) delete unit.buffs.vulnerable;
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
        // AI Logic & Intent Generation
        let enemyZones: (CardData | null)[] = state.enemyZoneCards ? [...state.enemyZoneCards] : [null, null, null];
        const currentCombatStateForAI: any = { ...state, playerUnits: newPUnits, enemyUnits: newEUnits };
        const eHand: CardData[] = [];
        
        // --- ORDERED DECISION MAKING (Global Rule: F -> M -> R) ---
        // We must iterate 0, 1, 2 explicitly to allow dependencies
        const plannedMoves: PlannedMove[] = [];
        
        // Create a temporary array of units effectively alive for processing
        // We map to keep indices aligned [0, 1, 2]
        const orderedIndices = [0, 1, 2];
        const initialZones = state.enemyZoneCards ? [...state.enemyZoneCards] : [null, null, null];
        
        // First pass: Update AI Steps
        newEUnits = newEUnits.map((u: Unit | null) => {
             if (!u || u.dead) return u;
             const nextStep = (u.aiCurrentStep !== undefined ? u.aiCurrentStep : -1) + 1;
             return { ...u, aiCurrentStep: nextStep };
        });
        
        // Second pass: Decisions
        orderedIndices.forEach(idx => {
             const u = newEUnits[idx];
             if (!u || u.dead) return;
             
             // Check if already has card (detained/persisted)
             if (initialZones[idx]) {
                 // Counts as 'played in lane idx' for logic purposes?
                 // "If Bullyfrog is playing a card on its lane".
                 // Probably yes.
                 plannedMoves.push({ lane: idx, card: initialZones[idx]!, unitId: u.id });
             } else {
                 const decision = getEnemyDecision(u, currentCombatStateForAI, plannedMoves);
                 plannedMoves.push({ lane: decision.lane, card: decision.card, unitId: u.id });
                 
                 // Apply to Zone
                 if (!enemyZones[decision.lane]) {
                     enemyZones[decision.lane] = { ...decision.card, revealed: false };
                     eHand.push(decision.card); // Add to "Hand" for record tracking, though physically it goes to zone
                 }
             }
        });
  
        setCombatState(prev => ({
            ...prev!, ...state, phase: 'planning', playerUnits: newPUnits, enemyUnits: newEUnits, playerHand: newHand, drawPile: newDraw, discardPile: newDiscard, enemyHand: eHand, playerZoneCards: state.playerZoneCards || [null, null, null], enemyZoneCards: enemyZones, scryActive: false, newlyDrawnCards: newlyDrawnSet, resolvingLane: null, laneEffects: {}
        }));
    };

    const enterCombat = (reqEnemyType: string) => {
        let enemyType = reqEnemyType;
        if (mapNode === 0 && enemyType === 'normal') {
             enemyType = 'frogs_tribe_1';
        }
        const enemies = generateEncounter(enemyType);
        
        // Place heroes in their assigned lanes
        const combatParty: (Unit | null)[] = [null, null, null];
        party.forEach(hero => {
          const laneIdx = partyLanes[hero.id] !== undefined ? partyLanes[hero.id] : party.indexOf(hero);
          // Initialize cooldown based on hero
          let cooldownMax = 0;
          if (hero.id === 'ranger') cooldownMax = 2;
          else if (hero.id === 'crusader') cooldownMax = 0;
          
          combatParty[laneIdx] = { 
            ...hero, 
            grayHp: 0, 
            buffs: { immune: false, tanking: false, augment: 0 },
            activeCooldown: 0,
            activeCooldownMax: cooldownMax
          };
        });
        
        // Add level-specific cards to deck
        let combatDeck = [...globalDeck].sort(() => Math.random() - 0.5);
        
        combatDeck = combatDeck.sort(() => Math.random() - 0.5);
        
        // Strategic encounter descriptions
        let encounterHint = "Battle Started!";
        if (enemyType !== 'boss') {
          const enemyNames = enemies.filter(e => e !== null).map(e => e!.name).join(', ');
          encounterHint = `Encounter: ${enemyNames}`;
        }
    
        setCombatState({
          turn: 1, phase: 'planning', playerUnits: combatParty, enemyUnits: enemies, playerHand: [], drawPile: combatDeck, discardPile: [], enemyHand: [], playerZoneCards: [null, null, null], enemyZoneCards: [null, null, null], selectedCardIdx: null, scryActive: false, newlyDrawnCards: new Set(), resolvingLane: null, laneEffects: {}
        });
        
        startTurnLogic({ turn: 1, playerUnits: combatParty, enemyUnits: enemies, drawPile: combatDeck, discardPile: [], enemyHand: [] });
        setLogs([encounterHint]); setView('COMBAT');
    };

    const handleZoneClick = (idx: number) => {
        if (!combatState || combatState.phase !== 'planning') return;
        const { playerZoneCards, playerHand, selectedCardIdx, playerUnits, enemyZoneCards } = combatState;
        if (playerZoneCards[idx]) { 
          const card = playerZoneCards[idx]!;
          if (card.resolved) {
             addLog("Cannot return resolved card.");
             return;
          }
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

              // Foresee Restriction
              if (card.id === 'p_foresee') {
                  if (!enemyZoneCards[idx] || !enemyZoneCards[idx]!.revealed) {
                      addLog("Target lane must be revealed!");
                      return;
                  }
              }

              // Lane restriction check (Hero Position)
              if (card.lanes && card.lanes !== 'ALL') {
                  const allowedIndices: number[] = [];
                  if (Array.isArray(card.lanes)) {
                      card.lanes.forEach(l => {
                          if (l === 'FRONT') allowedIndices.push(0);
                          else if (l === 'MID') allowedIndices.push(1);
                          else if (l === 'REAR') allowedIndices.push(2);
                      });
                  } else {
                      const l = card.lanes;
                      if (l === 'FRONT') allowedIndices.push(0);
                      else if (l === 'MID') allowedIndices.push(1);
                      else if (l === 'REAR') allowedIndices.push(2);
                  }
                  
                  if (!allowedIndices.includes(ownerIndex)) {
                      const laneStr = Array.isArray(card.lanes) ? card.lanes.join(' or ') : card.lanes;
                      addLog(`Hero must be in ${laneStr} lane to use this`);
                      return;
                  }
              }
          } else { if (!playerUnits[idx]) return; }
    
          // Check for HASTE effect
          const laneHasteEffects = combatState.laneEffects?.[idx] || [];
          const hasHaste = laneHasteEffects.includes('HASTE');
          const effectiveSpeed = hasHaste ? 'FAST' : card.speed;

          // Handle FAST cards - activate immediately and discard
          if (effectiveSpeed === 'FAST') {
              // Consume HASTE if used
              let stateForEffect = combatState;
              let consumedEffectsUpdate = {};
              if (hasHaste) {
                 const newLaneEffects = { ...(combatState.laneEffects || {}) };
                 newLaneEffects[idx] = (newLaneEffects[idx] || []).filter(e => e !== 'HASTE');
                 consumedEffectsUpdate = { laneEffects: newLaneEffects };
                 stateForEffect = { ...combatState, laneEffects: newLaneEffects };
              }

              const result = processCardEffect(stateForEffect, card, selectedCardIdx, idx);
              
              if (result.logs && result.logs.length > 0) {
                  result.logs.forEach(log => addLog(log));
              }
              
              setCombatState(prev => ({ ...prev!, ...consumedEffectsUpdate, ...result.newState }));

              // Check victory immediately for FAST cards
              const finalPUnits = result.newState.playerUnits || combatState.playerUnits;
              const finalEUnits = result.newState.enemyUnits || combatState.enemyUnits;
              checkVictory(finalPUnits as (Unit|null)[], finalEUnits as (Unit|null)[]);
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
        
        // Handle VOLATILE cards (discard from hand)
        let endTurnHand = [...combatState.playerHand];
        let endTurnDiscard = [...combatState.discardPile];
        const volatileIndices: number[] = [];

        endTurnHand.forEach((card, idx) => {
             if (card.volatile) {
                 volatileIndices.push(idx);
                 endTurnDiscard.push(card);
             }
        });

        if (volatileIndices.length > 0) {
            // Remove volatile cards from hand (reverse order to keep indices valid during splice, or filter)
            endTurnHand = endTurnHand.filter((_, idx) => !volatileIndices.includes(idx));
            addLog(`Volatile: ${volatileIndices.length} cards evaporated!`);
        }

        const stateAfterVolatile = { ...combatState, playerHand: endTurnHand, discardPile: endTurnDiscard };

        setCombatState(prev => ({ ...prev!, ...stateAfterVolatile, phase: 'resolving', selectedCardIdx: null }));
        // REMOVED: Immediate reveal of all enemy cards. Now handled dynamically in UI during resolution.
        await new Promise(r => setTimeout(r, 800));
    
        let pUnits = [...combatState.playerUnits]; 
        let eUnits = [...combatState.enemyUnits];
        let pZones = combatState.playerZoneCards; 
    let eZones = [...combatState.enemyZoneCards];

    // Apply start-of-turn buffs (potions, tanking)
    pUnits = applyRoundBuffs(pUnits, pZones);
    eUnits = applyRoundBuffs(eUnits, eZones);
    
    for (let i = 0; i < 3; i++) {
            // Highlight current resolving lane
            setCombatState(prev => ({ ...prev!, resolvingLane: i }));
            await new Promise(r => setTimeout(r, 400));
            
            // Resolve logic for this lane using pure function
            const result = resolveLane(i, pUnits, eUnits, pZones, eZones);
            
            // Update local state for next iteration
            pUnits = result.playerUnits;
            eUnits = result.enemyUnits;
            if (result.enemyZones) eZones = result.enemyZones;
            if (result.playerZones) pZones = result.playerZones;
            
            // Remove cards of dead units
            pZones = pZones.map((c) => {
                if (!c) return null;
                const owner = pUnits.find(u => u && u.id === c.ownerId);
                // Be careful not to remove a card that just resolved (even if owner died?)
                // User said "die before resolving".
                // If we are at loop i. Card at i just resolved.
                // If owner died at i. technically it resolved.
                // But loop moves to i+1.
                // Generally, resolved cards are kept for the turn (detained/persist logic later)
                // But if unit dies, maybe we want it gone visually?
                // "remove its cards from lane"
                // If I null it here, it disappears from UI immediately.
                if (owner && owner.dead) return null;
                return c;
            });
            
            // For enemies, we assume card at lane X belongs to unit at lane X
            eZones = eZones.map((c, idx) => {
                 if (!c) return null;
                 if (eUnits[idx] && eUnits[idx]!.dead) return null;
                 return c;
            });

            // Add logs
            if (result.logs.length > 0) {
                result.logs.forEach(msg => addLog(msg));
            }
    
            // Update React state to show damage immediately
            setCombatState(prev => ({ ...prev!, playerUnits: [...pUnits], enemyUnits: [...eUnits], enemyZoneCards: [...eZones], playerZoneCards: [...pZones] }));
            
            // Check victory after lane resolution
            if (checkVictory(pUnits, eUnits)) return;
            
            await new Promise(r => setTimeout(r, 600));
        }
        
        // Clear resolving lane highlight
        setCombatState(prev => ({ ...prev!, resolvingLane: null }));
    
        if (checkVictory(pUnits, eUnits)) return;

        const deadHeroes = pUnits.filter((u): u is Unit => u !== null && u.dead);
        let newGlobalDeck = [...globalDeck];
        
        // Filter detained enemy cards
        let keptEnemyZones: (CardData | null)[] = [null, null, null];
        let enemyCardsToDiscard: CardData[] = [];
        
        eZones.forEach((c, i) => {
            if (c) {
                if (c.detained && c.detained > 0) {
                   // Keep card, decrement counter
                   // If detained counter reaches 0, it should be discarded in THIS cleanup phase
                   const newDetained = c.detained - 1;
                   if (newDetained > 0) {
                      keptEnemyZones[i] = { ...c, detained: newDetained };
                   } else {
                      enemyCardsToDiscard.push(c);
                   }
                } else {
                   enemyCardsToDiscard.push(c);
                }
            }
        });

        // Filter PERSIST player cards
        let keptPlayerZones: (CardData | null)[] = [null, null, null];
        let playerCardsToDiscard: CardData[] = [];

        pZones.forEach((c, i) => {
            if (c) {
                if (c.persist && c.persist > 0) {
                     keptPlayerZones[i] = { ...c, persist: c.persist - 1, resolved: true };
                } else if (c.detained && c.detained > 0) {
                     const newDetained = c.detained - 1;
                     if (newDetained > 0) {
                         keptPlayerZones[i] = { ...c, detained: newDetained, resolved: true };
                     } else {
                         const { resolved, detained, ...cleanCard } = c;
                         playerCardsToDiscard.push(cleanCard);
                     }
                } else {
                     const { resolved, detained, ...cleanCard } = c;
                     playerCardsToDiscard.push(cleanCard);
                }
            }
        });

        let newDiscard = [...combatState.discardPile, ...playerCardsToDiscard, ...combatState.playerHand];
        let newDrawPile = [...combatState.drawPile];
        pUnits = pUnits.map(u => u ? {...u, grayHp: 0} : null);
    
        if (deadHeroes.length > 0) {
            deadHeroes.forEach(hero => {
                newGlobalDeck = newGlobalDeck.filter(c => c.ownerId !== hero.id);
                newDrawPile = newDrawPile.filter(c => c.ownerId !== hero.id);
                newDiscard = newDiscard.filter(c => c.ownerId !== hero.id);
            });
        }
    
        setCombatState({ ...combatState, drawPile: newDrawPile, discardPile: newDiscard, playerUnits: pUnits, enemyUnits: eUnits, playerHand: [], turn: combatState.turn + 1 });
        startTurnLogic({ turn: combatState.turn + 1, playerUnits: pUnits, enemyUnits: eUnits, drawPile: newDrawPile, discardPile: newDiscard, enemyHand: [], enemyZoneCards: keptEnemyZones, playerZoneCards: keptPlayerZones });
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
        // Old card is removed (provoked)
        newEnemyZones[laneIdx] = attackCard;
        
        // Discard the old card
        // FIX: Do not add enemy cards to player discard pile
        const newEnemyDiscard = combatState.discardPile;
        
        setCombatState(prev => ({
          ...prev!,
          playerUnits: newPlayerUnits,
          enemyZoneCards: newEnemyZones,
          discardPile: newEnemyDiscard
        }));
        
        setProvokeMode(false);
        const atkVal = attackCard.effects.find(e => e.type === 'DEAL_DAMAGE')?.amount || 0;
        addLog(`Crusader provokes ${enemyUnit.name} into attacking with ${atkVal} damage!`);
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
    
    return {
        provokeMode,
        setProvokeMode,
        enterCombat,
        handleZoneClick,
        handleEndTurn,
        handleProvokeClick,
        onCrusaderAction
    };
}
