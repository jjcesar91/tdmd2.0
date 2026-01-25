import { useState, useEffect } from 'react';
import { Card as CardData, Hero } from './types';
import { useAudioManager } from './hooks/useAudioManager';
import { useRunState } from './hooks/useRunState';
import { useCombatState } from './hooks/useCombatState';
import { useDraftLogic } from './hooks/useDraftLogic';
import { useGameLoop } from './hooks/useGameLoop';
import { HeroDetailScreen } from './screens/HeroDetailScreen';
// Screens
import { IntroScreen } from './screens/IntroScreen';
import { StartScreen } from './screens/StartScreen';
import { HeroSelectionScreen } from './screens/HeroSelectionScreen';
import { LoadoutScreen } from './screens/LoadoutScreen';
import { MapScreen } from './screens/MapScreen';
import { CombatScreen } from './screens/CombatScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { GameOverScreen } from './screens/GameOverScreen';

// --- MAIN APP ---

export default function TheDragonMustDie() {
  const [view, setView] = useState<string>('START');
  
  // Custom Hooks
  const { 
    party, setParty, 
    partyLanes, setPartyLanes, 
    globalDeck, setGlobalDeck, 
    mapNode, setMapNode, 
    resetRun 
  } = useRunState();

  const { 
    combatState, setCombatState, 
    logs, setLogs, 
    addLog 
  } = useCombatState();
  
  // Custom Hook: Draft Logic
  const {
      selectedHeroes, heroLevels,
      handleHeroSelect, handleLevelChange, confirmHeroSelection,
       finalizeDraft, resetDraft
  } = useDraftLogic({ 
      setParty, setPartyLanes, setGlobalDeck, setMapNode, setView 
  });

  // Custom Hook: Game Loop
  const {
      provokeMode, setProvokeMode, enterCombat, handleZoneClick, handleEndTurn,
      handleProvokeClick, onCrusaderAction
  } = useGameLoop({
      combatState, setCombatState, party, partyLanes, globalDeck, setGlobalDeck,
      mapNode, setMapNode, addLog, setLogs, setView, setParty
  });
  
  // Modals & UI State
  const [showDeckModal, setShowDeckModal] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);
  const [heroDetailView, setHeroDetailView] = useState<Hero | null>(null);
  
  // Intro Sequence State
  const [introPhase, setIntroPhase] = useState<'STUDIO' | 'SPLASH' | 'NONE'>('STUDIO');
  const [showTapLabel, setShowTapLabel] = useState<boolean>(false);

  // Audio Hook
  const { playClick, startMusic } = useAudioManager(introPhase);

  useEffect(() => {
    if (introPhase === 'STUDIO') {
       const timer = setTimeout(() => setIntroPhase('SPLASH'), 3000);
       return () => clearTimeout(timer);
    }

    if (introPhase === 'SPLASH') {
       // Automatic transition disabled - wait for user tap
       const labelTimer = setTimeout(() => setShowTapLabel(true), 1000);
       
       return () => { 
         clearTimeout(labelTimer);
       };
    }
  }, [introPhase]);

  // Clear animation flags after animation completes
  useEffect(() => {
    if (view === 'COMBAT' && combatState?.newlyDrawnCards && combatState.newlyDrawnCards.size > 0) {
      const timer = setTimeout(() => {
        setCombatState(prev => prev ? { ...prev, newlyDrawnCards: new Set() } : prev);
      }, 600); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [view, combatState?.newlyDrawnCards]);

  // --- LOGIC FUNCTIONS (Unchanged logic) ---
  const startDraft = () => { 
    resetRun();
    resetDraft();
    setView('HERO_SELECTION'); 
  };

  // --- RENDERING ---

  if (introPhase !== 'NONE') {
    return (
      <IntroScreen 
        phase={introPhase as 'STUDIO' | 'SPLASH'} 
        onSplashClick={() => { playClick(); startMusic(); setIntroPhase('NONE'); }}
        showTapLabel={showTapLabel}
      />
    );
  }

  let mainContent;

  if (view === 'START') {
    mainContent = <StartScreen onStart={() => { playClick(); startMusic(); startDraft(); }} />;
  }

  else if (view === 'HERO_SELECTION') {
    mainContent = (
      <HeroSelectionScreen 
        selectedHeroes={selectedHeroes}
        onHeroSelect={handleHeroSelect}
        onNext={confirmHeroSelection}
        onBack={() => setView('START')}
        heroLevels={heroLevels}
        onLevelChange={handleLevelChange}
        setHeroDetailView={setHeroDetailView}
      />
    );
  }

  else if (view === 'LOADOUT') {
    mainContent = (
      <LoadoutScreen
        selectedHeroes={selectedHeroes}
        onBack={() => setView('HERO_SELECTION')}
        onStart={finalizeDraft}
      />
    );
  }

  else if (view === 'MAP') {
    mainContent = (
       <MapScreen 
         mapNode={mapNode}
         enterCombat={(type) => enterCombat(type)}
       />
     );
  }

  else if (view === 'COMBAT' && combatState) {
    mainContent = (
      <CombatScreen
        combatState={combatState}
        showDeckModal={showDeckModal}
        setShowDeckModal={setShowDeckModal}
        showDiscardModal={showDiscardModal}
        setShowDiscardModal={setShowDiscardModal}
        showLogs={showLogs}
        setShowLogs={setShowLogs}
        logs={logs}
        provokeMode={provokeMode}
        setProvokeMode={setProvokeMode}
        hoveredLane={hoveredLane}
        setHoveredLane={setHoveredLane}
        handleEndTurn={handleEndTurn}
        handleZoneClick={handleZoneClick}
        handleProvokeClick={handleProvokeClick}
        previewCard={previewCard}
        setPreviewCard={setPreviewCard}
        onCrusaderAction={onCrusaderAction}
        setCombatState={setCombatState}
        onRestart={() => enterCombat(mapNode === 4 ? 'boss' : 'normal')}
      />
    );
  }

  else if (view === 'VICTORY') {
    mainContent = <VictoryScreen onRestart={() => setView('START')} />;
  }

  else if (view === 'GAMEOVER' || view === 'GAME_OVER') {
    mainContent = <GameOverScreen onRestart={() => setView('START')} />;
  }

  else {
    mainContent = (
      <div className="w-full h-screen bg-black text-white flex items-center justify-center">
         <button onClick={() => setView('START')} className="px-6 py-2 border rounded">Reset Game</button>
      </div>
    );
  }

  return (
    <>
      {mainContent}
      {heroDetailView && (
        <HeroDetailScreen 
          hero={heroDetailView} 
          onClose={() => setHeroDetailView(null)} 
        />
      )}
    </>
  );
}