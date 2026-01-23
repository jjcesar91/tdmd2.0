import { Card as CardData, CombatState } from '../types';
import { resolveLane } from './CombatResolver';
import { POTIONS_DB } from '../data';

interface EffectResult {
    newState: Partial<CombatState>;
    logs: string[];
}

// Helper to remove the played card from hand
const removePlayedCard = (state: CombatState, cardIdx: number): CardData[] => {
    return state.playerHand.filter((_, i) => i !== cardIdx);
};

// Helper: Apply a single card's effect logic (abstracted for reuse in Merge)
// Returns { logs, newStateUpdates } - does NOT handle hand removal/discard itself
// This is strictly for the *Lane Effect* or *Game State Change*
const applySingleCardEffect = (
    state: CombatState,
    card: CardData,
    targetLaneIdx: number
): { newStateUpdates: Partial<CombatState>, logs: string[] } => {
    const logs: string[] = [];
    let stateUpdates: Partial<CombatState> = {};

    // --- Potion Specific Logics (Ensuring they trigger immediately for FAST speed) ---
    
    // HEALING
    if (card.id === 'pot_heal') {
         const newPlayerUnits = [...(stateUpdates.playerUnits || state.playerUnits)];
         const hero = newPlayerUnits[targetLaneIdx];
         if (hero) {
             const val = card.value || 2;
             newPlayerUnits[targetLaneIdx] = { ...hero, hp: Math.min(hero.maxHp, hero.hp + val) };
             logs.push(`Healing Potion: healed ${hero.name} for ${val}!`);
             stateUpdates.playerUnits = newPlayerUnits;
         }
         return { newStateUpdates: stateUpdates, logs };
    }

    // INVISIBLE / IMMUNE
    if (card.id === 'pot_inv') {
         const newPlayerUnits = [...(stateUpdates.playerUnits || state.playerUnits)];
         const hero = newPlayerUnits[targetLaneIdx];
         if (hero) {
             const newBuffs = { ...hero.buffs, immune: true };
             newPlayerUnits[targetLaneIdx] = { ...hero, buffs: newBuffs };
             logs.push(`Invisible Potion: ${hero.name} is Immune!`);
             stateUpdates.playerUnits = newPlayerUnits;
         }
         return { newStateUpdates: stateUpdates, logs };
    }

    // AUGMENT / STRENGTH
    if (card.id === 'pot_aug') {
         const newPlayerUnits = [...(stateUpdates.playerUnits || state.playerUnits)];
         const hero = newPlayerUnits[targetLaneIdx];
         if (hero) {
             const val = card.value || 2;
             // Assuming 'strength' is the buff property for Augment
             const newBuffs = { ...hero.buffs, strength: (hero.buffs.strength || 0) + val };
             newPlayerUnits[targetLaneIdx] = { ...hero, buffs: newBuffs };
             logs.push(`Augmented Potion: ${hero.name} gained +${val} Strength!`);
             stateUpdates.playerUnits = newPlayerUnits;
         }
         return { newStateUpdates: stateUpdates, logs };
    }

    // HASTE POTION
    if (card.id === 'pot_haste') {
        const currentEffects = (state.laneEffects && state.laneEffects[targetLaneIdx]) || [];
        const newLaneEffects = { ...(state.laneEffects || {}) };
        if (!currentEffects.includes('HASTE')) {
            newLaneEffects[targetLaneIdx] = [...currentEffects, 'HASTE'];
            stateUpdates.laneEffects = newLaneEffects;
            logs.push(`Haste Potion: Next card in lane ${targetLaneIdx + 1} will be FAST!`);
        }
        return { newStateUpdates: stateUpdates, logs };
    }

    // --- Standard Effects ---

    // DIVINE, PICK, IMPROVE, HEAL (Generic), BLOOD_OATH...
    // (We will reuse existing logic blocks by refactoring processCardEffect to use this helper, 
    // OR just call processCardEffect recursively? No, processCardEffect handles discard.
    // We should probably keep existing logic in processCardEffect for now to avoid large refactor,
    // and only implement the MISSING potion logic here, OR fully move logic here.)
    
    // For Safety in Merge: If it's a card handled by `processCardEffect` main block (like CLEAVE via resolveLane),
    // we need to call resolveLane here.
    
    if (card.effect === 'CLEAVE' || card.actionType === 'ATTACK' || card.effect === 'DETAIN' || card.effect === 'VULNERABLE') {
        // Use resolveLane logic
        // We need to construct temporary zones
        const tempPlayerZones = [...(state.playerZoneCards)];
        tempPlayerZones[targetLaneIdx] = card;
        
        const resolution = resolveLane(
            targetLaneIdx,
            (stateUpdates.playerUnits || state.playerUnits),
            (stateUpdates.enemyUnits || state.enemyUnits),
            tempPlayerZones,
            (stateUpdates.enemyZoneCards || state.enemyZoneCards)
        );
        
        stateUpdates = {
            ...stateUpdates,
            playerUnits: resolution.playerUnits,
            enemyUnits: resolution.enemyUnits,
            enemyZoneCards: resolution.enemyZones || state.enemyZoneCards
        };
        logs.push(...resolution.logs);
        return { newStateUpdates: stateUpdates, logs };
    }

    return { newStateUpdates: stateUpdates, logs };
};


export const processCardEffect = (
    state: CombatState,
    card: CardData,
    cardIdx: number,
    targetLaneIdx: number
): EffectResult => {
    const logs: string[] = [];
    let newState: Partial<CombatState> = {
        selectedCardIdx: null, // Always deselect after play
    };

    // --- EFFECT LOGIC ---

    // UNSTABLE MIXTURE: Create Merged Potion
    if (card.effect === 'UNSTABLE_MIXTURE') {
        // 1. Pick 2 random unique potions (if possible)
        const opts = [...POTIONS_DB];
        const p1 = opts[Math.floor(Math.random() * opts.length)];
        const p2 = opts[Math.floor(Math.random() * opts.length)]; // Allow duplicates? "random potions". Yes.

        // 2. Merge logic
        // Range = min(p1.range, p2.range)
        const range = Math.min(p1.range || 0, p2.range || 0);
        
        // Create Merged Card
        const mergedCard: CardData = {
            id: `mix_${Math.random().toString(36).substr(2, 9)}`,
            uid: Math.random(),
            type: 'CRAFTED',
            actionType: 'SKILL', // Default to SKILL mostly
            name: `Mixture: ${p1.name} & ${p2.name}`,
            desc: `Merged: ${p1.desc} + ${p2.desc}`,
            value: 0, // Values are handled by constituent cards
            speed: 'FAST', // Potions are FAST
            range: range,
            effect: 'MERGED_POTION',
            ownerId: 'alchemist',
            volatile: true, // "The crafted card has VOLATILE"
            mergedCards: [p1, p2],
            isPotion: true,
            image: card.image, // Use the Unstable Mixture icon or generic? Maybe keep parent icon
            color: 'bg-purple-950', // Visual helper
            border: 'border-purple-500'
        };

        const newHand = removePlayedCard(state, cardIdx);
        newHand.push(mergedCard);
        
        logs.push(`Crafted ${mergedCard.name}!`);

        return {
            newState: {
                ...newState,
                playerHand: newHand,
                discardPile: [...state.discardPile, card], // Original Unstable Mixture goes to discard
                 // Add new card to 'newlyDrawn' so it animates
                 newlyDrawnCards: new Set([...state.newlyDrawnCards, mergedCard.uid!])
            },
            logs
        };
    }

    // MERGED POTION EXECUTION
    if (card.effect === 'MERGED_POTION' && card.mergedCards) {
        let currentState = { ...state };
        let allLogs: string[] = [`Used ${card.name}`];
        
        // Loop through constituent cards
        for (const subCard of card.mergedCards) {
             // We use our helper to apply effects without discarding/hands logic
             const res = applySingleCardEffect(currentState, subCard, targetLaneIdx);
             
             // Update current local state to propagate changes to next effect
             currentState = { ...currentState, ...res.newStateUpdates };
             allLogs.push(...res.logs);
        }

        // Finalize
        return {
            newState: {
                ...newState,
                ...currentState, // Apply accumulated state changes (units, enemies, etc)
                playerHand: removePlayedCard(state, cardIdx), // Remove the merged card itself
                // Merged card is volatile/consumed. Does it go to discard?
                // "The materials are removed... not discarded" - that was creation.
                // "The crafted card has VOLATILE".
                // Volatile usually means discard at EOT. But usually Potions are consumed (discarded) on use.
                // If I play it, it is consumed. Discard pile?
                // If it is Volatile, and Volatile = "Remove from game if unplayed", then Playing it means standard discard behavior usually.
                // Unless Volatile = "Exile on Play".
                // Defaulting to: Play -> Discard Pile.
                discardPile: [...state.discardPile, card]
            },
            logs: allLogs
        };
    }

    // Call helper for direct potion usage (Haste, Heal, Inv, Aug) 
    // This connects the specific logic we added in applySingleCardEffect to the main flow
    if (['pot_heal', 'pot_inv', 'pot_aug', 'pot_haste'].includes(card.id)) {
         const res = applySingleCardEffect(state, card, targetLaneIdx);
         return {
             newState: {
                 ...newState,
                 ...res.newStateUpdates,
                 playerHand: removePlayedCard(state, cardIdx),
                 discardPile: [...state.discardPile, card]
             },
             logs: [...logs, ...res.logs]
         };
    }

    // 1. DIVINE: Draw random KINGDOM card
    if (card.effect === 'DIVINE') {
        const kingdomCards = state.drawPile.filter(c => c.archetype === 'KINGDOM');
        let newHand = removePlayedCard(state, cardIdx);
        let newDrawPile = [...state.drawPile];
        const newDiscard = [...state.discardPile, card];

        if (kingdomCards.length > 0) {
            const randomIndex = Math.floor(Math.random() * kingdomCards.length);
            const divinedCard = kingdomCards[randomIndex];
            
            newHand.push(divinedCard);
            newDrawPile = newDrawPile.filter(c => c.uid !== divinedCard.uid);
            logs.push(`Divine: Drew ${divinedCard.name} from deck!`);
        } else if (newDrawPile.length > 0) {
            // Fallback: Normal draw
            const drawnCard = newDrawPile[0];
            newHand.push(drawnCard);
            newDrawPile = newDrawPile.slice(1);
            logs.push(`Divine failed: Drew ${drawnCard.name} instead`);
        } else {
             logs.push("Divine failed: No cards in deck!");
        }
        
        return {
            newState: { ...newState, playerHand: newHand, drawPile: newDrawPile, discardPile: newDiscard },
            logs
        };
    }

    // 2. PICK: Choose KINGDOM card (Simplified to auto-pick for now)
    if (card.effect === 'PICK') {
        const kingdomCards = state.drawPile.filter(c => c.archetype === 'KINGDOM');
        let newHand = removePlayedCard(state, cardIdx);
        let newDrawPile = [...state.drawPile];
        const newDiscard = [...state.discardPile, card];
        
        if (kingdomCards.length > 0) {
            const pickedCard = kingdomCards[0]; // TODO: UI for selection
            newHand.push(pickedCard);
            newDrawPile = newDrawPile.filter(c => c.uid !== pickedCard.uid);
            logs.push(`Pick: Added ${pickedCard.name} to hand!`);
        } else if (newDrawPile.length > 0) {
             const drawnCard = newDrawPile[0];
             newHand.push(drawnCard);
             newDrawPile = newDrawPile.slice(1);
             logs.push(`Pick failed: Drew ${drawnCard.name} instead`);
        } else {
             logs.push("Pick failed: No cards in deck!");
        }

        return {
            newState: { ...newState, playerHand: newHand, drawPile: newDrawPile, discardPile: newDiscard },
            logs
        };
    }

    // 3. IMPROVE: Boost card in lane
    if (card.effect === 'IMPROVE') {
        const newPlayerZones = [...state.playerZoneCards];
        const existingCard = newPlayerZones[targetLaneIdx];
        
        if (existingCard) {
            newPlayerZones[targetLaneIdx] = { 
                ...existingCard, 
                value: existingCard.value + card.value,
                desc: existingCard.desc + ` (+${card.value})`
            };
            logs.push(`Foretell: +${card.value} to lane ${targetLaneIdx}!`);
            
            return {
                newState: { 
                    ...newState, 
                    playerZoneCards: newPlayerZones,
                    playerHand: removePlayedCard(state, cardIdx),
                    discardPile: [...state.discardPile, card]
                 },
                logs
            };
        } else {
            logs.push("No card in lane to improve!");
            // Effect failed, do NOT discard, just deselect
            return { newState: { selectedCardIdx: null }, logs };
        }
    }

    // 4. HEAL: Restore HP to hero in lane
    if (card.effect === 'HEAL') {
        const newPlayerUnits = [...state.playerUnits];
        const hero = newPlayerUnits[targetLaneIdx];
        
        if (hero) {
            const oldHp = hero.hp;
            // Create new unit object to respect immutability
            newPlayerUnits[targetLaneIdx] = {
                ...hero,
                hp: Math.min(hero.maxHp, hero.hp + card.value)
            };
            const actualHeal = newPlayerUnits[targetLaneIdx]!.hp - oldHp;
            logs.push(`Mending: Healed ${hero.name} for ${actualHeal} HP!`);

            return {
                newState: { 
                    ...newState, 
                    playerUnits: newPlayerUnits,
                    playerHand: removePlayedCard(state, cardIdx),
                    discardPile: [...state.discardPile, card]
                 },
                logs
            };
        } else {
            logs.push("No hero in lane to heal!");
            return { newState: { selectedCardIdx: null }, logs };
        }
    }

    // 5. BLOOD OATH: Crusader self-damage for permanent buff
    if (card.effect === 'BLOOD_OATH') {
        const newPlayerUnits = [...state.playerUnits];
        // Find Crusader - assumption: he is in the party
        const crusaderIndex = newPlayerUnits.findIndex(u => u && u.id === 'crusader');
        
        if (crusaderIndex >= 0) {
            const crusader = newPlayerUnits[crusaderIndex]!;
            const newHp = Math.max(0, crusader.hp - 2); 
            
            newPlayerUnits[crusaderIndex] = {
                ...crusader,
                hp: newHp,
                dead: newHp === 0,
                buffs: {
                    ...crusader.buffs,
                    anger: (crusader.buffs.anger || 0) + 2
                }
            };
            
            logs.push(`Blood Oath: Crusader sacrificed 2 HP for 2 Anger!`);

            return {
                newState: { 
                    ...newState, 
                    playerUnits: newPlayerUnits,
                    playerHand: removePlayedCard(state, cardIdx),
                    discardPile: [...state.discardPile, card]
                },
                logs
            };
        } else {
             logs.push("Crusader is not in party!"); // Should not happen if card is in deck
             return { newState: { selectedCardIdx: null }, logs };
        }
    }

    // 6. DEFAULT: Place card in lane

    if (card.effect === 'SCRY_LANE') {
        const newEnemyZones = [...state.enemyZoneCards];
        if (newEnemyZones[targetLaneIdx]) {
            newEnemyZones[targetLaneIdx] = { ...newEnemyZones[targetLaneIdx]!, revealed: true };
            logs.push("Scried Enemy Intent!");
        }
        // Fallthrough to standard play/discard
        return {
             newState: {
                 ...newState,
                 enemyZoneCards: newEnemyZones,
                 playerHand: removePlayedCard(state, cardIdx),
                 discardPile: [...state.discardPile, card]
             },
             logs
        };
    }

    if (card.effect === 'SCRY_ALL') {
        const newEnemyZones = state.enemyZoneCards.map(c => c ? { ...c, revealed: true } : null);
        logs.push("Revealed all enemy lanes!");
        return {
             newState: {
                 ...newState,
                 enemyZoneCards: newEnemyZones,
                 playerHand: removePlayedCard(state, cardIdx),
                 discardPile: [...state.discardPile, card]
             },
             logs
        };
    }
    
    // Default / Fallback: Attempt to resolve using standard combat logic
    // This handles FAST cards or Hasted cards acting as standard cards
    const tempPlayerZones = [...state.playerZoneCards];
    tempPlayerZones[targetLaneIdx] = card;

    const resolution = resolveLane(
        targetLaneIdx,
        state.playerUnits,
        state.enemyUnits,
        tempPlayerZones,
        state.enemyZoneCards
    );

    return {
        newState: {
            ...newState,
            playerUnits: resolution.playerUnits,
            enemyUnits: resolution.enemyUnits,
            enemyZoneCards: resolution.enemyZones || state.enemyZoneCards,
            playerHand: removePlayedCard(state, cardIdx),
            discardPile: [...state.discardPile, card]
        },
        logs: [...logs, ...resolution.logs]
    };
};
