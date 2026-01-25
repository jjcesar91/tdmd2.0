import React from 'react';
import { Sword, Trash2, Layers, Eye, X, Target, Swords, RefreshCw } from 'lucide-react';
import { Card } from '../components/Card';
import { CardPreviewModal } from '../components/CardPreviewModal';
import { BattleLane } from '../components/BattleLane';
import { CombatState, Card as CardData, Unit } from '../types';
import { ZONES } from '../data';

interface CombatScreenProps {
  combatState: CombatState;
  showDeckModal: boolean;
  setShowDeckModal: (show: boolean) => void;
  showDiscardModal: boolean;
  setShowDiscardModal: (show: boolean) => void;
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
  logs: string[];
  provokeMode: boolean;
  setProvokeMode: (mode: boolean) => void;
  hoveredLane: number | null;
  setHoveredLane: (lane: number | null) => void;
  handleEndTurn: () => void;
  handleZoneClick: (laneIdx: number) => void;
  handleProvokeClick: (laneIdx: number) => void;
  previewCard: CardData | null;
  setPreviewCard: (card: CardData | null) => void;
  onCrusaderAction?: () => void;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState | null>>;
}

export const CombatScreen: React.FC<CombatScreenProps> = ({
  combatState,
  showDeckModal,
  setShowDeckModal,
  showDiscardModal,
  setShowDiscardModal,
  showLogs,
  setShowLogs,
  logs,
  provokeMode,
  setProvokeMode,
  hoveredLane,
  setHoveredLane,
  handleEndTurn,
  handleZoneClick,
  handleProvokeClick,
  previewCard,
  setPreviewCard,
  onCrusaderAction,
  setCombatState
}) => {
  const { turn, phase, playerHand, playerZoneCards, enemyZoneCards, playerUnits, enemyUnits, selectedCardIdx, drawPile, discardPile, resolvingLane } = combatState;
  const isPlayerTurn = phase === 'planning';

  return (
    <div className="w-full h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-sans">
      <div className="relative h-full w-full max-w-[56.25vh] aspect-[9/16] bg-stone-900 border-4 border-stone-800 flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        
        {/* TOP BAR */}
        <div className="flex-none bg-stone-950 border-b border-stone-800 p-2 flex justify-between items-center z-20 shadow-md h-12">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-900/20 border border-red-900/50 flex items-center justify-center">
                 <Sword size={16} className="text-red-500" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Turn</span>
                 <span className="text-sm font-black text-stone-200 leading-none">{turn}</span>
              </div>
           </div>
           
           {/* Deck Controls */}
           <div className="flex gap-2">
              <button onClick={() => setShowDiscardModal(true)} className="flex flex-col items-center justify-center w-10 h-8 rounded bg-stone-800 border border-stone-700 hover:border-stone-500 transition-colors">
                 <Trash2 size={12} className="text-stone-400" />
                 <span className="text-[8px] font-bold text-stone-500">{discardPile.length}</span>
              </button>
              <button onClick={() => setShowDeckModal(true)} className="flex flex-col items-center justify-center w-10 h-8 rounded bg-stone-800 border border-stone-700 hover:border-stone-500 transition-colors">
                 <Layers size={12} className="text-sky-500" />
                 <span className="text-[8px] font-bold text-sky-700">{drawPile.length}</span>
              </button>
              <button 
                onClick={() => setShowLogs(!showLogs)}
                className="relative flex flex-col items-center justify-center w-10 h-8 rounded bg-stone-800 border border-stone-700 hover:border-amber-500 transition-colors"
              >
                <Eye size={12} className="text-amber-500" />
                <span className="text-[8px] font-bold text-amber-700">{logs.length}</span>
                {logs.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-red-800 rounded-full animate-pulse" />
                )}
              </button>
           </div>
        </div>

        {/* PROVOKE MODE BANNER */}
        {provokeMode && (
          <div className="absolute top-12 left-0 right-0 z-50 bg-amber-900/95 border-y-2 border-amber-500 shadow-2xl backdrop-blur-md py-2 px-4 flex justify-between items-center animate-pulse">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-amber-200" />
              <span className="text-sm font-bold text-amber-100 uppercase tracking-wider">Provoke Mode: Select Enemy Card</span>
            </div>
            <button 
              onClick={() => setProvokeMode(false)}
              className="px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-xs font-bold text-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* LOG PANEL */}
        {showLogs && (
          <div className="absolute top-14 right-2 z-50 w-64 max-h-96 bg-stone-900/95 border-2 border-stone-700 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="p-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Battle Log</h3>
              <button onClick={() => setShowLogs(false)}>
                <X size={16} className="text-stone-500 hover:text-stone-200" />
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center text-stone-600 text-xs italic py-4">No events yet</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`px-3 py-2 rounded border text-[10px] font-bold uppercase tracking-wide ${i===0 ? 'bg-amber-900/20 border-amber-900/50 text-amber-100' : 'bg-stone-950/50 border-stone-800 text-stone-400'}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BATTLEFIELD - 3 LANES */}
        <div className="flex-1 flex min-h-0 bg-stone-900 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] relative">
           {/* CENTER ACTION BUTTON */}
           <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
              <button 
                onClick={handleEndTurn}
                disabled={!isPlayerTurn}
                className={`pointer-events-auto w-12 h-12 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all active:scale-90
                  ${isPlayerTurn 
                    ? 'bg-red-900 border-red-700 text-stone-100 hover:bg-red-800 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse' 
                    : 'bg-stone-800 border-stone-700 text-stone-600 cursor-not-allowed'}
                `}
              >
                {isPlayerTurn ? <Swords size={20} /> : <RefreshCw size={20} className="animate-spin" />}
              </button>
           </div>

           {(() => {
              const selectedCard = selectedCardIdx !== null ? playerHand[selectedCardIdx] : null;
              
              // Calculate target lane once for hovered lane
              let calculatedTargetLane: number | null = null;
              let calculatedDefenseLane: number | null = null;
              
              if (hoveredLane !== null && selectedCard && !selectedCard.isPotion) {
                  calculatedTargetLane = hoveredLane;
                  
                  // Check if card has Tank/Defense effects that protect adjacent/all lanes
                  if (selectedCard.effect === 'TANK_ALL') {
                      // TANK_ALL: Show defense arrow on all lanes (we'll show arrows on all)
                      // For simplicity, we'll handle this in the render loop
                  } else if (selectedCard.effect === 'TANK_RIGHT' || selectedCard.effect === 'ATTACK_DEF_RIGHT') {
                      // Show defense arrow on the lane to the right (hoveredLane + 1)
                      if (hoveredLane < 2) {
                          calculatedDefenseLane = hoveredLane + 1;
                      }
                  }
                  
                  // Use same logic as damage resolution
                  if (!enemyUnits[hoveredLane] || enemyUnits[hoveredLane]!.dead) {
                      // Priority 1: Left adjacent
                      if (hoveredLane > 0 && enemyUnits[hoveredLane-1] && !enemyUnits[hoveredLane-1]!.dead) {
                          calculatedTargetLane = hoveredLane - 1;
                      }
                      // Priority 2: Right adjacent
                      else if (hoveredLane < 2 && enemyUnits[hoveredLane+1] && !enemyUnits[hoveredLane+1]!.dead) {
                          calculatedTargetLane = hoveredLane + 1;
                      }
                      // Priority 3: Farthest alive enemy
                      else {
                          const candidates = [0,1,2].filter(idx => enemyUnits[idx] && !enemyUnits[idx]!.dead);
                          if (candidates.length > 0) {
                              calculatedTargetLane = candidates.reduce((farthest, current) => 
                                  Math.abs(current - hoveredLane) > Math.abs(farthest - hoveredLane) ? current : farthest
                              );
                          }
                      }
                  }
              }

              return [0, 1, 2].map(laneIdx => {
                  // Highlight logic with Range
                  const pUnit = playerUnits[laneIdx];
                  const cardOwner = playerUnits.find((u: Unit | null) => u && u.id === selectedCard?.ownerId);
                  const ownerIdx = playerUnits.indexOf(cardOwner!);
                  
                  let isValidTarget = false;
                  if (selectedCard) {
                      if (selectedCard.isPotion) {
                          isValidTarget = !!pUnit;
                      } else if (cardOwner) {
                          const dist = Math.abs(laneIdx - ownerIdx);
                          const range = selectedCard.range || 0;
                          isValidTarget = dist <= range;
                      }
                  }
                  
                  // Check if this lane should show defense arrow
                  let shouldShowDefenseArrow = false;
                  if (hoveredLane !== null && selectedCard && !selectedCard.isPotion) {
                      if (selectedCard.effect === 'TANK_ALL') {
                          // TANK_ALL: Show defense arrow on all lanes except the hovered one
                          shouldShowDefenseArrow = laneIdx !== hoveredLane;
                      } else {
                          // TANK_RIGHT: Show arrow on calculated defense lane
                          shouldShowDefenseArrow = calculatedDefenseLane === laneIdx;
                      }
                  }
                  
                  return (
                    <BattleLane 
                       key={laneIdx}
                       zoneLabel={ZONES[laneIdx]}
                       enemyUnit={enemyUnits[laneIdx]}
                       playerUnit={playerUnits[laneIdx]}
                       enemyCard={enemyZoneCards[laneIdx]}
                       playerCard={playerZoneCards[laneIdx]}
                       onPlayerSlotClick={() => { handleZoneClick(laneIdx); setHoveredLane(null); }}
                       onEnemyCardClick={() => handleProvokeClick(laneIdx)}
                       isSelected={false}
                       isValidTarget={isValidTarget}
                       onPreviewStart={setPreviewCard}
                       onPreviewEnd={() => setPreviewCard(null)}
                       onCrusaderAction={onCrusaderAction}
                       showTargetArrow={calculatedTargetLane === laneIdx && hoveredLane !== null}
                       showDefenseArrow={shouldShowDefenseArrow}
                       onLaneHover={() => setHoveredLane(laneIdx)}
                       onLaneLeave={() => setHoveredLane(null)}
                       isResolving={resolvingLane === laneIdx}
                       provokeMode={provokeMode}
                    />
                  );
              });
           })()}
        </div>

        {/* PLAYER HAND AREA */}
        <div className="flex-none h-[15%] bg-stone-950 border-t border-stone-800 flex flex-col relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           {/* Cards Fan Layout */}
           <div className="flex-1 relative flex items-end justify-center pb-2 overflow-visible px-4">
              {playerHand.length === 0 && <div className="w-full text-center text-[10px] text-stone-600 font-bold uppercase tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">No Cards Available</div>}
              <div className="relative h-full w-full max-w-full">
                {playerHand.map((card: CardData, i: number) => {
                  const totalCards = playerHand.length;
                  const centerIndex = (totalCards - 1) / 2;
                  const offset = i - centerIndex;
                  const rotation = offset * 2; // Cards lean outward
                  const cardSpacing = Math.max(30, Math.min(60, 400 / totalCards)); // Dynamic spacing based on card count
                  const translateX = offset * cardSpacing; // Overlapping cards with dynamic spacing
                  const translateY = Math.abs(offset) * 5; // Subtle concave curve
                  const isNewlyDrawn = combatState?.newlyDrawnCards?.has(card.uid || i) || false;
                  
                  return (
                    <div 
                      key={card.uid || i} 
                      className="absolute -bottom-10 left-1/2 transition-all duration-300 ease-out"
                      style={{
                        transform: `translateX(calc(-50% + ${translateX}px)) translateY(${translateY}px) rotate(${rotation}deg)`,
                        zIndex: selectedCardIdx === i ? 50 : 10 + i,
                        transformOrigin: 'bottom center'
                      }}
                    >
                      <div 
                        className={`aspect-[2/3] h-[140px] transition-transform duration-300 ${
                          selectedCardIdx === i ? 'scale-110 -translate-y-4' : 'hover:scale-105 hover:-translate-y-2'
                        } ${isNewlyDrawn ? 'animate-[flipIn_0.6s_ease-out]' : ''}`}
                        style={{ cursor: isPlayerTurn ? 'pointer' : 'not-allowed' }}
                      >
                        <Card 
                          {...card}
                          isSelected={selectedCardIdx === i}
                          onClick={() => { if (isPlayerTurn) setCombatState(p => ({...p!, selectedCardIdx: p!.selectedCardIdx === i ? null : i})); }}
                          disabled={!isPlayerTurn}
                          onPreviewStart={() => setPreviewCard(card)}
                          onPreviewEnd={() => setPreviewCard(null)}
                          className="w-full h-full text-[10px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
        </div>

        {/* CARD PREVIEW OVERLAY */}
        {previewCard && (
           <CardPreviewModal card={previewCard} interactive={false} />
        )}

        {/* MODALS */}
        {(showDeckModal || showDiscardModal) && (
          <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
            <div className="bg-stone-900 border-2 border-stone-700 rounded-xl w-full h-[70%] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                 <h3 className="font-bold text-stone-200 flex items-center gap-2 uppercase tracking-wider text-xs">
                   {showDeckModal ? <><Layers size={14}/> Draw Pile</> : <><Trash2 size={14}/> Discard Pile</>}
                 </h3>
                 <button onClick={()=>{setShowDeckModal(false);setShowDiscardModal(false)}}><X size={20} className="text-stone-500 hover:text-stone-200"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2 content-start bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                 {(showDeckModal ? drawPile : discardPile).map((c: CardData, i: number) => (
                    <div key={i} className="aspect-[2/3]"><Card {...c} smallMode disabled className="w-full h-full text-[8px]" /></div>
                 ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
