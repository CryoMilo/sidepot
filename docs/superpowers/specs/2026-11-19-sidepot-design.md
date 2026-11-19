# Design Document: SidePot (Card Night Chip Ledger & Shan Koe Mee Payouts)

**Date**: 2026-11-19  
**Status**: Ready for Builder Review  
**Target Platform**: Netlify Static Web Application (Mobile-First PWA/SPA)

---

## 1. Intent & The "Why"
When hosting home card games (especially multi-player games with rotating dealers like **Shan Koe Mee**, as well as Poker or Blackjack), physical chips are bulky, missing, or in short supply. Paper IOUs and manual phone-calculator tallying are slow, prone to disputes, and break game momentum.

**SidePot** is an accountless, zero-backend, mobile-first web app that replaces physical chips with a playful, real-time digital chip ledger. Friends scan a QR code or enter a 4-character room code on their phones, drag and drop chips with tactile sound and physics into a central Golden Jar, and let the dealer resolve multi-way bets and multipliers (2x Shan, 3x Mee) in one tap.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Instant Join (Zero Account / Zero Signup)**: Players join a table via QR code or a 4-character room code in under 5 seconds.
- **Pure Static Netlify Deploy (Zero Backend DB)**: 100% serverless, no database subscriptions, no persistent server maintenance.
- **Shan Koe Mee Utility**: Built-in support for 1-on-1 dealer vs. player resolutions, including special multipliers (`2x Shan`, `3x Mee`, and bet sweeps).
- **Cute & Tactile Micro-Interactions**: Draggable token chips (`+100`, `+500`, `+1,000`), a fluffy shiny Golden Jar with squash-and-stretch celebration dance, dynamic facial expressions reflecting player chip stacks, and synthesized Web Audio sound effects.
- **Dealer Role Flexibility**: Any player at the table can be designated as the active Banker/Dealer for each round, while the host device maintains session state.

### Non-Goals
- **In-App Virtual Card Dealing**: Physical playing cards are dealt on the physical table. The app does not deal digital cards or simulate poker/Shan Koe Mee RNG hands.
- **Real-Money Transactions**: Purely play-money / token chip tracking. No payment gateway, fiat, or cryptocurrency processing.
- **Cross-Internet Matchmaking**: Designed for in-person local table play (friends in the same room).

### Anti-Goals
- **No Unicode Emojis**: Emojis render inconsistently across iOS, Android, and desktop and look dated. The UI strictly uses clean SVG vector icons (`lucide-react` / React Icons).
- **No Complex Account Authentication**: No passwords, OAuth, emails, or phone numbers.

---

## 3. Constraints
- **Hosting**: Static site on Netlify (HTML/JS/CSS assets only).
- **Communication**: Real-time sync across devices without a dedicated persistent WebSocket server. Must use peer-to-peer WebRTC data channels via a free public STUN/signaling server (`PeerJS`).
- **Iconography**: Clean SVG icons only (zero unicode emojis).
- **Mobile First**: Optimized for touch dragging, haptics, responsive viewports, and one-handed thumb reach.

---

## 4. Approaches Considered

### Approach 1: React + Vite + PeerJS WebRTC Data Channels *(Selected)*
- **Architecture**: The table host's device registers a session on the free PeerJS signaling server, displaying a QR code. Connecting phones establish WebRTC data channels directly with the host device. The host maintains the authoritative game state in memory and saves snapshots to `localStorage`.
- **Pros**:
  - Zero external database or backend costs.
  - Deploys as a static bundle directly to Netlify.
  - Sub-millisecond peer communication.
  - Framer Motion handles 60fps spring physics and dragging smoothly.
- **Trade-offs**: If the host device closes their browser, the connection breaks (mitigated by auto-saving room state in host's `localStorage` so refreshing restores the room).

### Approach 2: Serverless Cloud Realtime (PartyKit / Supabase Realtime)
- **Architecture**: Ephemeral rooms managed by cloud WebSocket edge workers.
- **Trade-offs**: Requires external cloud account setup and API keys, violating the "zero-config static Netlify deploy" constraint.

---

## 5. Visual Theme & Art Style

- **Palette (Fluffy Creamy Light Theme)**:
  - Canvas: Buttercream gradient (`#FFFDF9` to `#FFF2D5`).
  - Cards: Crisp pillowy white (`#FFFFFF`) with soft amber drop shadows (`rgba(217, 119, 6, 0.12)`) and light honey borders (`#FFF1CD`).
  - Typography: Warm espresso brown (`#422006` / `#78350F`) with high readability.
- **The Golden Jar**:
  - Plump golden urn with fluffy cloud-like rim lid, specular luster highlight, and metallic gold handles (strictly a gold jar; no honey, no honey drips).
  - Celebration Dance: Squash-and-stretch bouncy keyframe animation on chip drop or multiplier resolution.
- **Dynamic Facial Expressions (Reflects YOUR CHIPS)**:
  - **Low Stack (< $1,500)**: Worried, nervous brows, blue sweat drop, quivering mouth.
  - **Healthy Stack ($1,500 – $6,000)**: Cheerful, confident smile, rosy blushing cheeks.
  - **Big Winner / High Stack (> $6,000)**: Diamond/star eyes, laughing beaming grin, tiny gold crown over brow.
- **Tactile Sound Effects**:
  - Synthesized via Web Audio API (pop on chip grab, ceramic clink on drop into jar, chime fanfare on multiplier win).

---

## 6. System Architecture & Component Breakdown

### A. Networking & Room State (WebRTC Mesh)
```
                     ┌────────────────────────┐
                     │   Host Device (Banker)  │
                     │  - Authoritative State │
                     │  - PeerJS Room Server  │
                     │  - LocalStorage Backup │
                     └───────────┬────────────┘
                                 │ WebRTC Data Channels
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
     ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
     │ Player Phone  │   │ Player Phone  │   │ Player Phone  │
     │  - Client UI  │   │  - Client UI  │   │  - Client UI  │
     └───────────────┘   └───────────────┘   └───────────────┘
```
1. **Host Flow**:
   - Taps "Create Table".
   - Assigns initial buy-in amount (e.g., $5,000) and starting blind/ante.
   - Generates 4-character room code (e.g. `7K92`) and QR code.
   - Designates initial Banker (default: Host, or selectable).
2. **Player Flow**:
   - Scans QR code or inputs 4-char code.
   - Enters nickname and selects a colored avatar badge.
   - Connects directly to host via WebRTC data channel.

### B. Core State Machine
```ts
interface Player {
  id: string;
  name: string;
  avatarColor: string;
  chips: number;
  currentBet: number;
  isBanker: boolean;
  isConnected: boolean;
}

interface TableState {
  roomId: string;
  hostId: string;
  bankerId: string;
  roundNumber: number;
  pot: number;
  defaultBuyIn: number;
  players: Record<string, Player>;
  phase: 'BETTING' | 'DEALING' | 'RESOLVING' | 'ROUND_SUMMARY';
}
```

### C. Game Loop (Shan Koe Mee & General Table Play)
1. **Betting Phase**:
   - Players drag and drop chips into the Golden Jar (or tap preset chips).
   - Real-time bet total updates across all connected screens.
2. **Dealing Phase**:
   - Physical cards are dealt on the table.
   - App locks in bets.
3. **Resolving Phase (Banker View)**:
   - Banker views each player's bet head-to-head.
   - Tap actions per player:
     - `Win (1x)`: Player wins their bet from banker.
     - `2x Shan`: Player wins double bet from banker.
     - `3x Mee`: Player wins triple bet from banker.
     - `Collect`: Banker beats player and collects bet into banker stack.
     - `Tie / Push`: Bet returned to player.
   - Quick action: "Collect All Remaining" / "Pay All Even".
4. **End of Night Settlement**:
   - Shows total buy-in, final chip balance, and net profit/loss for every player with net-zero balance verification.

---

## 7. What's Left to the Builder
- Package selection & setup: React 18 / 19, Vite, Tailwind CSS, Framer Motion, `lucide-react`, `peerjs`, `canvas-confetti`, `qrcode.react`.
- Web Audio sound synthesizer synthesis frequencies and envelopes.
- Vibration/Haptics fallback (`navigator.vibrate` when supported on Android/iOS).
- Auto-reconnect handling for mobile devices that lock screen or switch tabs.
