import { Card as CardData, CombatState } from '../types';

interface EffectResult {
    newState: Partial<CombatState>;
    logs: string[];
}

// Helper to remove the played card from hand
const removePlayedCard = (state: CombatState, cardIdx: number): CardData[] => {
    return state.playerHand.filter((_, i) => i !== cardIdx);
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

    // 5. SCRY_LANE (Fast Play)
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
    
    // Default FAST card behavior (just discard)
    return {
        newState: {
            ...newState,
            playerHand: removePlayedCard(state, cardIdx),
            discardPile: [...state.discardPile, card]
        },
        logs
    };
};
