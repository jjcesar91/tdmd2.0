import { Card, Unit, CombatState, CardEffect } from '../types';

const createCard = (id: string, name: string, desc: string, effects: CardEffect[], type: 'BASIC' | 'SIGNATURE' | 'ULTIMATE' = 'BASIC'): Card => ({
    id,
    name,
    desc,
    effects,
    type,
    speed: 'NORMAL'
});

// Helper Interface for Decision
export interface PlannedMove {
    lane: number;
    card: Card;
    unitId: string;
}

export const getEnemyDecision = (unit: Unit, state: CombatState, plannedMoves: PlannedMove[]): { card: Card, lane: number } => {
    // Determine Identity and Intent
    if (unit.name === 'Bullyfrog') return getBullyfrogDecision(unit, state, plannedMoves);
    if (unit.name === 'Tadpolearm') return getTadpolearmDecision(unit, state, plannedMoves);
    if (unit.name === 'Frogman') return getFrogmanDecision(unit, state, plannedMoves);

    // Default Fallback
    const card = createCard('basic_attack', 'Attack', 'Deal 2 dmg', [{ type: 'DEAL_DAMAGE', amount: 2, target: 'ENEMY' }]);
    // Find first available lane, preferring own
    const myLaneIdx = state.enemyUnits.findIndex(u => u && u.id === unit.id);
    let chosenLane = myLaneIdx !== -1 ? myLaneIdx : 0;
    
    // Check if lane is taken by ally
    const isTaken = (idx: number) => plannedMoves.some(m => m.lane === idx);
    
    if (isTaken(chosenLane)) {
        // Try to find any available
        const avail = [0, 1, 2].find(i => !isTaken(i));
        if (avail !== undefined) chosenLane = avail;
    }
    
    return { card, lane: chosenLane };
};

// --- BULLYFROG ---
const getBullyfrogDecision = (unit: Unit, state: CombatState, plannedMoves: PlannedMove[]): { card: Card, lane: number } => {
    // 1. Get Intent (Card Selection)
    const bash = createCard('frog_bash', 'Bash', 'AoE. Detain 1. Deal 1.', [
        { type: 'DEAL_DAMAGE', amount: 1, target: 'ENEMY' }, 
        { type: 'DETAIN', amount: 1, target: 'ENEMY' }
    ], 'BASIC');
    bash.isAoE = true;

    // Remove visible lane constraints from description/data as requested
    const growBelly = createCard('frog_belly', 'Grow Belly', 'Gain 3 Gray HP. Tank all.', [
        { type: 'GAIN_GRAY_HP', amount: 3, target: 'SELF' },
        { type: 'TANK_ALL', amount: 1, target: 'SELF' }
    ], 'SIGNATURE');
    // growBelly.lanes = 'MID'; // Removed per new instruction

    const croak = createCard('frog_croak', 'Croak', 'Heal 2. Vulnerable 2 to all opponents.', [
        { type: 'HEAL', amount: 2, target: 'SELF' },
        { type: 'APPLY_MOD', modType: 'VULNERABLE', modCategory: 'DEBUFF', amount: 2, target: 'ALL_ENEMIES' }
    ], 'ULTIMATE');
    // croak.lanes = 'MID'; // Removed per new instruction

    const enemies = state.enemyUnits.filter(u => u && !u.dead);
    const heroes = state.playerUnits.filter(u => u && !u.dead);
    
    // Bullyfrog decides FIRST.
    const myLaneIdx = state.enemyUnits.findIndex(u => u && u.id === unit.id);
    const currentLane = myLaneIdx === -1 ? 0 : myLaneIdx;
    
    // Check if opponent is in Mid Lane (Index 1)
    const opponentInMid = state.playerUnits[1] && !state.playerUnits[1]!.dead;

    // Logic Tree
    const isAlone = enemies.length === 1;
    const lowHpAlly = enemies.some(e => e && e.id !== unit.id && e.hp <= 2);
    const lowHpHero = heroes.some(h => h && h.hp <= 2);

    let selected: Card;

    if (isAlone) selected = bash;
    else if (lowHpAlly) selected = growBelly; // Removed `isMidLane` check
    else if (lowHpHero) selected = croak;     // Removed `isMidLane` check
    else {
        const step = unit.aiCurrentStep || 0;
        if (step % 3 === 0) selected = bash;
        else if (step % 3 === 1) selected = growBelly;
        else selected = croak;
    }

    // 2. Decide Lane
    let targetLane = currentLane;

    // Rule: "If there is an opponent on the mid lane, [Grow Belly and Croak] must be play on Mid Lane"
    if ((selected === growBelly || selected === croak) && opponentInMid) {
        targetLane = 1; // Force Mid
    }
    
    // Check constraints/conflicts
    const isTaken = (idx: number) => plannedMoves.some(m => m.lane === idx);
    
    if (isTaken(targetLane)) {
         // If target obstructed (unlikely if Bully decides first, but possible if persisted cards exist)
         const avail = [0, 1, 2].find(i => !isTaken(i));
         if (avail !== undefined) targetLane = avail;
         else targetLane = currentLane; // Fallback (will likely fail later but AI did its best)
    }

    return { card: selected, lane: targetLane };
};

// --- TADPOLEARM ---
const getTadpolearmDecision = (unit: Unit, state: CombatState, plannedMoves: PlannedMove[]): { card: Card, lane: number } => {
    // Identity
    const poke = createCard('tad_poke', 'Poke', 'Deal 2.', [{ type: 'DEAL_DAMAGE', amount: 2, target: 'ENEMY' }], 'BASIC');
    const cower = createCard('tad_cower', 'Cower', 'Gain Immune.', [{ type: 'IMMUNE', amount: 1, target: 'SELF' }], 'SIGNATURE');
    cower.lanes = 'FRONT'; // "Lane: F"

    const myLaneIdx = state.enemyUnits.findIndex(u => u && u.id === unit.id);
    let currentLane = myLaneIdx !== -1 ? myLaneIdx : 1; // Default to Mid?

    // Rule: "If Bullyfrog is playing a card on its lane, play Cower in Front lane"
    // "its lane" -> Tadpolearm's current lane.
    // robustly find Bullyfrog
    const bullyUnit = state.enemyUnits.find(u => u && u.name === 'Bullyfrog');
    const bullyId = bullyUnit ? bullyUnit.id : 'frog_bully';
    
    const bullyMove = plannedMoves.find(m => m.unitId === bullyId || m.unitId.includes('frog_bully'));
    
    // Assuming Bullyfrog decided first.
    // If unit.id is 'frog_poker' (Tadpolearm), and Bullyfrog played in 'currentLane'
    let shouldUseCower = false;
    if (bullyMove && bullyMove.lane === currentLane) {
        shouldUseCower = true;
    }

    let selected = shouldUseCower ? cower : poke;
    let targetLane = currentLane;

    if (shouldUseCower) targetLane = 0; // Front

    // Check availability
    const isTaken = (idx: number) => plannedMoves.some(m => m.lane === idx);
    
    if (isTaken(targetLane)) {
         // If Cower(Front) is blocked, can we play it elsewhere?
         // "must play on any available lane, if possible"
         // Cower has Lane: F constraint. So unlikely.
         // Fallback to Poke? "AI Behavior: [B]" (Always Poke).
         // If blocked, fallback to Poke in random available lane.
         if (selected === cower) {
             selected = poke;
             const avail = [0, 1, 2].find(i => !isTaken(i));
             targetLane = avail !== undefined ? avail : targetLane;
         } else {
             // Try to move Poke
             const avail = [0, 1, 2].find(i => !isTaken(i));
             targetLane = avail !== undefined ? avail : targetLane;
         }
    }

    return { card: selected, lane: targetLane };
};

// --- FROGMAN ---
const getFrogmanDecision = (unit: Unit, state: CombatState, plannedMoves: PlannedMove[]): { card: Card, lane: number } => {
    // Identity
    const reload = createCard('frogman_reload', 'Reload', 'Gain Augment 2.', [{ type: 'APPLY_MOD', modType: 'AUGMENT', modCategory: 'BUFF', amount: 2, target: 'SELF' }], 'BASIC');
    const shot = createCard('frogman_shot', 'Shot', 'Deal 2. Range 2.', [{ type: 'DEAL_DAMAGE', amount: 2, target: 'ENEMY' }], 'SIGNATURE');
    shot.range = 2;

    const myLaneIdx = state.enemyUnits.findIndex(u => u && u.id === unit.id);
    let currentLane = myLaneIdx !== -1 ? myLaneIdx : 2; // Default Rear

    // Check Moves
    const bullyUnit = state.enemyUnits.find(u => u && u.name === 'Bullyfrog');
    const bullyId = bullyUnit ? bullyUnit.id : 'frog_bully';
    const bullyMove = plannedMoves.find(m => m.unitId === bullyId || m.unitId.includes('frog_bully'));

    // "When Bullyfrog play a card in middle lane [1], always play S on the Front lane [0]"
    if (bullyMove && bullyMove.lane === 1) {
        return { card: shot, lane: 0 }; // Ignore other checks
    }

    // "If an ally want to play something in Frogman lane [currentLane]"
    const allyInMyLane = plannedMoves.some(m => m.lane === currentLane);
    let forceShot = false;

    if (allyInMyLane) {
        forceShot = true;
    }

    // AI Selection
    let selected: Card;
    const step = unit.aiCurrentStep || 0;
    
    if (forceShot) selected = shot;
    else {
        // [B, S]
        if (step % 2 === 0) selected = reload;
        else selected = shot;
    }

    // Target Lane Logic
    let targetLane = currentLane;
    const isTaken = (idx: number) => plannedMoves.some(m => m.lane === idx);

    if (selected === shot) {
         // "choose the lane with the opponent with lower hp"
         // If Shot is played in Lane X, it hits Lane X (CombatResolver defaults).
         // Range 2 allows hitting Far? CombatResolver handles Range?
         // Assuming placement = target for basics.
         const validLanes = [0, 1, 2].filter(i => !isTaken(i));
         if (validLanes.length > 0) {
             // Find best target among valid placements
             let bestLane = validLanes[0];
             let minHp = 999;
             
             validLanes.forEach(l => {
                 const hero = state.playerUnits[l];
                 if (hero && !hero.dead && hero.hp < minHp) {
                     minHp = hero.hp;
                     bestLane = l;
                 }
             });
             targetLane = bestLane;
         }
    } else {
        // Reload: Prefer own lane (already set).
        if (isTaken(targetLane)) {
             const avail = [0, 1, 2].find(i => !isTaken(i));
             targetLane = avail !== undefined ? avail : targetLane;
        }
    }

    // Force Shot override for 'allyInMyLane' implies finding ANY available lane.
    if (forceShot && isTaken(targetLane)) {
         const avail = [0, 1, 2].find(i => !isTaken(i));
         targetLane = avail !== undefined ? avail : targetLane;
    }

    return { card: selected, lane: targetLane };
};

export const getEnemyIntent = (unit: Unit, state: CombatState): Card => {
    // Deprecated wrapper for backward compatibility if needed, but we will switch useGameLoop to use getEnemyDecision
     return getEnemyDecision(unit, state, []).card;
};

