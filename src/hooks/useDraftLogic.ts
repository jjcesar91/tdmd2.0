import { useState } from 'react';
import { Unit, Card as CardData } from '../types';
import { HEROES_DB } from '../data';

interface UseDraftLogicProps {
  setParty: (party: Unit[]) => void;
  setPartyLanes: (lanes: {[id: string]: number}) => void;
  setGlobalDeck: (deck: CardData[]) => void;
  setMapNode: (node: number) => void;
  setView: (view: string) => void;
}

export function useDraftLogic({ setParty, setPartyLanes, setGlobalDeck, setMapNode, setView }: UseDraftLogicProps) {
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([]);
  const [heroLevels, setHeroLevels] = useState<{[heroId: string]: number}>({});
  const [draggedHeroIndex, setDraggedHeroIndex] = useState<number | null>(null);

  const handleHeroSelect = (heroId: string) => {
    if (selectedHeroes.includes(heroId)) {
      setSelectedHeroes(selectedHeroes.filter(id => id !== heroId));
      const newLevels = { ...heroLevels };
      delete newLevels[heroId];
      setHeroLevels(newLevels);
    } else if (selectedHeroes.length < 3) {
      setSelectedHeroes([...selectedHeroes, heroId]);
      setHeroLevels({ ...heroLevels, [heroId]: 1 });
    }
  };

  const handleLevelChange = (heroId: string, delta: number) => {
    const currentLevel = heroLevels[heroId] || 1;
    const newLevel = Math.max(1, Math.min(5, currentLevel + delta));
    setHeroLevels({ ...heroLevels, [heroId]: newLevel });
  };

  const confirmHeroSelection = () => {
    if (selectedHeroes.length !== 3) return;
    setView('LANE_ASSIGNMENT');
  };

  const handleDragStart = (index: number) => {
    setDraggedHeroIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (targetIndex: number) => {
    if (draggedHeroIndex === null) return;
    
    const newOrder = [...selectedHeroes];
    const [draggedHero] = newOrder.splice(draggedHeroIndex, 1);
    newOrder.splice(targetIndex, 0, draggedHero);
    
    setSelectedHeroes(newOrder);
    setDraggedHeroIndex(null);
  };

  const finalizeDraft = () => {
    if (selectedHeroes.length !== 3) return;
    
    const finalParty = selectedHeroes.map((heroId) => {
      const heroData = HEROES_DB.find(h => h.id === heroId)!;
      return {
        ...heroData,
        level: heroLevels[heroId] || 1,
        dead: false,
        buffs: { immune: false, tanking: false, augment: 0 }
      } as Unit;
    });
    
    const lanes: {[heroId: string]: number} = {};
    selectedHeroes.forEach((heroId, index) => {
      lanes[heroId] = index;
    });
    
    setParty(finalParty);
    setPartyLanes(lanes);
    
    let deck: CardData[] = [];
    finalParty.forEach(hero => {
      if (hero.cards) { 
        hero.cards.forEach(c => {
          // Determine quantity based on card type
          let quantity = 6;
          if (c.type === 'SIGNATURE') quantity = 3;
          if (c.type === 'ULTIMATE') quantity = 1;
          
          for(let i=0; i<quantity; i++) {
             deck.push({
               ...c,
               ownerId: hero.id,
               archetype: hero.archetype,
               uid: Math.random()
             });
          }
        });
      }
    });
    
    setGlobalDeck(deck); 
    setMapNode(0); 
    setView('MAP');
  };

  const resetDraft = () => {
      setSelectedHeroes([]);
      setHeroLevels({});
      setDraggedHeroIndex(null);
  };

  return {
    selectedHeroes,
    heroLevels,
    draggedHeroIndex,
    handleHeroSelect,
    handleLevelChange,
    confirmHeroSelection,
    handleDragStart,
    handleDragOver,
    handleDrop,
    finalizeDraft,
    resetDraft
  };
}
