import { Unit } from '../types';
import { ENEMIES_DB } from '../data';

export const generateEncounter = (enemyType: string): (Unit | null)[] => {
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
    return enemies;
};