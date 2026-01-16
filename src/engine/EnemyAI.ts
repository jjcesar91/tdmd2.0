import { Card as CardData } from '../types';

export const generateEnemyCard = (deckType: string): CardData => {
    let card: CardData;
    switch(deckType) {
        case 'weak': // Skeletons: low damage, mostly attack
            card = { id: 'enemy_card', type: 'ATTACK', value: 1, name: 'Rusty Blade', desc: '' };
            break;
        case 'medium': // Orc Warrior: balanced
            card = { id: 'enemy_card', type: Math.random() > 0.5 ? 'ATTACK' : 'DEFENSE', value: 2, name: 'Warrior Strike', desc: '' };
            break;
        case 'tricky': // Shadow Wraith: unpredictable mix
            card = { id: 'enemy_card', type: Math.random() > 0.7 ? 'DEFENSE' : 'ATTACK', value: 1 + Math.floor(Math.random()*2), name: 'Shadow Move', desc: '' };
            break;
        case 'support': // Goblin Shaman: mostly defense
            card = { id: 'enemy_card', type: 'DEFENSE', value: 2, name: 'Mystic Ward', desc: '' };
            break;
        case 'tank': // Armored Knight: high defense
            card = { id: 'enemy_card', type: 'DEFENSE', value: 3, name: 'Shield Wall', desc: '' };
            break;
        case 'burst': // Dark Assassin: high attack, low defense
            card = { id: 'enemy_card', type: Math.random() > 0.8 ? 'DEFENSE' : 'ATTACK', value: 3, name: 'Assassinate', desc: '' };
            break;
        case 'buff_enemy': // Blood Cultist: buffs nearby enemies (simulated as high defense)
            card = { id: 'enemy_card', type: 'DEFENSE', value: 2 + Math.floor(Math.random()*2), name: 'Blood Ritual', desc: '' };
            break;
        case 'defense_spam': // Void Mage: spam defense cards
            card = { id: 'enemy_card', type: 'DEFENSE', value: 2 + Math.floor(Math.random()*2), name: 'Void Barrier', desc: '' };
            break;
        case 'big_damage': // Berserker: huge damage
            card = { id: 'enemy_card', type: 'ATTACK', value: 4 + Math.floor(Math.random()*2), name: 'Brutal Cleave', desc: '' };
            break;
        case 'multi_hit': // Plague Doctor: multiple small hits (simulated as consistent 2 damage)
            card = { id: 'enemy_card', type: 'ATTACK', value: 2, name: 'Plague Spit', desc: '' };
            break;
        case 'summoner': // Necromancer: balanced with more cards
            card = { id: 'enemy_card', type: Math.random() > 0.6 ? 'ATTACK' : 'DEFENSE', value: 1 + Math.floor(Math.random()*2), name: 'Dark Magic', desc: '' };
            break;
        case 'boss': // Dragon: devastating attacks
            card = { id: 'enemy_card', type: Math.random() > 0.7 ? 'DEFENSE' : 'ATTACK', value: 3 + Math.floor(Math.random()*3), name: 'Dragon Fury', desc: '' };
            break;
        default:
            card = { id: 'enemy_card', type: Math.random() > 0.6 ? 'ATTACK' : 'DEFENSE', value: 1 + Math.floor(Math.random()*2), name: 'Action', desc: '' };
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
        type: 'ATTACK',
        value: attackValue,
        name: 'Provoked Strike',
        desc: '',
        revealed: true
    };
};
