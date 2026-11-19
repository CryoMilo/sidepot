import { describe, it, expect } from 'vitest';
import {
  createInitialTable,
  addPlayer,
  placeBet,
  commitPlayerBet,
  resetPlayerBet,
  resolvePlayerBet,
  rotateBanker,
  verifyZeroSum,
  advancePhase,
  topUpPlayerChips,
  transferTokensAsDebt,
  repayDebt,
  clearRepaymentAlert,
  adjustPlayerChips,
} from '../utils/gameEngine';

describe('Game Engine & Ledger', () => {
  it('creates initial table with host as banker', () => {
    const table = createInitialTable('7K92', 'Ko Aung', 5000);
    expect(table.roomId).toBe('7K92');
    expect(table.hostId).toBeDefined();
    expect(table.bankerId).toBe(table.hostId);
    expect(table.players[table.hostId].name).toBe('Ko Aung');
    expect(table.players[table.hostId].chips).toBe(5000);
    expect(table.players[table.hostId].isBanker).toBe(true);
    expect(table.phase).toBe('BETTING');
  });

  it('adds new players to the table', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    expect(Object.keys(table.players)).toHaveLength(2);
    expect(table.players['p2'].chips).toBe(5000);
    expect(table.players['p2'].name).toBe('Min Min');
    expect(table.players['p2'].isBanker).toBe(false);
  });

  it('handles bet placement correctly', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    expect(table.players['p2'].chips).toBe(4000);
    expect(table.players['p2'].currentBet).toBe(1000);
    expect(table.pot).toBe(1000);
  });

  it('rejects bets higher than player balance', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    const tableAfterFailedBet = placeBet(table, 'p2', 6000);

    expect(tableAfterFailedBet.players['p2'].chips).toBe(5000);
    expect(tableAfterFailedBet.players['p2'].currentBet).toBe(0);
    expect(tableAfterFailedBet.pot).toBe(0);
  });

  it('resolves WIN_1X correctly: bet back + 1x from banker', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    // Banker Ko Aung has 5000 chips. Min Min placed 1000 bet.
    table = resolvePlayerBet(table, 'p2', 'WIN_1X');

    // Min Min wins 1000 from Banker: 4000 + 1000 (bet returned) + 1000 (profit) = 6000
    expect(table.players['p2'].chips).toBe(6000);
    expect(table.players['p2'].currentBet).toBe(0);
    // Banker pays 1000: 5000 - 1000 = 4000
    expect(table.players[table.bankerId].chips).toBe(4000);
    // Pot clears
    expect(table.pot).toBe(0);

    // Zero-sum balance check: 6000 + 4000 = 10000 (initial buy-in: 5000 + 5000)
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('resolves SHAN_2X correctly: bet back + 2x from banker', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    table = resolvePlayerBet(table, 'p2', 'SHAN_2X');

    // Min Min gets 1000 bet returned + 2000 profit = 7000
    expect(table.players['p2'].chips).toBe(7000);
    // Banker pays 2000: 5000 - 2000 = 3000
    expect(table.players[table.bankerId].chips).toBe(3000);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('resolves MEE_3X correctly: bet back + 3x from banker', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    table = resolvePlayerBet(table, 'p2', 'MEE_3X');

    // Min Min gets 1000 bet returned + 3000 profit = 8000
    expect(table.players['p2'].chips).toBe(8000);
    // Banker pays 3000: 5000 - 3000 = 2000
    expect(table.players[table.bankerId].chips).toBe(2000);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('resolves COLLECT correctly: Banker collects bet', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    table = resolvePlayerBet(table, 'p2', 'COLLECT');

    // Min Min loses bet: remaining 4000
    expect(table.players['p2'].chips).toBe(4000);
    // Banker collects 1000: 5000 + 1000 = 6000
    expect(table.players[table.bankerId].chips).toBe(6000);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('resolves COLLECT_2X (Dealer Shan) correctly: Banker collects bet + 1x from player stack', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 100);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 20); // Min Min chips: 80, bet: 20

    table = resolvePlayerBet(table, 'p2', 'COLLECT_2X');

    // Min Min loses 20 on-table + 20 extra from stack = 60 remaining
    expect(table.players['p2'].chips).toBe(60);
    expect(table.players['p2'].currentBet).toBe(0);
    // Banker receives 20 + 20 = 40 (100 + 40 = 140)
    expect(table.players[table.bankerId].chips).toBe(140);
    expect(table.pot).toBe(0);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('resolves COLLECT_3X (Dealer Mee) correctly: Banker collects bet + 2x from player stack', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 100);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 20); // Min Min chips: 80, bet: 20

    table = resolvePlayerBet(table, 'p2', 'COLLECT_3X');

    // Min Min loses 20 on-table + 40 extra from stack = 40 remaining
    expect(table.players['p2'].chips).toBe(40);
    expect(table.players['p2'].currentBet).toBe(0);
    // Banker receives 20 + 40 = 60 (100 + 60 = 160)
    expect(table.players[table.bankerId].chips).toBe(160);
    expect(table.pot).toBe(0);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('resolves PUSH correctly: bet returned without loss or gain', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    table = resolvePlayerBet(table, 'p2', 'PUSH');

    expect(table.players['p2'].chips).toBe(5000);
    expect(table.players[table.bankerId].chips).toBe(5000);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('allows the Banker to bet as a player', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 50);
    table = placeBet(table, table.bankerId, 10);

    expect(table.players[table.bankerId].chips).toBe(40);
    expect(table.players[table.bankerId].currentBet).toBe(10);
    expect(table.pot).toBe(10);
  });

  it('only allows players with at least 20 tokens to be crowned as banker', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 50);
    table = addPlayer(table, 'p2', 'Min Min');
    table = addPlayer(table, 'p3', 'Thida');

    // Reduce Thida's chips to 15
    table.players['p3'].chips = 15;

    // Try to rotate banker to Thida (< 20 tokens) - should fail / remain unchanged
    const tableFailed = rotateBanker(table, 'p3');
    expect(tableFailed.bankerId).toBe(table.hostId);

    // Rotate to Min Min (50 tokens >= 20) - should succeed
    const tableSuccess = rotateBanker(table, 'p2');
    expect(tableSuccess.bankerId).toBe('p2');
    expect(tableSuccess.players['p2'].isBanker).toBe(true);
  });

  it('rotates the banker role', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 50);
    table = addPlayer(table, 'p2', 'Min Min');
    table = rotateBanker(table, 'p2');

    expect(table.bankerId).toBe('p2');
    expect(table.players['p2'].isBanker).toBe(true);
    expect(table.players[table.hostId].isBanker).toBe(false);
  });

  it('supports player top-up / rebuy maintaining ledger balance', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = topUpPlayerChips(table, table.hostId, 5000);

    expect(table.players[table.hostId].chips).toBe(10000);
    expect(table.players[table.hostId].totalBuyIn).toBe(10000);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('advances phases and increments round number when starting next round', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    expect(table.roundNumber).toBe(1);
    table = advancePhase(table, 'BETTING');
    expect(table.roundNumber).toBe(2);
  });

  it('refunds active bet when player is rotated into banker mid-round', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);
    expect(table.pot).toBe(1000);
    expect(table.players['p2'].chips).toBe(4000);

    table = rotateBanker(table, 'p2');
    // Bet must be refunded: 4000 + 1000 = 5000, pot back to 0
    expect(table.players['p2'].chips).toBe(5000);
    expect(table.players['p2'].currentBet).toBe(0);
    expect(table.pot).toBe(0);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('handles commit and reset of player bets', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 100);
    table = addPlayer(table, 'p2', 'Min Min');

    // Commit bet
    table = commitPlayerBet(table, 'p2', 25);
    expect(table.players['p2'].chips).toBe(75);
    expect(table.players['p2'].currentBet).toBe(25);
    expect(table.players['p2'].isCommitted).toBe(true);
    expect(table.pot).toBe(25);

    // Reset bet
    table = resetPlayerBet(table, 'p2');
    expect(table.players['p2'].chips).toBe(100);
    expect(table.players['p2'].currentBet).toBe(0);
    expect(table.players['p2'].isCommitted).toBe(false);
    expect(table.pot).toBe(0);
  });

  it('manages peer token debt ledger and repayment flow', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 100);
    table = addPlayer(table, 'p2', 'Min Min');

    // Ko Aung lends 30 tokens to Min Min
    table = transferTokensAsDebt(table, table.hostId, 'p2', 30);
    expect(table.players[table.hostId].chips).toBe(70);
    expect(table.players['p2'].chips).toBe(130);
    expect(table.debts).toHaveLength(1);

    const debt = table.debts[0];
    expect(debt.lenderId).toBe(table.hostId);
    expect(debt.borrowerId).toBe('p2');
    expect(debt.amount).toBe(30);
    expect(debt.status).toBe('UNPAID');

    // Min Min repays debt
    table = repayDebt(table, debt.id, 'p2');
    expect(table.players['p2'].chips).toBe(100);
    expect(table.players[table.hostId].chips).toBe(100);
    expect(table.debts[0].status).toBe('REPAID');
    expect(table.latestRepaymentAlert).toBeDefined();
    expect(table.latestRepaymentAlert?.lenderId).toBe(table.hostId);
    expect(table.latestRepaymentAlert?.amount).toBe(30);

    // Clear repayment alert
    table = clearRepaymentAlert(table);
    expect(table.latestRepaymentAlert).toBeUndefined();
  });

  it('adjusts player chips positively and negatively for secret token adjustments', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 100);
    // Add 10 tokens
    table = adjustPlayerChips(table, table.hostId, 10);
    expect(table.players[table.hostId].chips).toBe(110);

    // Re-deduct 10 tokens
    table = adjustPlayerChips(table, table.hostId, -10);
    expect(table.players[table.hostId].chips).toBe(100);
  });

  it('manages isCommitted lifecycle across commit, reset, resolve, and phase advance', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 100);
    table = addPlayer(table, 'p2', 'Min Min');

    // Min Min commits bet
    table = commitPlayerBet(table, 'p2', 25);
    expect(table.players['p2'].isCommitted).toBe(true);
    expect(table.players['p2'].currentBet).toBe(25);

    // Resolving bet frees player for next round
    table = resolvePlayerBet(table, 'p2', 'WIN_1X');
    expect(table.players['p2'].isCommitted).toBe(false);
    expect(table.players['p2'].currentBet).toBe(0);

    // Commit and reset
    table = commitPlayerBet(table, 'p2', 15);
    expect(table.players['p2'].isCommitted).toBe(true);
    table = resetPlayerBet(table, 'p2');
    expect(table.players['p2'].isCommitted).toBe(false);
    expect(table.players['p2'].currentBet).toBe(0);
  });
});
