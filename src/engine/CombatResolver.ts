import { Unit, Card as CardData } from '../types';

interface ResolutionResult {
    playerUnits: (Unit | null)[];
    enemyUnits: (Unit | null)[];
    logs: string[];
    enemyZones?: (CardData | null)[];
    playerZones?: (CardData | null)[];
}

// Helper to determine target indices
const resolveTargets = (
    laneIdx: number, 
    sourceUnits: (Unit | null)[],
    targetUnits: (Unit | null)[], 
    targetType: 'SELF' | 'ENEMY' | 'ALLY' | 'ALL_ENEMIES' | 'ALL_ALLIES' | undefined,
    isAoE: boolean | undefined
): number[] => {
    let targets: number[] = [];

    // ALLY (Self/Lane Hero if source is player)
    if (targetType === 'SELF' || targetType === 'ALLY') {
        if (sourceUnits[laneIdx]) targets.push(laneIdx);
    }
    // ENEMY
    else if (targetType === 'ENEMY') {
        // Standard targeting logic (Lane -> Adj -> Farthest)
        // Check if lane has enemy
        if (targetUnits[laneIdx] && !targetUnits[laneIdx]!.dead) {
            targets.push(laneIdx);
        } else {
            // Find substitute
             // Priority 1: Left adjacent
             if (laneIdx > 0 && targetUnits[laneIdx-1] && !targetUnits[laneIdx-1]!.dead) {
                targets.push(laneIdx-1);
            }
            // Priority 2: Right adjacent
            else if (laneIdx < 2 && targetUnits[laneIdx+1] && !targetUnits[laneIdx+1]!.dead) {
                targets.push(laneIdx+1);
            }
            // Priority 3: Farthest alive
            else {
                const candidates = [0,1,2].filter(idx => targetUnits[idx] && !targetUnits[idx]!.dead);
                if (candidates.length > 0) {
                     const farthest = candidates.reduce((best, current) => 
                        Math.abs(current - laneIdx) > Math.abs(best - laneIdx) ? current : best
                    );
                    targets.push(farthest);
                }
            }
        }
    }
    else if (targetType === 'ALL_ENEMIES') {
        return [0,1,2].filter(i => targetUnits[i] && !targetUnits[i]!.dead);
    }
    else if (targetType === 'ALL_ALLIES') {
        return [0,1,2].filter(i => sourceUnits[i] && !sourceUnits[i]!.dead);
    }

    // Apply AoE if single target
    if (isAoE && targets.length === 1) {
        const primary = targets[0];
        const adj = [primary - 1, primary + 1].filter(i => i >= 0 && i <= 2);
        // Add adjacent if valid unit exists
        adj.forEach(i => {
             // Check correct side based on targetType.
             // If target was ENEMY, check targetUnits
             const collection = (targetType === 'ENEMY') ? targetUnits : sourceUnits;
             if (collection[i] && !collection[i]!.dead) targets.push(i);
        });
    }

    return [...new Set(targets)]; // Unique
};

export const applyRoundBuffs = (
    units: (Unit | null)[], 
    zones: (CardData | null)[]
): (Unit | null)[] => {
    // We need to process all cards to apply buffs to correct targets.
    // Since traverse order matters less for buffs, we can clone first.
    let newUnits = units.map(u => u ? { ...u, buffs: { ...u.buffs } } : null);

    zones.forEach((card, laneIdx) => {
        if (!card) return;
        
        // Target resolving for Buffs (Self/Ally)
        // Usually buffs are targeted at ALLY/SELF.
        // If card is 'pot_aug', target is ALLY.
        
        // Process APPLY_MOD (Buffs)
        card.effects.forEach(effect => {
             if (effect.type === 'APPLY_MOD' && effect.modCategory === 'BUFF' && effect.modType === 'AUGMENT') {
                 // Resolve targets
                 const targets = resolveTargets(laneIdx, newUnits, [], effect.target, card.isAoE); // Empty enemy units as buffs don't target enemies usually
                 targets.forEach(tIdx => {
                     if (newUnits[tIdx]) {
                         newUnits[tIdx]!.buffs.augment += effect.amount;
                         // Log? logs are not returned here unfortunately.
                     }
                 });
             }
        });

        // Legacy/Special cases
        if (card.id === 'pot_heal') {
             const targets = resolveTargets(laneIdx, newUnits, [], 'ALLY', card.isAoE);
             targets.forEach(tIdx => {
                 if (newUnits[tIdx]) newUnits[tIdx]!.hp = Math.min(newUnits[tIdx]!.maxHp, newUnits[tIdx]!.hp + 3);
             });
        }
        
        if (card.id === 'pot_inv' || card.effects.some(e => e.type === 'IMMUNE')) {
             const targets = resolveTargets(laneIdx, newUnits, [], 'ALLY', card.isAoE);
             targets.forEach(tIdx => { if (newUnits[tIdx]) newUnits[tIdx]!.buffs.immune = true; });
        }
        
        if (card.effects.some(e => e.type === 'TANK_ALL')) {
             if (newUnits[laneIdx]) newUnits[laneIdx]!.buffs.tanking = true; // Tanking usually self
        }
    });

    return newUnits;
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
    // eCard removed as it was unused
    const pUnit = pUnits[laneIdx];
    const eUnit = eUnits[laneIdx];
    
    let logs: string[] = [];
    let msg = "";

    // --- Phase -1: Priority Control Effects (Detain) ---
    const addToZone = (zoneArr: (CardData | null)[], idx: number, amt: number) => {
        if (zoneArr[idx]) {
            zoneArr[idx] = { ...zoneArr[idx]!, detained: (zoneArr[idx]!.detained || 0) + amt };
        }
    };

    // 1. Player Detains Enemy
    const pDetainEffect = (pUnit && !pUnit.dead && pCard) ? pCard.effects.find(e => e.type === 'DETAIN') : undefined;
    if (pDetainEffect) {
         let targetIdx = laneIdx; 
         // Find target (Default to Lane, else find closest Enemy)
         if (!eUnits[laneIdx] || eUnits[laneIdx]!.dead) {
             const candidates = [0,1,2].filter(idx => eUnits[idx] && !eUnits[idx]!.dead).sort((a,b) => Math.abs(a-laneIdx) - Math.abs(b-laneIdx));
             if (candidates.length > 0) targetIdx = candidates[0];
         }
         
         if (enemyZones[targetIdx]) {
             addToZone(enemyZones, targetIdx, pDetainEffect.amount);
             msg += `Player Detained ${eUnits[targetIdx]?.name || 'Enemy'}! `;
         } else {
             msg += "Player Detain whiffed! ";
         }
    }

    // 2. Enemy Detains Player
    const eCardInitial = enemyZones[laneIdx];
    if (eUnit && !eUnit.dead && eCardInitial) {
        const eDetainEffects = eCardInitial.effects.filter(e => e.type === 'DETAIN');
        eDetainEffects.forEach(eff => {
             let targetIdx = laneIdx;
             // Check Tanking (Global Taunt)
             const tankingIdx = pUnits.findIndex(u => u && !u.dead && u.buffs.tanking);
             
             if (tankingIdx !== -1) {
                 targetIdx = tankingIdx;
             } else if (!pUnits[laneIdx] || pUnits[laneIdx]!.dead) {
                 const candidates = [0,1,2].filter(idx => pUnits[idx] && !pUnits[idx]!.dead).sort((a,b) => Math.abs(a-laneIdx) - Math.abs(b-laneIdx));
                 if (candidates.length > 0) targetIdx = candidates[0];
             }

             if (playerZones[targetIdx]) {
                addToZone(playerZones, targetIdx, eff.amount);
                msg += `Enemy Detained ${pUnits[targetIdx]?.name || 'Player'}! `;
             }
        });
    }

    // Refresh references to respect Detained status update
    const currentPCard = playerZones[laneIdx];
    const currentECard = enemyZones[laneIdx];

    // --- Phase 0: Defense / Gray HP Application ---
    // Player Defense & Supports
    if (pUnit && !pUnit.dead && currentPCard) {
        if (currentPCard.detained && currentPCard.detained > 0) {
             msg += `${pUnit.name} Detained! `; // Log for Player
        } else {
            let gainedGrayHp = 0;
            // Self Defense
            const grayHpEffect = currentPCard.effects.find(e => e.type === 'GAIN_GRAY_HP');
            if (grayHpEffect) gainedGrayHp += grayHpEffect.amount;
            
            if (gainedGrayHp > 0) {
                pUnit.grayHp = (pUnit.grayHp || 0) + gainedGrayHp;
                msg += `${pUnit.name} +${gainedGrayHp} Gray HP. `;
            }
        }
    }

    // Enemy Defense
    if (eUnit && !eUnit.dead && currentECard) {
         const grayHpEffect = currentECard.effects.find(e => e.type === 'GAIN_GRAY_HP');
         if (grayHpEffect) {
             if (currentECard.detained && currentECard.detained > 0) {
                 msg += `${eUnit.name} Defense Detained! `;
             } else {
                 eUnit.grayHp = (eUnit.grayHp || 0) + grayHpEffect.amount;
                 msg += `${eUnit.name} +${grayHpEffect.amount} Gray HP. `;
             }
         }
    }

    // --- Player Attack Phase ---
    let attackingUnit = pUnit;
    
    // If no unit in lane, but card has owner, try to find owner for determining stats/range legality
    if ((!attackingUnit || attackingUnit.dead) && currentPCard && currentPCard.ownerId) {
        const owner = pUnits.find(u => u && u.id === currentPCard.ownerId && !u.dead);
        if (owner) {
             // Basic Range Check: Is owner close enough to "reach" this lane?
             // Since we use the lane as the "Source of Effect", if the owner placed it here remotely,
             // then the owner essentially "is acting" here.
             // We can use the owner's unit for stat calculations.
             const ownerIdx = pUnits.indexOf(owner);
             const dist = Math.abs(ownerIdx - laneIdx);
             const range = currentPCard.range || 0;
             if (dist <= range) {
                 attackingUnit = owner;
             }
        }
    }

    if (attackingUnit && !attackingUnit.dead && currentPCard && (!currentPCard.detained || currentPCard.detained <= 0)) {
        
        // Decrement Augment if a card is played
        if ((attackingUnit.buffs.augment || 0) > 0) {
             attackingUnit.buffs.augment = (attackingUnit.buffs.augment || 0) - 1;
        }

        // VULNERABLE (APPLY_MOD Debuff)
        const vulnEffects = currentPCard.effects.filter(e => e.type === 'APPLY_MOD' && e.modType === 'VULNERABLE');
        vulnEffects.forEach(eff => {
             const targets = resolveTargets(laneIdx, pUnits, eUnits, eff.target, currentPCard.isAoE);
             targets.forEach(tIdx => {
                 if (eUnits[tIdx]) {
                     const currentVal = eUnits[tIdx]!.buffs.vulnerable || 0;
                     eUnits[tIdx]!.buffs.vulnerable = currentVal + eff.amount;
                     msg += `Vulnerable ${eUnits[tIdx]!.name}! `;
                 }
             });
        });

        const damageEffect = currentPCard.effects.find(e => e.type === 'DEAL_DAMAGE');
        let baseDmg = (damageEffect ? damageEffect.amount : 0) + (attackingUnit.buffs.augment || 0) + (attackingUnit.buffs.anger || 0);

        // Purge
        if (currentPCard.effects.some(e => e.type === 'PURGE')) {
            baseDmg = attackingUnit.maxHp - attackingUnit.hp;
        }
        
        if ((damageEffect || currentPCard.effects.some(e => e.type === 'PURGE')) && baseDmg > 0) { 
            // Resolve Targets for Damage
            // Default to ENEMY if not specified in damage effect (Legacy fallback)
            const targetType = damageEffect?.target || 'ENEMY'; 
            const targets = resolveTargets(laneIdx, pUnits, eUnits, targetType, currentPCard.isAoE);

            targets.forEach(targetIdx => {
                let dmg = baseDmg;

                 // Ranger CRIT
                const rangerUnit = pUnits.find(u => u && u.id === 'ranger' && !u.dead && (u.level || 1) >= 5);
                if (rangerUnit && rangerUnit.buffs.immune && currentPCard.ownerId === 'ranger') {
                    dmg *= 2;
                    if (targetIdx === targets[0]) msg += "CRIT! "; // Log once?
                }
                
                let finalDmg = dmg;
                
                // Vulnerable Check on Target
                if (finalDmg > 0 && eUnits[targetIdx]?.buffs.vulnerable) {
                    finalDmg += 2;
                    msg += `Vuln(${eUnits[targetIdx]!.name})! `;
                }

                // Hunter's Mark
                const targetEnemy = eUnits[targetIdx];
                if (attackingUnit!.id === 'ranger' && targetEnemy && enemyZones[targetIdx]?.revealed) {
                    if (finalDmg > 0) {
                        finalDmg += 1;
                        msg += "Hunter's Mark! ";
                    }
                }

                // Gray HP Absorption
                 if (finalDmg > 0 && targetEnemy && (targetEnemy.grayHp || 0) > 0) {
                    const abs = Math.min(finalDmg, targetEnemy.grayHp || 0);
                    targetEnemy.grayHp = (targetEnemy.grayHp || 0) - abs;
                    finalDmg -= abs;
                    if (abs > 0) msg += `Absorbed ${abs}! `;
                }

                // Apply
                if (finalDmg > 0 && eUnits[targetIdx]) {
                    eUnits[targetIdx]!.hp -= finalDmg;
                    if (eUnits[targetIdx]!.hp <= 0) { 
                        eUnits[targetIdx]!.dead = true; 
                        eUnits[targetIdx]!.hp = 0; 
                    }
                    msg += `Hit ${eUnits[targetIdx]!.name} ${finalDmg}! `;
                }
            });
        }
    }

    // --- Enemy Attack Phase ---
    
    if (eUnit && !eUnit.dead && currentECard) {
        // RECOIL Logic
        let recoilDmg = 0;
        playerZones.forEach((c, i) => {
             if (c && c.recoil && c.recoil > 0) {
                 const isAoE = c.desc.includes('AoE') || c.effects.some(e => e.type === 'NOXIOUS');
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
        } else if (currentECard.detained && currentECard.detained > 0) {
            msg += `Enemy ${eUnit.name} is Detained! `;
        } else {
            // 1. Gather Effects
            const damageEffects = currentECard.effects.filter(e => e.type === 'DEAL_DAMAGE');
            const modEffects = currentECard.effects.filter(e => e.type === 'APPLY_MOD');
             
            let totalDmg = damageEffects.reduce((sum, e) => sum + e.amount, 0);
            
            // Target Selection
            let targetIdx = laneIdx;
            if (!pUnits[laneIdx] || pUnits[laneIdx]!.dead) {
                const candidates = [0,1,2].filter(idx => pUnits[idx] && !pUnits[idx]!.dead);
                if (candidates.length > 0) targetIdx = candidates[0];
            }
            let targetUnit = pUnits[targetIdx];
    
            // Tanking Logic
            const tankingUnit = pUnits.find(u => u && !u.dead && u.buffs.tanking);
            if (tankingUnit) { 
                targetUnit = tankingUnit; 
                msg += "Tank! "; 
            }
    
            // Apply Damage
            if (targetUnit) {
                // Apply Mods (Vulnerable)
                modEffects.forEach(eff => {
                    if (eff.modType === 'VULNERABLE') {
                        targetUnit!.buffs.vulnerable = (targetUnit!.buffs.vulnerable || 0) + eff.amount;
                        msg += `Vulnerable ${targetUnit!.name}! `;
                    }
                });

                // Frogman Passive
                const finalTargetIdx = pUnits.findIndex(u => u === targetUnit);
                if (eUnit.id === 'frog_man' && playerZones[finalTargetIdx]?.detained) {
                    totalDmg += 1;
                    msg += "+1(Detained)! ";
                }

                if (targetUnit.buffs.immune && totalDmg > 0) { 
                    msg += "Immune! "; 
                } else {
                    let finalDmg = totalDmg;
    
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

    return { playerUnits: pUnits, enemyUnits: eUnits, logs, enemyZones: enemyZones, playerZones: playerZones };
};
