import { describe, it, expect } from 'vitest';
import {
  createInitialTable,
  addPlayer,
  placeBet,
  resolvePlayerBet,
  rotateBanker,
  verifyZeroSum,
  advancePhase,
  topUpPlayerChips,
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

  it('resolves PUSH correctly: bet returned without loss or gain', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    table = resolvePlayerBet(table, 'p2', 'PUSH');

    expect(table.players['p2'].chips).toBe(5000);
    expect(table.players[table.bankerId].chips).toBe(5000);
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('rotates the banker role', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
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

  it('advances phases properly', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    expect(table.phase).toBe('BETTING');
    table = advancePhase(table, 'DEALING');
    expect(table.phase).toBe('DEALING');
    table = advancePhase(table, 'RESOLVING');
    expect(table.phase).toBe('RESOLVING');
    table = advancePhase(table, 'ROUND_SUMMARY');
    expect(table.phase).toBe('ROUND_SUMMARY');
  });
});
