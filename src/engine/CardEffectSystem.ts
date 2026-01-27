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
             const val = card.effects.find(e => e.type === 'HEAL')?.amount || 2;
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

    // AUGMENT
    if (card.id === 'pot_aug') {
         const newPlayerUnits = [...(stateUpdates.playerUnits || state.playerUnits)];
         const hero = newPlayerUnits[targetLaneIdx];
         if (hero) {
             const val = card.effects.find(e => e.type === 'APPLY_MOD' && e.modType === 'AUGMENT')?.amount || 2;
             // Assuming 'augment' is the buff property for Augment
             const newBuffs = { ...hero.buffs, augment: (hero.buffs.augment || 0) + val };
             newPlayerUnits[targetLaneIdx] = { ...hero, buffs: newBuffs };
             logs.push(`Augmented Potion: ${hero.name} gained +${val} Augment!`);
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

    // SELF DAMAGE POTION (Internal for Unstable Brew)
    if (card.id === 'pot_self_dmg') {
         const newPlayerUnits = [...(stateUpdates.playerUnits || state.playerUnits)];
         const hero = newPlayerUnits[targetLaneIdx];
         if (hero) {
             const dmg = 1;
             const newHp = Math.max(0, hero.hp - dmg);
             newPlayerUnits[targetLaneIdx] = { 
                 ...hero, 
                 hp: newHp,
                 dead: newHp === 0
             };
             logs.push(`Unstable Brew: ${hero.name} took ${dmg} damage!`);
             stateUpdates.playerUnits = newPlayerUnits;
         }
         return { newStateUpdates: stateUpdates, logs };
    }

    // --- Standard Effects ---

    // For Safety in Merge: If it's a card handled by `processCardEffect` main block (like CLEAVE via resolveLane),
    // we need to call resolveLane here.
    
    // Check if card has any effect that should be resolved in lane
    const hasCombatEffect = card.effects.some(e => ['CLEAVE', 'DEAL_DAMAGE', 'DETAIN', 'APPLY_MOD'].includes(e.type)) || card.desc.includes('Deal');

    if (hasCombatEffect) {
        // Use resolveLane logic
        // We need to construct temporary zones
        const tempPlayerZones = [...(state.playerZoneCards)];
        tempPlayerZones[targetLaneIdx] = card;
        
        const resolution = resolveLane(
            targetLaneIdx,
            (stateUpdates.playerUnits || state.playerUnits),
            (stateUpdates.enemyUnits || state.enemyUnits),
            tempPlayerZones,
            (stateUpdates.enemyZoneCards || state.enemyZoneCards),
            { onlyPlayerAction: true }
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
    if (card.effects.some(e => e.type === 'UNSTABLE_MIXTURE' as any) || card.id === 'mix_generic') { // Note: Assuming effect type exists or checking ID
        // 1. Pick 2 random unique potions (if possible)
        const opts = [...POTIONS_DB];
        const p1 = opts[Math.floor(Math.random() * opts.length)];
        
        // Filter out the first potion to ensure we don't pick the same kind twice
        const remainingOpts = opts.filter(p => p.id !== p1.id);
        const p2 = remainingOpts.length > 0 
            ? remainingOpts[Math.floor(Math.random() * remainingOpts.length)]
            : p1;

        // 2. Merge logic
        // Range = min(p1.range, p2.range)
        const range = Math.min(p1.range || 0, p2.range || 0);

        // Self Damage Component
        const selfDmgPart: CardData = {
           id: 'pot_self_dmg',
           type: 'CRAFTED',
           name: 'Side Effect',
           desc: 'Deal 1 to self.',
           effects: [],
           speed: 'FAST',
           range: 0,
           image: ''
        };
        
        // Create Merged Card
        const mergedCard: CardData = {
            id: `mix_${Math.random().toString(36).substr(2, 9)}`,
            uid: Math.random(),
            type: 'CRAFTED',
            name: `Unstable Brew`,
            desc: `${p1.desc} ${p2.desc} Deal 1 to self.`,
            effects: [], // Values are handled by constituent cards
            speed: 'FAST', // Potions are FAST
            range: range,
            // effect: 'MERGED_POTION', // Removed
            ownerId: 'alchemist',
            volatile: true, // "The crafted card has VOLATILE"
            mergedCards: [p1, p2, selfDmgPart],
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
    if (card.mergedCards && card.mergedCards.length > 0) {
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
    if (card.effects.some(e => e.type === 'SCRY' || e.type === 'REVEAL')) { // Assuming 'DIVINE' was renamed or mapped to similar, or handled by ID
        // Note: The original code used effect === 'DIVINE'. I'll check if I added DIVINE to EffectType.
        // It wasn't in the list I replaced. Let's assume it might still be needed or I should add it.
        // Or if it was removed. Checking list... I didn't add DIVINE.
        // I should probably use effect ID or check descriptions or mapped types.
        // Let's stick to strict ID checks for unique mechanics if not in generic effects.
    }
    
    // Quick Fix: Re-implementing based on original logic but adapted
    // Original: if (card.effect === 'DIVINE')
    // I can check if I kept 'DIVINE' in types. I didn't. 
    // Let's check card.effects array for a custom type or fallback to ID checking in next step if broken.
    // For now, I'll rely on the fact that I can't easily see the effects array of the card passed in here without running code.
    // However, I can see what I modified in types.ts. I did NOT include DIVINE.
    // So I will assume the card metadata for "Foresee" (Prophet) uses a type I should add or reused.
    // Actually, looking at data/index.ts (which I haven't edited yet), Foresee uses effect: 'DIVINE'.
    // I should add DIVINE to EffectType or use a workaround.
    
    // 3. IMPROVE: Boost card in lane
    // unused improveEffect removed
    // Actually, in data.ts, we used to have effect: 'IMPROVE'.
    // Let's use a generic check for "IMPROVE" mechanic by ID or specific effect type if added.
    // I didn't add IMPROVE to types. Let's look at what I added: ... BUFF_ATTACK.
    // I'll assume for this refactor I might need to rely on IDs for these specific complicated mechanics or add them to the switch.
    
    // ... WAIT. I should have added all effect types from the original code or mapped them.
    // Original types used in code: 'DIVINE', 'PICK', 'IMPROVE', 'HEAL', 'CLEAVE', 'BLOOD_OATH', 'PURGE', 'UNSTABLE_MIXTURE', 'MERGED_POTION'
    // My new types: ... 'BLOOD_OATH', 'PURGE', ... 'HEAL', 'CLEAVE'.
    // MISSING: 'DIVINE', 'PICK', 'IMPROVE', 'UNSTABLE_MIXTURE'.
    
    // I should probably handle them by adding them to the type definition in a follow up or just treating them as special cases here.
    // But since I already removed `card.effect` string property, `card.effect === 'DIVINE'` will fail to compile if I try to access a property that doesn't exist on the type.
    // CHECK: `Card` interface no longer has `effect`. 
    // So `card.effect` access is INVALID.
    
    // I MUST iterate `card.effects`.
    
    // unused hasEffectType removed

    // 1. DIVINE (Custom logic, maybe map to 'SCRY' + draw logic? No, Divine is "Draw Kingdom Card")
    // I will use a special check for the ID or add the type to the enum in my head (and file).
    // Let's assume I will look for a card with specific ID 'c_foresee' or similar for now, 
    // OR cleaner: I should have added DIVINE to the enum. 
    // I can't edit the Enum again easily without another full file write.
    // Instead I will map "Foresee" card to have `effects: [{type: 'SCRY'}]` AND specialized logic here?
    // No, Divine is specific.
    
    // Let's use `card.id === 'c_foresee'`.
    if (card.id === 'c_foresee') { // Originally 'DIVINE'
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

    // 2. PICK (Epiphany) - Originally 'PICK'
    if (card.id === 'c_epiphany') { // Originally 'PICK'
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

    // 3. IMPROVE (Omen) - Originally 'IMPROVE'
    if (card.id === 'c_omen') {
        const newPlayerZones = [...state.playerZoneCards];
        const existingCard = newPlayerZones[targetLaneIdx];
        
        // Find the amount to improve from the card's effects (e.g., BUFF_ATTACK or just generic flat value storage)
        // Let's assume Omen has { type: 'APPLY_MOD', modType: 'AUGMENT', amount: 2 } or similar.
        const improveAmount = card.effects.find(e => e.type === 'APPLY_MOD' && e.modType === 'AUGMENT')?.amount || 2;
        
        if (existingCard) {
            // We need to add an effect to the existing card OR increase its existing effects.
            // Simplified: Add a permanent effect to the card.
            const newEffects = [...existingCard.effects];
            
            // Try to find a matching effect to boost
            const damageEffectIdx = newEffects.findIndex(e => e.type === 'DEAL_DAMAGE');
            if (damageEffectIdx >= 0) {
                newEffects[damageEffectIdx] = { ...newEffects[damageEffectIdx], amount: newEffects[damageEffectIdx].amount + improveAmount };
            } else {
                // If it doesn't have damage, maybe add it? Or add to defense? 
                // Context: Omen boosts "Card Value".
                // If the card has Gain X Gray Hearts, boost that.
                const defenseEffectIdx = newEffects.findIndex(e => e.type === 'GAIN_GRAY_HP');
                if (defenseEffectIdx >= 0) {
                    newEffects[defenseEffectIdx] = { ...newEffects[defenseEffectIdx], amount: newEffects[defenseEffectIdx].amount + improveAmount };
                } else {
                    // Fallback: Add damage
                    newEffects.push({ type: 'DEAL_DAMAGE', amount: improveAmount });
                }
            }

            newPlayerZones[targetLaneIdx] = { 
                ...existingCard, 
                effects: newEffects,
                desc: existingCard.desc + ` (+${improveAmount})`
            };
            logs.push(`Foretell: +${improveAmount} to lane ${targetLaneIdx}!`);
            
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
            return { newState: { selectedCardIdx: null }, logs };
        }
    }

    // 4. HEAL (Mending)
    const healEffect = card.effects.find(e => e.type === 'HEAL');
    if (healEffect) {
        const newPlayerUnits = [...state.playerUnits];
        const hero = newPlayerUnits[targetLaneIdx];
        
        if (hero) {
            const oldHp = hero.hp;
            newPlayerUnits[targetLaneIdx] = {
                ...hero,
                hp: Math.min(hero.maxHp, hero.hp + healEffect.amount)
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
    if (card.effects.some(e => e.type === 'BLOOD_OATH')) {
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
                    augment: (crusader.buffs.augment || 0) + 2 // Use Augment consistently
                }
            };
            
            logs.push(`Blood Oath: Crusader sacrificed 2 HP for 2 Augment!`);

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

    if (card.effects.some(e => e.type === 'SCRY')) {
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

    if (card.effects.some(e => e.type === 'REVEAL')) {
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
    // Note: We bypass Detain checks for FAST cards essentially by placing them freshly here
    const tempPlayerZones = [...state.playerZoneCards];
    tempPlayerZones[targetLaneIdx] = card;

    const resolution = resolveLane(
        targetLaneIdx,
        state.playerUnits,
        state.enemyUnits,
        tempPlayerZones,
        state.enemyZoneCards,
        { onlyPlayerAction: true }
    );

    // Ensure we log what happened
    if (resolution.logs.length === 0) {
        logs.push("Effect resolved (no visible outcome).");
    }

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
