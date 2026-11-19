# Implementation Plan: QR Debt Ledger, Staged Bet Commit/Reset, UI Declutter & Dynamic Pot Scaling

## 1. Objectives
1. **QR Debt Transfer Ledger**: Replace arbitrary top-up with a peer-to-peer token transfer and debt tracking ledger (`DebtRecord`).
   - Borrow/Lend via QR code or direct table selection.
   - Saves debt with status `UNPAID`.
   - In-debt player can open Debt Dialog to repay.
   - When repaid, the lender receives a prompt notification dialog.
2. **Staged Bet Workflow (Reset & Commit)**:
   - Tokens dragged or tapped stage the bet locally first.
   - Two clear, spacious buttons: **Reset** (revert staged chips) and **Commit** (lock in bet for the round).
   - Once committed, players are marked as ready for the dealer.
3. **UI Declutter & Removal of Redundant Info**:
   - Eliminate repeating "Stack: X tokens" clutter.
   - De-densify the Banker Controls resolution buttons with comfortable touch targets and clear breathing room.
4. **Flexible Pot & Zero-Scroll Viewport**:
   - Golden Jar and center area dynamically shrink (`flex-1 min-h-0`, `max-h-[22vh]`, `shrink`) to guarantee the entire game UI fits inside `100dvh` without any vertical scrollbar.
5. **Strict Constraints**:
   - **NO EMOJIS ANYWHERE**.
   - Smooth 60fps animations.

---

## 2. File Changes & Responsibilities

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `DebtRecord` interface (`id`, `lenderId`, `lenderName`, `borrowerId`, `borrowerName`, `amount`, `status: 'UNPAID' \| 'REPAID'`, `createdAt`, `repaidAt`). Add `debts: DebtRecord[]` to `TableState`. Add `committed?: boolean` to `Player`. |
| `src/utils/gameEngine.ts` | Add `transferTokensAsDebt(state, lenderId, borrowerId, amount)` and `repayDebt(state, debtId, borrowerId)`. Add `commitPlayerBet(state, playerId, amount)`. Update `createInitialTable` to initialize `debts: []`. |
| `src/__tests__/gameEngine.test.ts` | Unit tests for debt creation, token transfer, debt repayment, lender notification tracking, and bet commit. |
| `src/components/DebtModal.tsx` | New modal with QR code generation & scanning/selection to transfer tokens as debt, list of active debts with "Repay" button, and lender repayment notification dialog. |
| `src/components/GoldenJar.tsx` | Ensure flexible SVG scaling (`h-full max-h-[22vh] aspect-square min-h-0`) so it shrinks smoothly on smaller mobile viewports. |
| `src/components/BankerControls.tsx` | Remove redundant stack text, streamline resolution buttons with comfortable touch padding, and display player bet commit status. |
| `src/components/WalletDeck.tsx` | Remove "+20/+50" top-up, add Debt/Transfer trigger button, add **Reset** and **Commit** buttons with staged bet preview. |
| `src/App.tsx` | Integrate `DebtModal`, repayment notification alert, staged bet state management, and flex layout tuning for zero-scroll. |

---

## 3. Step-by-Step Execution Plan

- [ ] **Task 1: Update Types & Game Engine with Debt Ledger & Bet Commit**
- [ ] **Task 2: Create Debt & Transfer Modal (`src/components/DebtModal.tsx`)**
- [ ] **Task 3: Implement Bet Staging, Reset & Commit in `WalletDeck.tsx`**
- [ ] **Task 4: Declutter `BankerControls.tsx` & Remove Redundant Information**
- [ ] **Task 5: Flexible Pot Scaling & Mobile Viewport Polish (`GoldenJar.tsx` & `App.tsx`)**
- [ ] **Task 6: Verification & Test Suite**
