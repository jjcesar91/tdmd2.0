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
            if (card.id === 'pot_str') newUnit.buffs.augment += 2;
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

    // --- Phase 0: Defense / Gray HP Application ---
    // Player Defense & Supports
    if (pUnit && !pUnit.dead) {
        let gainedGrayHp = 0;
        // Self Defense
        if (pCard && pCard.actionType === 'DEFENSE') {
            gainedGrayHp += (pCard.value || 0);
        }
        // Support from Left
        if (laneIdx > 0 && playerZones[laneIdx-1]?.effect === 'DEF_RIGHT') {
            gainedGrayHp += (playerZones[laneIdx-1]?.value || 0);
        }
        
        if (gainedGrayHp > 0) {
            pUnit.grayHp = (pUnit.grayHp || 0) + gainedGrayHp;
            msg += `${pUnit.name} +${gainedGrayHp} Gray HP. `;
        }
    }

    // Enemy Defense
    if (eUnit && !eUnit.dead) {
        if (eCard && eCard.actionType === 'DEFENSE') {
            const val = eCard.value || 0;
            if (val > 0) {
                eUnit.grayHp = (eUnit.grayHp || 0) + val;
                msg += `${eUnit.name} +${val} Gray HP. `;
            }
        }
    }

    // --- Player Attack Phase ---
    if (pUnit && !pUnit.dead && pCard) {
        // DETAIN (Pietrifying Curse & Foresee)
        if (pCard.effect === 'DETAIN') {
             // Find target (same logic as attack)
             let targetIdx = laneIdx; 
             if (!eUnits[laneIdx] || eUnits[laneIdx]!.dead) {
                 const candidates = [0,1,2].filter(idx => eUnits[idx] && !eUnits[idx]!.dead).sort((a,b) => Math.abs(a-laneIdx) - Math.abs(b-laneIdx));
                 if (candidates.length > 0) targetIdx = candidates[0];
             }
             
             if (enemyZones[targetIdx]) {
                 enemyZones[targetIdx] = { ...enemyZones[targetIdx]!, detained: (enemyZones[targetIdx]!.detained || 0) + (pCard.value || 0) };
                 msg += `Detained ${eUnits[targetIdx]?.name || 'Target'}! `;
             } else {
                 msg += "Detain whiffed! ";
             }
        }

        // VULNERABLE (Omen)
        if (pCard.effect === 'VULNERABLE') {
             // Find target (same logic as attack)
             let targetIdx = laneIdx;
             if (!eUnits[laneIdx] || eUnits[laneIdx]!.dead) {
                 const candidates = [0,1,2].filter(idx => eUnits[idx] && !eUnits[idx]!.dead).sort((a,b) => Math.abs(a-laneIdx) - Math.abs(b-laneIdx));
                 if (candidates.length > 0) targetIdx = candidates[0];
             }
             
             if (eUnits[targetIdx]) {
                 const currentVal = eUnits[targetIdx]!.buffs.vulnerable || 0;
                 eUnits[targetIdx]!.buffs.vulnerable = currentVal + (pCard.value || 0);
                 msg += `Vulnerable ${eUnits[targetIdx]?.name}! `;
             }
        }

        let dmg = (pCard.actionType === 'ATTACK' ? pCard.value : 0) + (pUnit.buffs.augment || 0) + (pUnit.buffs.anger || 0);
        
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

        let finalDmg = dmg; // Damage is not reduced directly anymore, but absorbed by Gray HP

        if (finalDmg > 0 && eUnits[targetIdx]?.buffs.vulnerable) {
             finalDmg += 2;
             msg += "Vuln! ";
        }

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

        // Gray HP Absorption (Standard Logic)
        if (finalDmg > 0 && targetEnemy && (targetEnemy.grayHp || 0) > 0) {
            const abs = Math.min(finalDmg, targetEnemy.grayHp || 0);
            targetEnemy.grayHp = (targetEnemy.grayHp || 0) - abs;
            finalDmg -= abs;
            if (abs > 0) msg += `Absorbed ${abs}! `;
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
                     // Adjacent units benefit from their own defense card if present (added to gray HP already?) 
                     // Wait, we add Gray HP for TARGET only in above block? NO, we iterate resolved lanes.
                     // IMPORTANT: resolveLane is typically called per lane. 
                     // But here we are looking at `targetIdx`.
                     // If target indices have defense cards, we should probably award them Gray HP too if we want CLEAVE to be mitigated?
                     // BUT, if `resolveLane` is called for lane 0, and target is 0, we added Gray HP to 0.
                     // Cleave hits 1. Lane 1 hasn't resolved yet? Or has it?
                     // Usually combat resolves simultaneously or in order.
                     // To be safe and fair: Standard Defense card only protects the unit it's ON. 
                     // If I resolve lane 0, and Cleave hits lane 1, 
                     // EITHER lane 1 already resolved and got Gray HP, 
                     // OR lane 1 hasn't resolved yet.
                     // If `resolveLane` is strictly calculating outcome for Player Lane X vs Enemy Lane X,
                     // but interactions cross lanes...
                     
                     // SIMPLIFICATION for now: Standard damage calculation checks Gray HP.
                     // We just need to ensure Gray HP is there.
                     // If we are modifying `eUnits` in place for THIS resolution step,
                     // we should check if they have valid defense cards that trigger NOW.
                     
                     // HOWEVER, if 'resolveLane' is called sequentially 0..1..2,
                     // and Lane 0 Cleaves Lane 1... Lane 1 might not have 'gained' its Gray HP yet if it gains it during ITS resolution.
                     // Ideally, "Start of Round" buffs (like Gray HP from cards) should happen BEFORE damage calculation.
                     // Given the structure, maybe we should apply DEFENSE cards as a "Pre-Combat Phase"?
                     // But conforming to request: "When resolving a lane, gray hearts will also be gained before any damage dealing."
                     
                     // For Cleave: We verify if adjacent unit has defense card, if so, grant Gray HP temporarily to calculate?
                     // OR we just use whatever Gray HP controls they have.
                     // If they haven't resolved yet, they rely on pre-existing Gray HP (from last turn?).
                     // This is a known issue in sequential resolution systems.
                     // Let's stick to: Check Gray HP. If it's 0 and they have a defense card, maybe we should credit it?
                     // But that would duplicate it when their lane resolves.
                     
                     // FIX: For now, Cleave just hits. If they have Gray HP, good.
                     // To properly support "Defense Card adds Gray HP", all Defense cards should ideally resolve/trigger 
                     // before ANY attacks. But user said "When resolving a lane...".
                     // So: When I attack result for Lane 0, I see Lane 0 enemy card.
                     // If Lane 0 enemy has defense, they gain Gray HP. I hit them.
                     // Lane 1 enemy has Defense. Does they gain Gray HP now? No, they gain it when Lane 1 resolves.
                     // So Cleave on Lane 1 hits their "current" Gray HP (from before).
                     // This might be intended tactical depth (Attack left to prevent right from setting up?).
                     
                     // Wait! Logic tweak:
                     // If enemy Lane 1 has a Defense card, and I Cleave it from Lane 0...
                     // The Defense card *has not activated yet*. So Cleave bypasses it.
                     // This effectively NERFS defense vs Cleave/Speed, unless Defense is "Fast".
                     // Let's respect "When resolving a lane" instruction strictly.
                     
                     // Only existing Gray HP protects adjacent units for now.
                     // BUT wait, we need to apply `adjReduction` logic from before?
                     // Previous code: `let adjReduction = (enemyZones[adjIdx]?.actionType === 'DEFENSE') ? ...`
                     // This implies Defense passively reduced damage even if not active/resolved?
                     // If we remove this, Defense becomes weaker vs Cleave.
                     // User said "Prevent ... always into gaining Gray Hearts".
                     // If I simply replace reduction with gray HP check, 
                     // and don't grant Gray HP pre-emptively,
                     // then Cleave is stronger.
                     
                     // Attempt to replicate "Passive Defense" vs Cleave:
                     // If adj unit has Defense card, grant them "Phantom Gray HP" for this hit?
                     // No, "Gain Gray Hearts" implies accumulation and persistence.
                     // Let's stick to strict resolution. Defense card activates on its turn.
                     
                     let adjFinalDmg = dmg;
                     
                     if (eUnits[adjIdx] && (eUnits[adjIdx]!.grayHp || 0) > 0) {
                         const abs = Math.min(adjFinalDmg, eUnits[adjIdx]!.grayHp || 0);
                         eUnits[adjIdx]!.grayHp = (eUnits[adjIdx]!.grayHp || 0) - abs;
                         adjFinalDmg -= abs;
                     }
                     
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
        // RECOIL Logic
        let recoilDmg = 0;
        playerZones.forEach((c, i) => {
             if (c && c.recoil && c.recoil > 0) {
                 const isAoE = c.desc.includes('AoE') || c.effect === 'NOXIOUS';
                 if (i === laneIdx || (isAoE && Math.abs(i - laneIdx) === 1)) {
                     recoilDmg += c.recoil;
                 }
             }
        });
        
        if (recoilDmg > 0) {
             eUnit.hp -= recoilDmg;
             if (eUnit.hp <= 0) {
                 eUnit.dead = true;
                 eUnit.hp = 0;
             }
             msg += `Recoil ${recoilDmg}! `;
        }
        
        // Skip if detained (or dead from recoil)
        if (eUnit.dead) {
            // Unit died to recoil
        } else if (eCard.detained && eCard.detained > 0) {
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
                // Defense Calculation - Removed specific check here as it is applied in Phase 0
                // We keep generic defense check only if needed for reduction, but requested logic is Gray HP conversion.

                if (targetUnit.buffs.immune) { 
                    msg += "Immune! "; 
                } else {
                    let finalDmg = dmg;
    
                    if (finalDmg > 0 && targetUnit.buffs.vulnerable) {
                        finalDmg += 2;
                        msg += "Vuln! ";
                    }

                    // Gray HP Logic
                    if (finalDmg > 0 && (targetUnit.grayHp || 0) > 0) { 
                        const abs = Math.min(finalDmg, targetUnit.grayHp || 0); 
                        targetUnit.grayHp = (targetUnit.grayHp || 0) - abs; 
                        finalDmg -= abs; 
                        if (abs > 0) msg += `Absorbed ${abs}! `;
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
