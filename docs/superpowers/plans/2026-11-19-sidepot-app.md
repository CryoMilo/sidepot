# SidePot WebRTC Chip Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-backend, accountless, mobile-first chip ledger and Shan Koe Mee payout app deployed to Netlify with real-time peer-to-peer WebRTC sync, cute fluffy golden jar animations, draggable chips, and tactile audio.

**Architecture:** A static React + Vite client using PeerJS (WebRTC data channels) for instant zero-database multi-device synchronization. The table host's phone acts as the authoritative state machine persisting snapshots to `localStorage`, while player phones connect directly via 4-character room codes or QR codes.

**Tech Stack:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide React (zero emojis), PeerJS, Web Audio API, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-19-sidepot-design.md](file:///Users/damianaung/Code/sidepot/docs/superpowers/specs/2026-11-19-sidepot-design.md)

## Global Constraints
- Deploy target: 100% static hosting on Netlify.
- Backend/DB: Zero external databases, zero persistent backend servers.
- Icons: Clean SVG vector icons only (`lucide-react`); zero unicode emojis anywhere in project.
- Visual Theme: Fluffy creamy light theme (`#FFFDF9` to `#FFF2D5`), fluffy shiny Golden Jar (no honey), dynamic facial expressions reflecting player's chip count.
- Networking: Pure peer-to-peer WebRTC data channels via PeerJS with custom room code prefixing (`sidepot-`).

## Review Focus
1. PeerJS signaling failure or collision: Host tries to register an already taken 4-character room code; app must catch the collision and automatically regenerate or append a fallback suffix without crashing.
2. Banker role rotation: When the host assigns the Banker role to a non-host player, the state machine must accurately restrict resolution controls to that active banker while maintaining the host's authoritative network sync.
3. Player disconnections / tab suspension: Mobile Safari or Chrome puts tabs to sleep when locked; client reconnects automatically via PeerJS and requests latest full state sync from host.
4. Shan Koe Mee payout edge cases: Multiple players win 2x Shan or 3x Mee in the same round, exceeding the banker's current bankroll; the system must alert the banker and support an instant "Banker Rebuy / Top-Up" to keep the ledger balanced.
5. End of night settlement: Sum of all net profits and losses across every player must equal exactly zero (zero-sum invariant).

---

### Task 1: Project Scaffolding & Setup

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Test: `vitest.config.ts`, `src/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: Runnable Vite build and test suite with Tailwind, Framer Motion, and Lucide React.

- [ ] **Step 1: Initialize project configuration & dependencies**
  - Install dependencies: `react`, `react-dom`, `framer-motion`, `lucide-react`, `peerjs`, `qrcode.react`, `canvas-confetti`.
  - Install devDependencies: `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `vitest`, `@testing-library/react`.

- [ ] **Step 2: Write failing sanity test in `src/__tests__/sanity.test.ts`**
  ```ts
  import { describe, it, expect } from 'vitest';
  describe('Environment Sanity', () => {
    it('verifies test environment is active', () => {
      expect(true).toBe(true);
    });
  });
  ```

- [ ] **Step 3: Run test to verify test runner works**
  Run: `npx vitest run src/__tests__/sanity.test.ts`
  Expected: PASS

- [ ] **Step 4: Configure Tailwind CSS for creamy fluffy palette**
  Configure colors in `tailwind.config.js`:
  - `creamy-bg-start`: `#FFFDF9`
  - `creamy-bg-end`: `#FFF2D5`
  - `creamy-border`: `#FFE4A0`
  - `jar-gold-start`: `#FEF08A`
  - `jar-gold-end`: `#D97706`

- [ ] **Step 5: Commit scaffolding**
  ```bash
  git add package.json vite.config.ts tsconfig.json tailwind.config.js postcss.config.js index.html src/ vitest.config.ts
  git commit -m "chore: scaffold Vite React project with Tailwind and Vitest"
  ```

---

### Task 2: Sound Synthesizer & Tactile Audio Engine

**Files:**
- Create: `src/utils/audio.ts`
- Test: `src/__tests__/audio.test.ts`

**Interfaces:**
- Produces: `playSound(type: 'pop' | 'clink' | 'win' | 'collect' | 'error'): void`

- [ ] **Step 1: Write test for Web Audio helper in `src/__tests__/audio.test.ts`**
  ```ts
  import { describe, it, expect, vi } from 'vitest';
  import { playSound } from '../utils/audio';

  describe('Audio Engine', () => {
    it('safely handles environments without Web Audio API or user gesture', () => {
      expect(() => playSound('pop')).not.toThrow();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it passes in headless environment**
  Run: `npx vitest run src/__tests__/audio.test.ts`

- [ ] **Step 3: Implement Web Audio synthesis in `src/utils/audio.ts`**
  - Implement synthesized frequencies:
    - `'pop'`: 320Hz ramped to 780Hz (sine, 0.12s)
    - `'clink'`: 880Hz to 1400Hz (triangle, 0.2s)
    - `'win'`: Arpeggio C5 (523Hz), E5 (659Hz), G5 (784Hz) (sine, 0.35s)
    - `'collect'`: 440Hz downward sweep (sine, 0.15s)
  - Ensure graceful try/catch and lazy AudioContext initialization.

- [ ] **Step 4: Commit audio engine**
  ```bash
  git add src/utils/audio.ts src/__tests__/audio.test.ts
  git commit -m "feat: implement Web Audio sound synthesizer for tactile feedback"
  ```

---

### Task 3: Game Ledger & Shan Koe Mee State Machine

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/gameEngine.ts`
- Test: `src/__tests__/gameEngine.test.ts`

**Interfaces:**
- Produces:
  - `createInitialTable(roomId: string, hostName: string, buyIn: number): TableState`
  - `addPlayer(state: TableState, playerId: string, name: string): TableState`
  - `placeBet(state: TableState, playerId: string, amount: number): TableState`
  - `resolvePlayerBet(state: TableState, playerId: string, outcome: 'WIN_1X' | 'SHAN_2X' | 'MEE_3X' | 'COLLECT' | 'PUSH'): TableState`
  - `rotateBanker(state: TableState, newBankerId: string): TableState`
  - `verifyZeroSum(state: TableState): { balanced: boolean; netDiscrepancy: number }`

- [ ] **Step 1: Define TypeScript schemas in `src/types/index.ts`**
  ```ts
  export interface Player {
    id: string;
    name: string;
    avatarColor: string;
    chips: number;
    currentBet: number;
    isBanker: boolean;
    isConnected: boolean;
    totalBuyIn: number;
  }

  export interface TableState {
    roomId: string;
    hostId: string;
    bankerId: string;
    roundNumber: number;
    pot: number;
    defaultBuyIn: number;
    players: Record<string, Player>;
    phase: 'BETTING' | 'DEALING' | 'RESOLVING' | 'ROUND_SUMMARY';
    lastSettlement?: Record<string, number>;
  }
  ```

- [ ] **Step 2: Write tests in `src/__tests__/gameEngine.test.ts`**
  - Test bet placing and balance deduction.
  - Test `resolvePlayerBet`:
    - `WIN_1X`: Player receives `bet * 2` (bet back + 1x from banker).
    - `SHAN_2X`: Player receives `bet * 3` (bet back + 2x from banker).
    - `MEE_3X`: Player receives `bet * 4` (bet back + 3x from banker).
    - `COLLECT`: Banker gains player's bet; player receives 0.
  - Test `verifyZeroSum` ensuring total chips equals initial buy-ins across table.

- [ ] **Step 3: Run test to verify it fails**
  Run: `npx vitest run src/__tests__/gameEngine.test.ts`
  Expected: FAIL (functions not yet implemented)

- [ ] **Step 4: Implement pure state reducer functions in `src/utils/gameEngine.ts`**

- [ ] **Step 5: Run tests to verify all game logic passes**
  Run: `npx vitest run src/__tests__/gameEngine.test.ts`
  Expected: PASS

- [ ] **Step 6: Commit game engine**
  ```bash
  git add src/types/index.ts src/utils/gameEngine.ts src/__tests__/gameEngine.test.ts
  git commit -m "feat: implement Shan Koe Mee ledger and zero-sum state machine"
  ```

---

### Task 4: PeerJS P2P Networking & State Synchronization

**Files:**
- Create: `src/services/peerService.ts`
- Test: `src/__tests__/peerService.test.ts`

**Interfaces:**
- Produces:
  - `initHostPeer(roomCode: string, onClientJoin: (peerId: string) => void, onMessage: (msg: any) => void): Promise<Peer>`
  - `initClientPeer(roomCode: string, onStateUpdate: (state: TableState) => void): Promise<Peer>`
  - `broadcastState(connections: DataConnection[], state: TableState): void`
  - `sendActionToHost(connection: DataConnection, action: any): void`

- [ ] **Step 1: Write peerService message contract tests**
  - Verify message serialization / deserialization.
  - Verify room code formatting (`sidepot-XXXX`).

- [ ] **Step 2: Implement `src/services/peerService.ts`**
  - Host peer creation with error handling for existing room codes.
  - Client peer connection with exponential backoff retry.
  - Heartbeat ping to detect client drops and auto-reconnect.
  - `localStorage` sync backup for host: `sidepot_saved_state`.

- [ ] **Step 3: Run peer service tests**
  Run: `npx vitest run src/__tests__/peerService.test.ts`
  Expected: PASS

- [ ] **Step 4: Commit peer networking service**
  ```bash
  git add src/services/peerService.ts src/__tests__/peerService.test.ts
  git commit -m "feat: implement WebRTC peer connection manager with PeerJS"
  ```

---

### Task 5: Golden Jar Component with Dynamic Mood Expressions

**Files:**
- Create: `src/components/GoldenJar.tsx`
- Test: `src/__tests__/GoldenJar.test.ts`

**Interfaces:**
- Consumes: `playerChips: number`, `potTotal: number`, `isDancing: boolean`
- Produces: Interactive Golden Jar SVG with dynamic SVG expressions and bounce animation.

- [ ] **Step 1: Write mood expression unit tests**
  - Test `< 1,500` returns `worried` expression.
  - Test `1,500 - 6,000` returns `confident` expression.
  - Test `> 6,000` returns `ecstatic` expression.

- [ ] **Step 2: Implement `src/components/GoldenJar.tsx`**
  - Shiny golden jar SVG with cloud-like fluffy lid and gold handles (no honey).
  - SVG facial features:
    - Worried: Quivering mouth, sweat drop, nervous brows.
    - Confident: Smiling eyes, rosy cheeks, open smile.
    - Ecstatic: Star eyes, laughing grin, tiny gold crown over brow.
  - Squash-and-stretch CSS / Framer Motion dance animation when triggered.

- [ ] **Step 3: Commit Golden Jar component**
  ```bash
  git add src/components/GoldenJar.tsx src/__tests__/GoldenJar.test.ts
  git commit -m "feat: create Golden Jar component with reactive mood expressions"
  ```

---

### Task 6: Draggable Token Chips & Player Wallet Deck

**Files:**
- Create: `src/components/DraggableChip.tsx`
- Create: `src/components/WalletDeck.tsx`
- Test: `src/__tests__/WalletDeck.test.ts`

**Interfaces:**
- Consumes: `chips: number`, `onBet: (amount: number) => void`
- Produces: Physics-driven draggable chips (+100, +500, +1K) that snap back on release or trigger `onBet` when flicked/dropped into target.

- [ ] **Step 1: Implement `src/components/DraggableChip.tsx` with Framer Motion**
  - Draggable with drag constraints and spring return.
  - Triggers sound on drag start (`playSound('pop')`).
  - Detects release in drop target zone, triggers `playSound('clink')` and fires `onBet(amount)`.

- [ ] **Step 2: Implement `src/components/WalletDeck.tsx`**
  - Shows player balance, chip rack slots, quick tap-to-bet buttons, and "Top Up / Rebuy" modal when balance is low.

- [ ] **Step 3: Commit draggable chip components**
  ```bash
  git add src/components/DraggableChip.tsx src/components/WalletDeck.tsx src/__tests__/WalletDeck.test.ts
  git commit -m "feat: implement Framer Motion draggable chip betting deck"
  ```

---

### Task 7: Banker Controls & Shan Koe Mee Resolution View

**Files:**
- Create: `src/components/BankerControls.tsx`
- Create: `src/components/SettlementModal.tsx`
- Test: `src/__tests__/BankerControls.test.ts`

**Interfaces:**
- Consumes: `TableState`, `isCurrentPlayerBanker: boolean`, `onResolveBet: (playerId: string, outcome: string) => void`, `onRotateBanker: (newBankerId: string) => void`

- [ ] **Step 1: Implement `src/components/BankerControls.tsx`**
  - Displays each player's pending bet with action buttons:
    - `1x Win`
    - `2x Shan`
    - `3x Mee`
    - `Collect Bet`
    - `Push / Tie`
  - Quick action: "Collect All Unresolved" / "Pay All 1x".
  - Banker Crown handover dropdown.

- [ ] **Step 2: Implement `src/components/SettlementModal.tsx`**
  - End-of-night ledger view showing Net Profit/Loss per player with zero-sum indicator.
  - Confetti celebration (`canvas-confetti`) for the night's top winner.

- [ ] **Step 3: Commit Banker & Settlement components**
  ```bash
  git add src/components/BankerControls.tsx src/components/SettlementModal.tsx src/__tests__/BankerControls.test.ts
  git commit -m "feat: implement Banker resolution controls and end-of-night settlement"
  ```

---

### Task 8: Top Navigation, QR Code Room Join & Main App Shell

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/RoomModal.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/App.test.ts`

**Interfaces:**
- Produces: Complete navigable application with Create Table, Join Table, Live Gameplay, and Leave Room flows.

- [ ] **Step 1: Implement `src/components/Header.tsx`**
  - Lucide vector icons (`Vault`, `Crown`, `QrCode`, `LogOut`).
  - Active Banker indicator and table connection status.

- [ ] **Step 2: Implement `src/components/RoomModal.tsx`**
  - Create Room: Custom or random 4-char room code, starting buy-in, player name.
  - Join Room: 4-char room code input, QR code scanner or manual entry, avatar picker.
  - QR Code generator (`qrcode.react`) for instant table sharing.

- [ ] **Step 3: Assemble `src/App.tsx`**
  - Connects `peerService` with `gameEngine` state machine.
  - Renders Header, GoldenJar, WalletDeck (for players), and BankerControls (for active banker).

- [ ] **Step 4: Commit App integration**
  ```bash
  git add src/components/Header.tsx src/components/RoomModal.tsx src/App.tsx src/__tests__/App.test.ts
  git commit -m "feat: assemble complete App shell with room creation and QR join"
  ```

---

### Task 9: Production Netlify Build & Verification

**Files:**
- Create: `netlify.toml`
- Test: Production build & smoke test

- [ ] **Step 1: Create `netlify.toml`**
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

- [ ] **Step 2: Run all unit tests**
  Run: `npm run test` or `npx vitest run`
  Expected: ALL TESTS PASS

- [ ] **Step 3: Run production build**
  Run: `npm run build`
  Expected: Clean build in `dist/` with zero TypeScript or packaging errors.

- [ ] **Step 4: Commit production configuration**
  ```bash
  git add netlify.toml
  git commit -m "chore: add netlify configuration and verify production build"
  ```
