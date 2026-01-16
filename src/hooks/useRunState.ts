import { useState } from 'react';
import { Unit, Card } from '../types';

export function useRunState() {
  const [party, setParty] = useState<Unit[]>([]);
  const [partyLanes, setPartyLanes] = useState<{[heroId: string]: number}>({});
  const [globalDeck, setGlobalDeck] = useState<Card[]>([]);
  const [mapNode, setMapNode] = useState<number>(0);

  const resetRun = () => {
      setParty([]);
      setPartyLanes({});
      setGlobalDeck([]);
      setMapNode(0);
  };

  return {
    party, setParty,
    partyLanes, setPartyLanes,
    globalDeck, setGlobalDeck,
    mapNode, setMapNode,
    resetRun
  };
}
