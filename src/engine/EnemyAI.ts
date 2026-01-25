import { Card as CardData } from '../types';

export const generateEnemyCard = (deckType: string): CardData => {
    let card: CardData;
    // Default to BASIC type for enemy cards
    const baseCard = { type: 'BASIC' as const };
    
    switch(deckType) {
        case 'weak': // Skeletons: low damage, mostly attack
            card = { ...baseCard, id: 'enemy_card', actionType: 'ATTACK', value: 1, name: 'Rusty Blade', desc: 'Deal 1.' };
            break;
            
        case 'medium': { // Orc Warrior: balanced
            const action = Math.random() > 0.5 ? 'ATTACK' : 'DEFENSE';
            const val = 2;
            card = { ...baseCard, id: 'enemy_card', actionType: action, value: val, name: 'Warrior Strike', desc: action === 'ATTACK' ? `Deal ${val}.` : `Gain ${val} gray hearts.` };
            break;
        }
            
        case 'tricky': { // Shadow Wraith: unpredictable mix
            const action = Math.random() > 0.7 ? 'DEFENSE' : 'ATTACK';
            const val = 1 + Math.floor(Math.random()*2);
            card = { ...baseCard, id: 'enemy_card', actionType: action, value: val, name: 'Shadow Move', desc: action === 'ATTACK' ? `Deal ${val}.` : `Gain ${val} gray hearts.` };
            break;
        }
            
        case 'support': // Goblin Shaman: mostly defense
            card = { ...baseCard, id: 'enemy_card', actionType: 'DEFENSE', value: 2, name: 'Mystic Ward', desc: 'Gain 2 gray hearts.' };
            break;
            
        case 'tank': // Armored Knight: high defense
            card = { ...baseCard, id: 'enemy_card', actionType: 'DEFENSE', value: 3, name: 'Shield Wall', desc: 'Gain 3 gray hearts.' };
            break;
            
        case 'burst': { // Dark Assassin: high attack, low defense
            const action = Math.random() > 0.8 ? 'DEFENSE' : 'ATTACK';
            const val = 3;
            card = { ...baseCard, id: 'enemy_card', actionType: action, value: val, name: 'Assassinate', desc: action === 'ATTACK' ? `Deal ${val}.` : `Gain ${val} gray hearts.` };
            break;
        }
            
        case 'buff_enemy': { // Blood Cultist: buffs nearby enemies (simulated as high defense)
            const val = 2 + Math.floor(Math.random()*2);
            card = { ...baseCard, id: 'enemy_card', actionType: 'DEFENSE', value: val, name: 'Blood Ritual', desc: `Gain ${val} gray hearts.` };
            break;
        }
            
        case 'defense_spam': { // Void Mage: spam defense cards
            const val = 2 + Math.floor(Math.random()*2);
            card = { ...baseCard, id: 'enemy_card', actionType: 'DEFENSE', value: val, name: 'Void Barrier', desc: `Gain ${val} gray hearts.` };
            break;
        }
            
        case 'big_damage': { // Berserker: huge damage
            const val = 4 + Math.floor(Math.random()*2);
            card = { ...baseCard, id: 'enemy_card', actionType: 'ATTACK', value: val, name: 'Brutal Cleave', desc: `Deal ${val}.` };
            break;
        }
            
        case 'multi_hit': // Plague Doctor: multiple small hits (simulated as consistent 2 damage)
            card = { ...baseCard, id: 'enemy_card', actionType: 'ATTACK', value: 2, name: 'Plague Spit', desc: 'Deal 2.' };
            break;
            
        case 'summoner': { // Necromancer: balanced with more cards
            const action = Math.random() > 0.6 ? 'ATTACK' : 'DEFENSE';
            const val = 1 + Math.floor(Math.random()*2);
            card = { ...baseCard, id: 'enemy_card', actionType: action, value: val, name: 'Dark Magic', desc: action === 'ATTACK' ? `Deal ${val}.` : `Gain ${val} gray hearts.` };
            break;
        }
            
        case 'boss': { // Dragon: devastating attacks
            const action = Math.random() > 0.7 ? 'DEFENSE' : 'ATTACK';
            const val = 3 + Math.floor(Math.random()*3);
            card = { id: 'enemy_card', type: 'SIGNATURE', actionType: action, value: val, name: 'Dragon Fury', desc: action === 'ATTACK' ? `Deal ${val}.` : `Gain ${val} gray hearts.` };
            break;
        }
            
        default: {
            const action = Math.random() > 0.6 ? 'ATTACK' : 'DEFENSE';
            const val = 1 + Math.floor(Math.random()*2);
            card = { ...baseCard, id: 'enemy_card', actionType: action, value: val, name: 'Action', desc: action === 'ATTACK' ? `Deal ${val}.` : `Gain ${val} gray hearts.` };
        }
    }
    return card;
};

export const generateProvokedAttack = (deckType: string): CardData => {
    let attackValue = 2;
    switch (deckType) {
        case 'burst':
        case 'big_damage':
            attackValue = 3 + Math.floor(Math.random() * 2);
            break;
        case 'boss':
            attackValue = 3 + Math.floor(Math.random() * 3);
            break;
        case 'medium':
        case 'tricky':
            attackValue = 2 + Math.floor(Math.random() * 2);
            break;
        default:
            attackValue = 1 + Math.floor(Math.random() * 2);
    }
    
    return {
        id: 'enemy_provoked',
        type: 'BASIC',
        actionType: 'ATTACK',
        value: attackValue,
        name: 'Provoked Strike',
        desc: `Deal ${attackValue}.`,
        revealed: true
    };
};
