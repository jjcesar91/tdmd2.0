import { Unit, Card as CardData } from '../types';

interface ResolutionResult {
    playerUnits: (Unit | null)[];
    enemyUnits: (Unit | null)[];
    logs: string[];
    enemyZones?: (CardData | null)[];
}

export const applyRoundBuffs = (
    units: (Unit | null)[], 
    zones: (CardData | null)[]
): (Unit | null)[] => {
    return units.map((u, i) => {
        if (!u || u.dead) return u;
        const newUnit = { ...u, buffs: { ...u.buffs } };
        const card = zones[i];
        
        if (card) {
            if (card.id === 'pot_heal') newUnit.hp = Math.min(newUnit.maxHp, newUnit.hp + 3);
            if (card.id === 'pot_inv') newUnit.buffs.immune = true;
            if (card.id === 'pot_str') newUnit.buffs.strength += 2;
            if (card.effect === 'TANK_RIGHT') newUnit.buffs.tanking = true;
            if (card.effect === 'TANK_ALL') {
                newUnit.buffs.tanking = true;
            }
        }
        return newUnit;
    });
};

export const resolveLane = (
    laneIdx: number,
    playerUnits: (Unit | null)[],
    enemyUnits: (Unit | null)[],
    playerZones: (CardData | null)[],
    enemyZones: (CardData | null)[]
): ResolutionResult => {
    const pUnits = playerUnits.map(u => u ? {...u} : null); // Deep copy for mutation within this step
    const eUnits = enemyUnits.map(u => u ? {...u} : null);
    const pCard = playerZones[laneIdx];
    const eCard = enemyZones[laneIdx];
    const pUnit = pUnits[laneIdx];
    const eUnit = eUnits[laneIdx];
    
    let logs: string[] = [];
    let msg = "";

    // --- Player Attack Phase ---
    if (pUnit && !pUnit.dead && pCard) {
        // DETAIN (Pietrifying Curse)
        if (pCard.effect === 'DETAIN') {
             // Find target (same logic as attack)
             let targetIdx = laneIdx; 
             if (!eUnits[laneIdx] || eUnits[laneIdx]!.dead) {
                 const candidates = [0,1,2].filter(idx => eUnits[idx] && !eUnits[idx]!.dead).sort((a,b) => Math.abs(a-laneIdx) - Math.abs(b-laneIdx));
                 if (candidates.length > 0) targetIdx = candidates[0];
             }
             
             if (enemyZones[targetIdx]) {
                 enemyZones[targetIdx] = { ...enemyZones[targetIdx]!, detained: (enemyZones[targetIdx]!.detained || 0) + 2 };
                 msg += `Detained ${eUnits[targetIdx]?.name || 'Target'}! `;
             } else {
                 msg += "Detain whiffed! ";
             }
        }

        let dmg = (pCard.actionType === 'ATTACK' ? pCard.value : 0) + (pUnit.buffs.strength || 0) + (pUnit.buffs.anger || 0);
        
        // Eye for an Eye / Purge
        if (pCard.effect === 'EYE_FOR_EYE' || pCard.effect === 'PURGE') {
            dmg = pUnit.maxHp - pUnit.hp;
        }

        // Target Selection
        let targetIdx = laneIdx; 
        if (!eUnits[laneIdx] || eUnits[laneIdx]!.dead) {
            // Priority 1: Left adjacent
            if (laneIdx > 0 && eUnits[laneIdx-1] && !eUnits[laneIdx-1]!.dead) {
                targetIdx = laneIdx - 1;
            }
            // Priority 2: Right adjacent
            else if (laneIdx < 2 && eUnits[laneIdx+1] && !eUnits[laneIdx+1]!.dead) {
                targetIdx = laneIdx + 1;
            }
            // Priority 3: Farthest alive enemy
            else {
                const candidates = [0,1,2].filter(idx => eUnits[idx] && !eUnits[idx]!.dead);
                if (candidates.length > 0) {
                    targetIdx = candidates.reduce((farthest, current) => 
                        Math.abs(current - laneIdx) > Math.abs(farthest - laneIdx) ? current : farthest
                    );
                }
            }
        }

        // Ranger CRIT (Level 5)
        const rangerUnit = pUnits.find(u => u && u.id === 'ranger' && !u.dead && (u.level || 1) >= 5);
        if (rangerUnit && rangerUnit.buffs.immune && pCard.ownerId === 'ranger') {
            dmg *= 2;
            msg += "CRIT! ";
        }

        // Defense Calculation
        let reduction = (enemyZones[targetIdx]?.actionType === 'DEFENSE') ? (enemyZones[targetIdx]?.value || 0) : 0;
        let finalDmg = Math.max(0, dmg - reduction);

        // Ranger Passive: Hunter's Mark (Double DMG vs Revealed)
        const targetEnemy = eUnits[targetIdx];
        if (pUnit.id === 'ranger' && targetEnemy && enemyZones[targetIdx]?.revealed) {
            if (finalDmg > 0) {
                finalDmg *= 2;
                msg += "Hunter's Mark! ";
            }
        }

        // Mark of Hunter
        if (enemyZones[targetIdx]?.effect === 'MARK_HUNTER' && finalDmg > 0) {
            finalDmg *= 2;
            msg += "Marked! ";
        }

        // Apply Damage
        if (finalDmg > 0 && eUnits[targetIdx]) {
            eUnits[targetIdx]!.hp -= finalDmg;
            if (eUnits[targetIdx]!.hp <= 0) { 
                eUnits[targetIdx]!.dead = true; 
                eUnits[targetIdx]!.hp = 0; 
            }
            msg += `Hit ${finalDmg}! `;
        }

        // CLEAVE: Splash damage to adjacent lanes relative to TARGET
        if (pCard.effect === 'CLEAVE') {
            const adjIndices = [targetIdx - 1, targetIdx + 1];
            adjIndices.forEach(adjIdx => {
                if (adjIdx >= 0 && adjIdx <= 2 && eUnits[adjIdx] && !eUnits[adjIdx]!.dead) {
                     let adjReduction = (enemyZones[adjIdx]?.actionType === 'DEFENSE') ? (enemyZones[adjIdx]?.value || 0) : 0;
                     let adjFinalDmg = Math.max(0, dmg - adjReduction);
                     
                     if (adjFinalDmg > 0) {
                         eUnits[adjIdx]!.hp -= adjFinalDmg;
                         if (eUnits[adjIdx]!.hp <= 0) {
                             eUnits[adjIdx]!.dead = true;
                             eUnits[adjIdx]!.hp = 0;
                         }
                         msg += `Cleave ${adjFinalDmg}! `;
                     }
                }
            });
        }
    }

    // --- Enemy Attack Phase ---
    if (eUnit && !eUnit.dead && eCard) {
        // Skip if detained
        if (eCard.detained && eCard.detained > 0) {
            msg += `Enemy ${eUnit.name} is Detained! `;
        } else {
            let dmg = (eCard.actionType === 'ATTACK' ? eCard.value : 0);
            
            // Target Selection
            let targetIdx = laneIdx;
            if (!pUnits[laneIdx] || pUnits[laneIdx]!.dead) {
                const candidates = [0,1,2].filter(idx => pUnits[idx] && !pUnits[idx]!.dead);
                if (candidates.length > 0) targetIdx = candidates[0];
            }
            let targetUnit = pUnits[targetIdx];
    
            // Tanking Logic
            // Find if anyone is tanking for this specific targetIdx
            // TANK_RIGHT tanks for laneIdx+1 === targetIdx
            const tankingUnit = pUnits.find((u, idx) => {
                if (!u || u.dead || !u.buffs.tanking) return false;
                
                // TANK_ALL: check if any player zone card has TANK_ALL effect for this unit
                const hasTankAll = playerZones.some(c => c?.effect === 'TANK_ALL' && c.ownerId === u.id);
                if (hasTankAll) return true;
                
                // TANK_RIGHT
                return idx + 1 === targetIdx;
            });
    
            if (tankingUnit) { 
                targetUnit = tankingUnit; 
                msg += "Tank! "; 
            }
    
            // Apply Damage
            if (targetUnit) {
                if (targetUnit.buffs.immune) { 
                    msg += "Immune! "; 
                } else {
                    let reduction = (playerZones[targetIdx]?.actionType === 'DEFENSE') ? (playerZones[targetIdx]?.value || 0) : 0;
                    
                    // DEF_RIGHT Support
                    if (targetIdx > 0 && playerZones[targetIdx-1]?.effect === 'DEF_RIGHT') {
                        reduction += (playerZones[targetIdx-1]?.value || 0);
                    }
                    
                    let finalDmg = Math.max(0, dmg - reduction);
    
                    // Gray HP Logic
                    if (finalDmg > 0 && (targetUnit.grayHp || 0) > 0) { 
                        const abs = Math.min(finalDmg, targetUnit.grayHp || 0); 
                        targetUnit.grayHp = (targetUnit.grayHp || 0) - abs; 
                        finalDmg -= abs; 
                    }
    
                    if (finalDmg > 0) {
                        targetUnit.hp -= finalDmg;
                        if (targetUnit.hp <= 0) { 
                            targetUnit.dead = true; 
                            targetUnit.hp = 0; 
                        } else {
                             msg += `Hit ${finalDmg}! `;
                        }
                    }
                    
                    // Update PUnits reference
                    const tIndex = pUnits.findIndex(u => u && u.id === targetUnit!.id);
                    if (tIndex !== -1) pUnits[tIndex] = targetUnit;
                }
            }
        }
    }

    if (msg) logs.push(msg);

    return { playerUnits: pUnits, enemyUnits: eUnits, logs, enemyZones: enemyZones };
};
