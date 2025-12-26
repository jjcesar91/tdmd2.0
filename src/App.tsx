import React, { useState, useEffect } from 'react';
import { Shield, Sword, Skull, Heart, RefreshCw, Crown, Castle } from 'lucide-react';

// --- CONFIGURAZIONE E COSTANTI ---

// Tipi di carte
const CARD_TYPES = {
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
} as const;

type CardType = typeof CARD_TYPES[keyof typeof CARD_TYPES];

interface CardData {
  id: number | string;
  type: CardType;
  value: number;
  revealed?: boolean;
}

interface UnitData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  dead: boolean;
  isMain: boolean;
}

// Definizioni delle zone
const ZONES = ['F', 'M', 'R']; // Front, Mid, Rear

// --- COMPONENTI UI ---

interface CardProps {
  type: CardType;
  value: number;
  isHidden?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ type, value, isHidden, onClick, isSelected, disabled, className = "" }) => {
  if (isHidden) {
    return (
      <div className={`bg-slate-800 border-2 border-slate-600 rounded-lg shadow-lg flex items-center justify-center transform transition-transform ${className}`}>
        <div className="w-1/2 h-1/2 border border-slate-700 rounded flex items-center justify-center bg-slate-900 bg-opacity-50">
          <Castle className="text-slate-600 w-2/3 h-2/3" />
        </div>
      </div>
    );
  }

  const isAttack = type === CARD_TYPES.ATTACK;
  const baseColor = isAttack ? "bg-red-950 border-red-700" : "bg-blue-950 border-blue-700";
  const textColor = isAttack ? "text-red-200" : "text-blue-200";
  const Icon = isAttack ? Sword : Shield;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        rounded-lg shadow-xl border-2 relative cursor-pointer transition-all duration-200
        ${baseColor}
        ${isSelected ? 'ring-2 ring-yellow-400 scale-105 z-10' : 'active:scale-95'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        flex flex-col items-center justify-between p-1
        ${className}
      `}
    >
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter text-center w-full border-b border-white/20 pb-0.5 mb-0.5 truncate text-white">
        {isAttack ? 'ATK' : 'DEF'}
      </div>
      <Icon className={`w-1/3 h-1/3 ${textColor}`} />
      <div className="text-sm sm:text-lg font-black text-white">{value}</div>
      <div className="text-[8px] sm:text-[10px] text-center text-white/60 leading-tight">
        {isAttack ? 'Danno' : 'Scudo'}
      </div>
    </div>
  );
};

interface UnitSlotProps {
  unit: UnitData | null;
  label: string;
  isEnemy: boolean;
}

const UnitSlot: React.FC<UnitSlotProps> = ({ unit, label, isEnemy }) => {
  const isMain = unit?.isMain;
  
  return (
    <div className={`
      relative flex-1 aspect-[3/4] max-w-[30%] border-2 rounded-lg flex flex-col items-center justify-center
      transition-colors duration-300
      ${isEnemy ? 'border-red-900/50 bg-red-950/20' : 'border-blue-900/50 bg-blue-950/20'}
      ${unit?.dead ? 'opacity-50 grayscale' : ''}
    `}>
      {/* Etichetta Zona */}
      <div className="absolute top-1 left-2 text-[10px] font-mono font-bold text-white/30">
        {label}
      </div>

      {unit ? (
        <>
          <div className={`mb-1 ${unit.dead ? 'text-gray-500' : (isEnemy ? 'text-red-500' : 'text-blue-400')}`}>
            {unit.dead ? <Skull className="w-8 h-8 sm:w-10 sm:h-10" /> : (isMain ? <Crown className="w-8 h-8 sm:w-10 sm:h-10" /> : <Shield className="w-6 h-6 sm:w-8 sm:h-8" />)}
          </div>
          
          {/* HP Bar */}
          {!unit.dead && (
            <div className="flex gap-0.5">
              {[...Array(unit.maxHp)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${i < unit.hp ? 'fill-red-600 text-red-600' : 'fill-gray-800 text-gray-800'}`}
                />
              ))}
            </div>
          )}
          
          <div className="mt-1 text-[10px] sm:text-xs text-center font-bold text-white/80 truncate w-full px-1">
            {unit.name}
          </div>
        </>
      ) : (
        <div className="text-white/10 text-[10px]">Vuoto</div>
      )}
    </div>
  );
};

interface PlayZoneSlotProps {
  card: CardData | null;
  onClick: () => void;
  label: string;
  isEnemy: boolean;
  highlight?: boolean;
}

const PlayZoneSlot: React.FC<PlayZoneSlotProps> = ({ card, onClick, label, isEnemy, highlight }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative flex-1 aspect-[3/4] max-w-[30%] border-2 border-dashed rounded-lg flex items-center justify-center transition-all p-1
        ${isEnemy 
          ? 'border-orange-600/30 bg-orange-900/10' 
          : (highlight ? 'border-green-400 bg-green-900/30 cursor-pointer animate-pulse' : 'border-green-600/30 bg-green-900/10')
        }
      `}
    >
      {card ? (
        <Card type={card.type} value={card.value} isHidden={isEnemy && !card.revealed} disabled={false} className="w-full h-full" />
      ) : (
        <div className="text-white/20 font-bold text-xs">{label}</div>
      )}
    </div>
  );
};

// --- LOGICA DI GIOCO ---
const generateDeck = (): CardData[] => {
  const deck: CardData[] = [];
  for (let i = 0; i < 8; i++) deck.push({ id: Math.random(), type: CARD_TYPES.ATTACK, value: 1 });
  for (let i = 0; i < 7; i++) deck.push({ id: Math.random(), type: CARD_TYPES.DEFENSE, value: 1 });
  return deck.sort(() => Math.random() - 0.5);
};

export default function TheDragonMustDie() {
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState<'planning' | 'resolving' | 'gameover'>('planning');
  const [logs, setLogs] = useState<string[]>(["Benvenuto. Proteggi l'Eroe."]);
  
  const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
  const [enemyDeck, setEnemyDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [enemyHand, setEnemyHand] = useState<CardData[]>([]);

  const [playerUnits, setPlayerUnits] = useState<(UnitData | null)[]>([null, { id: 'p-m', name: 'Eroe', hp: 3, maxHp: 3, dead: false, isMain: true }, null]);
  const [enemyUnits, setEnemyUnits] = useState<(UnitData | null)[]>([null, { id: 'e-m', name: 'Ragno', hp: 3, maxHp: 3, dead: false, isMain: true }, null]);

  const [playerZoneCards, setPlayerZoneCards] = useState<(CardData | null)[]>([null, null, null]);
  const [enemyZoneCards, setEnemyZoneCards] = useState<(CardData | null)[]>([null, null, null]);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 3)); // Mostra meno log su mobile

  useEffect(() => { initGame(); }, []);

  const initGame = () => {
    const pDeck = generateDeck();
    const eDeck = generateDeck();
    setPlayerDeck(pDeck.slice(5));
    setEnemyDeck(eDeck.slice(5));
    setPlayerHand(pDeck.slice(0, 5));
    setEnemyHand(eDeck.slice(0, 5));
    
    setPlayerUnits([null, { id: 'p-m', name: 'Eroe', hp: 3, maxHp: 3, dead: false, isMain: true }, null]);
    setEnemyUnits([null, { id: 'e-m', name: 'Ragno', hp: 3, maxHp: 3, dead: false, isMain: true }, null]);

    setPlayerZoneCards([null, null, null]);
    setEnemyZoneCards([null, null, null]);
    setPhase('planning');
    setTurn(1);
    setLogs(["Inizia la battaglia!"]);
  };

  const handleCardClick = (index: number) => {
    if (phase !== 'planning') return;
    setSelectedCardIdx(selectedCardIdx === index ? null : index);
  };

  const handleZoneClick = (zoneIndex: number) => {
    if (phase !== 'planning') return;

    if (playerZoneCards[zoneIndex]) {
      setPlayerHand([...playerHand, playerZoneCards[zoneIndex]!]);
      const newZones = [...playerZoneCards];
      newZones[zoneIndex] = null;
      setPlayerZoneCards(newZones);
      return;
    }

    if (selectedCardIdx !== null && !playerZoneCards[zoneIndex]) {
      const cardToPlay = playerHand[selectedCardIdx];
      setPlayerHand(playerHand.filter((_, i) => i !== selectedCardIdx));
      const newZones = [...playerZoneCards];
      newZones[zoneIndex] = cardToPlay;
      setPlayerZoneCards(newZones);
      setSelectedCardIdx(null);
    }
  };

  const findTargetUnitIndex = (attackerZoneIdx: number, targetUnits: (UnitData | null)[]) => {
    const isAlive = (idx: number) => {
        const unit = targetUnits[idx];
        return unit && !unit.dead;
    };
    let searchOrder: number[] = [];
    if (attackerZoneIdx === 0) searchOrder = [0, 1, 2];
    else if (attackerZoneIdx === 1) searchOrder = [1, 0, 2];
    else if (attackerZoneIdx === 2) searchOrder = [2, 1, 0];

    for (let idx of searchOrder) {
        if (isAlive(idx)) return idx;
    }
    return -1;
  };

  const handleEndTurnLogic = async () => {
    if (phase !== 'planning') return;
    setPhase('resolving');
    setSelectedCardIdx(null);

    // IA Aggressiva
    const cardsToPlayCount = Math.min(3, enemyHand.length);
    let newEnemyHand = [...enemyHand];
    let newEnemyZones: (CardData | null)[] = [null, null, null];
    const indices = [0, 1, 2];

    for (let i = 0; i < cardsToPlayCount; i++) {
        if (newEnemyHand.length === 0) break;
        const cardIdx = Math.floor(Math.random() * newEnemyHand.length);
        const card = newEnemyHand[cardIdx];
        const freeSlot = indices.find(idx => newEnemyZones[idx] === null);
        if (freeSlot !== undefined) {
            newEnemyZones[freeSlot] = { ...card, revealed: false };
            newEnemyHand.splice(cardIdx, 1);
        }
    }
    
    setEnemyHand(newEnemyHand);
    setEnemyZoneCards(newEnemyZones);

    await new Promise(r => setTimeout(r, 600));

    const revealedEnemyZones = newEnemyZones.map(c => c ? { ...c, revealed: true } : null);
    setEnemyZoneCards(revealedEnemyZones);
    
    await new Promise(r => setTimeout(r, 800));

    let tempPUnits = JSON.parse(JSON.stringify(playerUnits)) as (UnitData | null)[];
    let tempEUnits = JSON.parse(JSON.stringify(enemyUnits)) as (UnitData | null)[];
    
    for (let i = 0; i < 3; i++) {
        const pCard = playerZoneCards[i];
        const eCard = revealedEnemyZones[i];
        const zoneLabel = ZONES[i];

        if (!pCard && !eCard) continue;

        let logMsg = `Zona ${zoneLabel}: `;

        if (pCard?.type === CARD_TYPES.ATTACK && eCard?.type === CARD_TYPES.ATTACK) {
            logMsg += "Scontro!";
            const targetE = findTargetUnitIndex(i, tempEUnits);
            if (targetE !== -1 && tempEUnits[targetE]) {
                tempEUnits[targetE]!.hp -= pCard.value;
                if (tempEUnits[targetE]!.hp <= 0) tempEUnits[targetE]!.dead = true;
            }
            const targetP = findTargetUnitIndex(i, tempPUnits);
            if (targetP !== -1 && tempPUnits[targetP]) {
                tempPUnits[targetP]!.hp -= eCard.value;
                if (tempPUnits[targetP]!.hp <= 0) tempPUnits[targetP]!.dead = true;
            }
        }
        else if (pCard?.type === CARD_TYPES.ATTACK && eCard?.type === CARD_TYPES.DEFENSE) {
            const dmg = Math.max(0, pCard.value - eCard.value);
            logMsg += dmg > 0 ? `Danno parziale` : "Parato!";
            if (dmg > 0) {
                 const targetE = findTargetUnitIndex(i, tempEUnits);
                 if (targetE !== -1 && tempEUnits[targetE]) {
                    tempEUnits[targetE]!.hp -= dmg;
                    if (tempEUnits[targetE]!.hp <= 0) tempEUnits[targetE]!.dead = true;
                }
            }
        }
        else if (pCard?.type === CARD_TYPES.DEFENSE && eCard?.type === CARD_TYPES.ATTACK) {
             const dmg = Math.max(0, eCard.value - pCard.value);
             logMsg += dmg > 0 ? `Difesa rotta` : "Difeso!";
             if (dmg > 0) {
                const targetP = findTargetUnitIndex(i, tempPUnits);
                if (targetP !== -1 && tempPUnits[targetP]) {
                   tempPUnits[targetP]!.hp -= dmg;
                   if (tempPUnits[targetP]!.hp <= 0) tempPUnits[targetP]!.dead = true;
               }
           }
        }
        else if (pCard?.type === CARD_TYPES.ATTACK && !eCard) {
            logMsg += "Colpo diretto!";
            const targetE = findTargetUnitIndex(i, tempEUnits);
            if (targetE !== -1 && tempEUnits[targetE]) {
                tempEUnits[targetE]!.hp -= pCard.value;
                if (tempEUnits[targetE]!.hp <= 0) tempEUnits[targetE]!.dead = true;
            }
        }
        else if (!pCard && eCard?.type === CARD_TYPES.ATTACK) {
            logMsg += "Colpito!";
            const targetP = findTargetUnitIndex(i, tempPUnits);
            if (targetP !== -1 && tempPUnits[targetP]) {
                tempPUnits[targetP]!.hp -= eCard.value;
                if (tempPUnits[targetP]!.hp <= 0) tempPUnits[targetP]!.dead = true;
            }
        }

        setPlayerUnits([...tempPUnits]);
        setEnemyUnits([...tempEUnits]);
        addLog(logMsg);
        
        await new Promise(r => setTimeout(r, 600));
    }

    setPlayerZoneCards([null, null, null]);
    setEnemyZoneCards([null, null, null]);

    const playerDead = tempPUnits.find(u => u && u.isMain)?.dead;
    const enemyDead = tempEUnits.find(u => u && u.isMain)?.dead;

    if (playerDead && enemyDead) {
        setLogs(prev => ["PAREGGIO!", ...prev]);
        setPhase('gameover');
    } else if (playerDead) {
        setLogs(prev => ["HAI PERSO.", ...prev]);
        setPhase('gameover');
    } else if (enemyDead) {
        setLogs(prev => ["VITTORIA!", ...prev]);
        setPhase('gameover');
    } else {
        setTurn(t => t + 1);
        if (playerDeck.length > 0) {
            setPlayerDeck(prev => prev.slice(1));
            setPlayerHand(prev => [...prev, playerDeck[0]]);
        }
        if (enemyDeck.length > 0) { 
             setEnemyDeck(prev => prev.slice(1));
             setEnemyHand(prev => [...prev, enemyDeck[0]]);
        }
        setPhase('planning');
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-900 text-slate-100 font-sans flex flex-col overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="flex-none bg-slate-800/80 p-2 border-b border-slate-700 flex justify-between items-center z-10">
        <div className="text-lg font-black text-red-500 tracking-wider flex items-center gap-1">
          <Castle size={20} /> <span className="hidden sm:inline">THE DRAGON MUST DIE</span><span className="sm:hidden">TDMD</span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
           Turno: <span className="text-white font-bold">{turn}</span> | Deck: <span className="text-white">{playerDeck.length}</span>
        </div>
      </div>

      {/* --- GAME AREA (FLEX GROW) --- */}
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col relative bg-slate-950/50">
        
        {/* LOG OVERLAY */}
        <div className="absolute top-2 left-2 right-2 pointer-events-none z-50 flex flex-col items-center">
          {logs.map((log, i) => (
            <div key={i} className={`text-xs px-2 py-1 rounded mb-1 shadow-sm transition-opacity duration-500 ${i === 0 ? 'bg-black/70 text-white font-bold' : 'bg-black/40 text-gray-300 opacity-70'}`}>
              {log}
            </div>
          ))}
        </div>

        {/* 1. NEMICI */}
        <div className="flex-1 flex items-center justify-between px-2 sm:px-4 bg-red-950/10 border-b border-red-900/30">
             {enemyUnits.map((u, i) => (
               <UnitSlot key={i} unit={u} label={ZONES[i]} isEnemy={true} />
             ))}
        </div>

        {/* 2. ZONA NEMICA */}
        <div className="flex-1 flex items-center justify-between px-2 sm:px-4 bg-orange-950/10 border-b border-orange-900/20">
             {enemyZoneCards.map((card, i) => (
                <PlayZoneSlot key={i} card={card} label={ZONES[i]} isEnemy={true} onClick={() => {}} />
             ))}
        </div>

        {/* 3. BARRA AZIONI (CENTRALE) */}
        <div className="h-12 flex-none flex items-center justify-center bg-slate-900 border-y border-slate-700 z-20">
            {phase === 'planning' ? (
                <button 
                    onClick={handleEndTurnLogic}
                    className="bg-red-700 active:bg-red-800 text-white w-48 py-2 rounded-full font-bold shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider"
                >
                    COMBATTI <Sword size={16} />
                </button>
            ) : phase === 'gameover' ? (
                <button 
                    onClick={initGame}
                    className="bg-blue-600 active:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 text-xs sm:text-sm"
                >
                    NUOVA PARTITA <RefreshCw size={16} />
                </button>
            ) : (
                <div className="text-yellow-500 font-bold text-xs flex items-center gap-2 animate-pulse">
                    <RefreshCw className="animate-spin" size={14} /> COMBATTIMENTO...
                </div>
            )}
        </div>

        {/* 4. ZONA GIOCATORE */}
        <div className="flex-1 flex items-center justify-between px-2 sm:px-4 bg-emerald-950/10 border-t border-emerald-900/20">
            {playerZoneCards.map((card, i) => (
                <PlayZoneSlot 
                    key={i} card={card} label={ZONES[i]} isEnemy={false} 
                    highlight={selectedCardIdx !== null && !card}
                    onClick={() => handleZoneClick(i)} 
                />
             ))}
        </div>

        {/* 5. EROI */}
        <div className="flex-1 flex items-center justify-between px-2 sm:px-4 bg-blue-950/10 border-t border-blue-900/30">
             {playerUnits.map((u, i) => (
               <UnitSlot key={i} unit={u} label={ZONES[i]} isEnemy={false} />
             ))}
        </div>
      </div>

      {/* --- HAND (BOTTOM FIXED) --- */}
      <div className="flex-none h-28 sm:h-36 bg-slate-900 border-t-2 border-yellow-600/30 p-2 overflow-x-auto overflow-y-hidden">
        <div className="flex items-center justify-center gap-2 h-full min-w-full px-2">
            {playerHand.length === 0 && phase === 'planning' && (
                <div className="text-white/20 text-xs font-bold">Mano Vuota</div>
             )}
             {playerHand.map((card, i) => (
               <div key={card.id} className="flex-none w-16 h-24 sm:w-20 sm:h-28">
                  <Card 
                    type={card.type} 
                    value={card.value} 
                    isSelected={selectedCardIdx === i}
                    onClick={() => handleCardClick(i)}
                    disabled={phase !== 'planning'}
                    className="w-full h-full"
                  />
               </div>
             ))}
        </div>
      </div>

    </div>
  );
}