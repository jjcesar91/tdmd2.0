# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project Overview

**The Dragon Must Die (TDMD)** — a mobile-first, roguelike deck-building **lane
battler**. The player drafts a party of 3 heroes and fights through a 5-node
map to slay the Ancient Dragon. Combat happens across 3 lanes; each turn the
player plans card plays while the enemy AI plans its intents, then both sides
resolve simultaneously, lane by lane.

The game is a single-page React app. There is no backend, no persistence, and
no networking — all state lives in memory and resets on reload.

## Tech Stack

- **React 18** (functional components + hooks only; no class components)
- **TypeScript 5** in `strict` mode (`noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch` all on)
- **Vite 5** as dev server / bundler
- **Tailwind CSS 3** for all styling (utility classes; there is essentially no
  hand-written CSS beyond `src/index.css` and a couple of keyframes in
  `tailwind.config.js`)
- **lucide-react** for icons
- Assets (PNG images, MP3 audio) live under `src/assets/` and are imported as
  ES modules so Vite fingerprints them.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server (default http://localhost:5173)
npm run build     # type-check (tsc) then production build (vite build)
npm run lint      # eslint over ts/tsx, --max-warnings 0
npm run preview   # preview a production build
```

There is **no test suite** and **no configured test runner**. `npm run build`
is the closest thing to a correctness gate: it runs `tsc` in `--noEmit` mode,
so a green build means the types line up. Run it before considering a change
done. `npm run lint` enforces zero warnings — unused variables/params will fail
both `tsc` and lint, so clean them up.

## Architecture

The codebase deliberately separates **pure game logic** (the "engine") from
**React state management** (hooks) from **presentation** (screens/components).

```
src/
  App.tsx              Root component. A view state machine ("START" | "MAP" |
                       "COMBAT" | ...). Wires the hooks together and picks which
                       screen to render. Owns modal/UI-only state.
  main.tsx             ReactDOM entrypoint (StrictMode).
  index.css            Tailwind directives + minimal globals.

  types/index.ts       ALL shared types. Card, Unit, Hero, CombatState,
                       CardEffect, Buffs, etc. Start here to understand the
                       data model.

  data/index.ts        Static game database (no logic): HEROES_DB, POTIONS_DB,
                       ENEMIES_DB, KEYWORDS glossary, ZONES. Also imports every
                       hero/card/potion image asset.

  engine/              PURE functions. No React, no hooks, no side effects on
                       shared state — they take state in and return new state.
    CombatResolver.ts     resolveLane() + applyRoundBuffs(). The heart of
                          combat: damage, gray HP, tanking, vulnerable, detain,
                          recoil, targeting/redirection. Resolves ONE lane.
    CardEffectSystem.ts   processCardEffect(): what happens when the player
                          plays a FAST/instant card (potions, heals, crafting,
                          scry/reveal, blood oath, merged potions).
    EnemyLogic.ts         getEnemyDecision(): per-enemy AI that picks a card +
                          lane each turn (frog-tribe behaviors, default attack).
    EnemyAI.ts            generateEnemyCard()/generateProvokedAttack(): builds
                          enemy cards by deckType.
    EncounterGenerator.ts generateEncounter(): places enemy Units into lanes
                          for each encounter type / the boss.

  hooks/               Stateful React logic. These own useState and glue the
                       engine to the UI.
    useGameLoop.ts        THE orchestrator (~700 lines). enterCombat, the
                          turn/draw/resolve loop (handleEndTurn), zone clicks,
                          Crusader provoke, selection modals, victory checks.
    useCombatState.ts     combatState + combat logs.
    useRunState.ts        Run-scoped state: party, lanes, globalDeck, mapNode.
    useDraftLogic.ts      Hero selection, leveling, and building the deck.
    useAudioManager.ts    Theme music + click SFX.

  screens/             Full-screen views, one per app state. Presentational;
                       they receive data + callbacks as props from App.tsx.
                       (IntroScreen, StartScreen, HeroSelectionScreen,
                       LoadoutScreen, MapScreen, CombatScreen, VictoryScreen,
                       GameOverScreen, HeroDetailScreen).

  components/          Reusable UI pieces (Card, BattleLane, UnitPortrait,
                       StatBadge, and the *Modal components).
```

### Data flow

`App.tsx` is the top of a unidirectional flow:

1. `App` calls the hooks (`useRunState`, `useCombatState`, `useDraftLogic`,
   `useGameLoop`) and holds the `view` string.
2. Hooks own state and expose setters + action callbacks.
3. `App` renders exactly one screen based on `view`, passing state down and
   callbacks up. Screens/components never import the engine or mutate global
   state directly — they call the callbacks they were handed.
4. Action callbacks (mostly in `useGameLoop`) invoke the **pure engine**
   functions, then commit the returned state via `setCombatState`.

Keep this separation intact when adding features: **game rules go in `engine/`
as pure functions; state wiring goes in `hooks/`; rendering goes in
`screens/`+`components/`.** Do not put combat math in a component.

## Game Model (domain concepts)

Understanding these makes the code readable:

- **Lanes**: exactly 3, indexed `0 = Front (F)`, `1 = Mid (M)`, `2 = Rear (R)`.
  `ZONES = ['F','M','R']`. Player and enemy each have a unit slot and a played-
  card slot per lane. Slots are `(Unit | null)[]` / `(Card | null)[]` of
  length 3 — a `null` means empty/dead.
- **Turn structure**: `phase: 'planning' | 'resolving'`. In planning the player
  draws 5 cards and places them; the enemy AI simultaneously plans face-down
  intents. On End Turn, lanes resolve **in order F → M → R** (index 0,1,2) with
  animation delays. Enemy decisions are also made in F→M→R order so later
  frogs can react to earlier ones.
- **Card `effects`**: cards carry a structured `effects: CardEffect[]` array
  (`{ type, amount, target, ... }`). This replaced an older single-string
  `effect` field — do NOT reintroduce a string effect. Some unique mechanics
  are still dispatched by **card `id`** (e.g. `pot_heal`, `c_foresee`,
  `c_omen`, `c_epiphany`) rather than by effect type; see
  `CardEffectSystem.ts`.
- **Speed**: `NORMAL` cards sit in the lane and resolve on End Turn; `FAST`
  cards (most potions, some signatures) resolve immediately when played and go
  to discard. A `HASTE` lane effect makes the next card there act FAST.
- **Gray HP**: temporary shield HP that absorbs damage before real HP. Reset
  each turn (with passives like Crusader's Stalwart / Bullyfrog re-granting it).
- **Key keywords** (full glossary in `data/index.ts` `KEYWORDS`): Immune, Tank
  (redirects attacks), Vulnerable (+2 dmg taken), Detain (card can't resolve
  for X turns), Augment (+attack), Bond (effect hits the owner even if played
  in another lane), AoE, Persist/Persistent, Volatile, Recoil, Craft/Merge.
- **Heroes**: 4 are playable (`crusader`, `ranger`, `prophet`, `alchemist`);
  the rest of `HEROES_DB` are `locked: true` placeholders with no cards. Each
  has an archetype (KINGDOM/VENGEANCE/BALANCE/POWER), a passive, 3 cards
  (BASIC/SIGNATURE/ULTIMATE), and a level 1–5 that gates/upgrades abilities.
- **Deck building**: in `useDraftLogic.finalizeDraft`, each hero contributes
  6× BASIC, 3× SIGNATURE, 1× ULTIMATE copies into the `globalDeck`.
- **Map**: 5 nodes, `mapNode` 0→4. Node 0 is the fixed frog tribe encounter;
  node 4 is the boss (Ancient Dragon + 2 Void Mages). Others are random from 8
  hand-designed encounters in `EncounterGenerator`.

## Conventions

- **Mobile portrait layout.** Screens render a fixed `9/16` aspect frame
  (`max-w-[56.25vh] aspect-[9/16]`) centered on a dark background. Match this
  when adding screens.
- **Styling is Tailwind-only.** Dark, stone/amber fantasy palette
  (`bg-stone-950`, `border-stone-700`, `text-amber-*`), `font-serif`. Reuse
  existing color/border tokens; don't add CSS files.
- **Immutability.** Always update state with new objects/arrays (spread,
  `.map`, `.filter`). The engine deep-copies units before mutating locally and
  returns fresh arrays. React updates use functional `setState(prev => ...)`.
- **Engine purity.** Functions in `engine/` must not touch React state, DOM,
  audio, or `setCombatState`. They take the pieces of state they need and
  return results; the calling hook commits them.
- **Randomness** uses `Math.random()` directly (deck shuffles, AI rolls, uids).
  There is no seeded RNG — runs are non-deterministic.
- **`uid`** is a random number stamped on card instances (`Math.random()`) used
  to track/animate individual copies. Don't rely on it being unique across all
  cards forever, but it's the de-facto instance key.
- **TypeScript strictness.** Unused locals/params are hard errors. Prefer
  precise types from `types/index.ts` over `any` (the codebase has a few `any`
  escape hatches in the AI/game loop — avoid adding more).

## Gotchas & Known Rough Edges

- **`CardEffectSystem.ts` is the messiest file.** It contains long stream-of-
  consciousness comments from an earlier refactor (migrating away from the
  string `effect` field) and dispatches several mechanics by hard-coded card
  `id`. When touching it, prefer resolving effects through the `effects` array
  and `resolveLane`; only fall back to id-checks the way the existing unique
  cards (`c_foresee`, `c_omen`, `c_epiphany`) do.
- **`useGameLoop.handleEndTurn` is large and closure-sensitive.** It reads
  `combatState` from the hook closure while doing async, awaited, step-by-step
  lane resolution with `setTimeout` delays. Be careful: it mutates local copies
  of units/zones across the loop and commits intermediate `setCombatState`
  updates for animation. Don't assume `combatState` reflects mid-loop mutations.
- **Enemy vs. player card handling differ.** Enemy "cards" are generated on the
  fly and placed straight into `enemyZoneCards`; they are not part of any draw/
  discard pile. Never push enemy cards into the player's discard pile (there are
  explicit fixes guarding this, e.g. in provoke logic).
- **Locked heroes have empty `cards: []`** — selecting one would produce no
  deck contribution. UI gates this; keep it gated if you add hero-picking paths.
- **View string has a duplicate.** `App.tsx` handles both `'GAMEOVER'` and
  `'GAME_OVER'` for the game-over screen. Prefer `'GAMEOVER'`.

## Git Workflow

- Feature branches; commit messages in this repo are short, lowercase,
  descriptive summaries (e.g. `alchemist rework`, `fix detain logic and
  resolving`, `lone ranger passive and reveal fix`).
- Do not commit build output (`dist/`) or `node_modules/` (both gitignored).
- Only open a pull request when explicitly asked.
