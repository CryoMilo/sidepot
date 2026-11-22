import { describe, it, expect } from 'vitest';
import {
  createInitialTable,
  addPlayer,
  commitPlayerBet,
  generateRoomCode,
  requestTopUp,
  approveTopUp,
  rejectTopUp,
  setDealerBank,
  stagePlayerDecision,
  calculatePotentialPayout,
  settleRoundMulti,
  editRoundResult,
  rotateBanker,
  verifyZeroSum,
} from '../utils/gameEngine';
import {
  saveSessionToStorage,
  loadSessionFromStorage,
  clearSessionStorage,
} from '../services/peerService';

describe('Casino & Shan Koe Mee Game Engine Features', () => {
  it('generates a 5-character room code without ambiguous characters', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(5);
    expect(code).toMatch(/^[A-Z2-9]{5}$/);
    expect(code).not.toMatch(/[01OI]/);
  });

  it('creates room with host as banker, bankroll, THB rate, and dealer rotation settings', () => {
    const table = createInitialTable('7K9X2', 'Aung Aung', 200, 15, undefined, 4);

    expect(table.roomId).toBe('7K9X2');
    expect(table.thbPerToken).toBe(15);
    expect(table.dealerRotationFrequency).toBe(4);
    expect(table.dealerBank).toBe(200);
    expect(table.dealerRoundsPlayed).toBe(0);
    expect(table.roundNumber).toBe(1);

    const host = table.players[table.hostId];
    expect(host.name).toBe('Aung Aung');
    expect(host.isBanker).toBe(true);
    expect(host.chips).toBe(200);
    expect(host.avatarIcon).toBeDefined();

    expect(table.logs).toHaveLength(1);
    expect(table.logs[0].type).toBe('DEALER_BANK_SET');
  });

  it('handles player token requests (Top-Up) and Host approval', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table = addPlayer(table, 'p1', 'Player One');

    // Player starts with 0 chips (or defaultBuyIn if 0)
    expect(table.players['p1'].chips).toBe(0);

    // Player requests 50 tokens (฿500 THB)
    table = requestTopUp(table, 'p1', 50, 'TOPUP');
    expect(table.topUpRequests).toHaveLength(1);
    const req = table.topUpRequests[0];
    expect(req.playerId).toBe('p1');
    expect(req.tokens).toBe(50);
    expect(req.thbAmount).toBe(500);
    expect(req.status).toBe('PENDING');

    // Host approves request
    table = approveTopUp(table, req.id);
    expect(table.topUpRequests[0].status).toBe('APPROVED');
    expect(table.players['p1'].chips).toBe(50);
    expect(table.players['p1'].totalBuyIn).toBe(50);

    // Log recorded
    expect(table.logs[0].type).toBe('TOPUP');
    expect(table.logs[0].description).toContain('Player One bought 50 tokens for ฿500');

    // Ledger zero-sum balance intact
    const zeroSum = verifyZeroSum(table);
    expect(zeroSum.balanced).toBe(true);
  });

  it('handles player Top-Up rejection without crediting tokens', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table = addPlayer(table, 'p1', 'Player One');

    table = requestTopUp(table, 'p1', 50, 'TOPUP');
    const req = table.topUpRequests[0];

    table = rejectTopUp(table, req.id);
    expect(table.topUpRequests[0].status).toBe('REJECTED');
    expect(table.players['p1'].chips).toBe(0);
  });

  it('handles Cash-Out request and Host confirmation', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table = addPlayer(table, 'p1', 'Player One');
    table = requestTopUp(table, 'p1', 100, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[0].id);

    // Player cashes out 40 tokens (฿400 THB)
    table = requestTopUp(table, 'p1', 40, 'CASHOUT');
    const cashReq = table.topUpRequests.find(r => r.type === 'CASHOUT')!;
    expect(cashReq.thbAmount).toBe(400);

    // Host pays player real money and approves
    table = approveTopUp(table, cashReq.id);
    expect(table.players['p1'].chips).toBe(60);
    expect(table.players['p1'].totalBuyIn).toBe(60);

    expect(table.logs[0].type).toBe('CASHOUT');
    expect(table.logs[0].description).toContain('Player One cashed out 40 tokens for ฿400');

    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('prevents Cash-Out of more tokens than the player currently holds', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table = addPlayer(table, 'p1', 'Player One');
    table = requestTopUp(table, 'p1', 20, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[0].id);

    // Try cashing out 50 tokens (player only has 20)
    const initialReqs = table.topUpRequests.length;
    table = requestTopUp(table, 'p1', 50, 'CASHOUT');
    expect(table.topUpRequests.length).toBe(initialReqs);
  });

  it('enforces dealer bank payout ceiling check', () => {
    let table = createInitialTable('7K9X2', 'Host', 50, 10); // Dealer bank holds 50 tokens
    table = addPlayer(table, 'p1', 'Player One');
    table = requestTopUp(table, 'p1', 50, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[0].id);

    // Player bets 20 tokens
    table = commitPlayerBet(table, 'p1', 20);

    // Dealer stages decision: WIN with x3 multiplier => payout owed is 20 * 3 = 60 tokens
    table = stagePlayerDecision(table, 'p1', 'WIN', 3);

    const coverage = calculatePotentialPayout(table);
    expect(coverage.requiredPayout).toBe(60);
    expect(coverage.canCover).toBe(false); // 60 > 50

    // Settle should fail / reject execution because dealer can never pay out more than bank holds!
    const tableAfterFailedSettle = settleRoundMulti(table);
    expect(tableAfterFailedSettle.roundNumber).toBe(1); // Still round 1
    expect(tableAfterFailedSettle.roundHistory).toHaveLength(0);

    // Dealer increases bank to 80 tokens
    table = setDealerBank(table, 80);
    const newCoverage = calculatePotentialPayout(table);
    expect(newCoverage.canCover).toBe(true);

    // Now settle succeeds!
    table = settleRoundMulti(table);
    expect(table.roundNumber).toBe(2);
    expect(table.roundHistory).toHaveLength(1);
    expect(table.dealerBank).toBe(80 - 60); // 20 tokens left in bank
  });

  it('settles round correctly for WIN, LOSE (with multiplier), and DRAW', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table.players[table.hostId].chips = 200;
    table.players[table.hostId].totalBuyIn = 200;
    table = setDealerBank(table, 200);

    table = addPlayer(table, 'p1', 'Winner');
    table = addPlayer(table, 'p2', 'Loser');
    table = addPlayer(table, 'p3', 'Drawer');

    // Give players tokens
    table = requestTopUp(table, 'p1', 100, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[0].id);
    table = requestTopUp(table, 'p2', 100, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[1].id);
    table = requestTopUp(table, 'p3', 100, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[2].id);

    // Bets
    table = commitPlayerBet(table, 'p1', 20); // p1 chips: 80
    table = commitPlayerBet(table, 'p2', 15); // p2 chips: 85
    table = commitPlayerBet(table, 'p3', 10); // p3 chips: 90
    expect(table.pot).toBe(45);

    // Decisions:
    // p1: WIN x2 -> Player receives 20 bet back + 40 profit = 60 total
    // p2: LOSE x2 (Dealer Shan 2x) -> Loses on-table 15 + extra 15 from stack = 30 total
    // p3: DRAW x1 -> Bet of 10 returned
    table = stagePlayerDecision(table, 'p1', 'WIN', 2);
    table = stagePlayerDecision(table, 'p2', 'LOSE', 2);
    table = stagePlayerDecision(table, 'p3', 'DRAW', 1);

    table = settleRoundMulti(table);

    // Round updated
    expect(table.roundNumber).toBe(2);
    expect(table.pot).toBe(0);
    expect(table.dealerRoundsPlayed).toBe(1);

    // p1: 80 + 20 + 40 = 140
    expect(table.players['p1'].chips).toBe(140);
    // p2: 85 - 15 = 70
    expect(table.players['p2'].chips).toBe(70);
    // p3: 90 + 10 = 100
    expect(table.players['p3'].chips).toBe(100);

    // Host chips: Started with 200, p1 profit -40, p2 win +30 = net -10 => 190 chips
    expect(table.players[table.hostId].chips).toBe(190);
    expect(table.dealerBank).toBe(190);

    // Zero-sum check
    const zeroSum = verifyZeroSum(table);
    expect(zeroSum.balanced).toBe(true);
  });

  it('allows Dealer or Host to edit a previous round and recalculates token balances with audit trail', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table.players[table.hostId].chips = 200;
    table.players[table.hostId].totalBuyIn = 200;
    table = setDealerBank(table, 200);

    table = addPlayer(table, 'p1', 'Player 1');
    table = requestTopUp(table, 'p1', 100, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[0].id);

    table = commitPlayerBet(table, 'p1', 20); // Player 1 bets 20
    table = stagePlayerDecision(table, 'p1', 'LOSE', 1); // Mistakenly marked as LOSE x1 (-20)
    table = settleRoundMulti(table);

    expect(table.players['p1'].chips).toBe(80);
    expect(table.players[table.hostId].chips).toBe(220);

    // Host realizes mistake: Player 1 actually WON x2 (+40 profit)!
    const pastRound = table.roundHistory[0];
    const correctedResults = [
      {
        playerId: 'p1',
        playerName: 'Player 1',
        bet: 20,
        outcome: 'WIN' as const,
        multiplier: 2 as const,
        tokenDelta: 40,
      },
    ];

    table = editRoundResult(table, pastRound.roundNumber, correctedResults, 'Host', 'Misread cards');

    // Player 1 had delta -20, now delta +40. Net difference is +60!
    // Player chips: 80 + 60 = 140
    expect(table.players['p1'].chips).toBe(140);
    // Dealer chips: 220 - 60 = 160
    expect(table.players[table.hostId].chips).toBe(160);

    // Audit trail preserved
    const editedRound = table.roundHistory[0];
    expect(editedRound.isEdited).toBe(true);
    expect(editedRound.editHistory).toHaveLength(1);
    expect(editedRound.editHistory![0].editedBy).toBe('Host');
    expect(editedRound.editHistory![0].reason).toBe('Misread cards');
    expect(editedRound.editHistory![0].previousResults[0].outcome).toBe('LOSE');

    // Action log entry recorded
    expect(table.logs[0].type).toBe('ROUND_EDITED');

    // Balance remains zero-sum
    expect(verifyZeroSum(table).balanced).toBe(true);
  });

  it('resets dealer bank and stint counter on dealer rotation', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table = addPlayer(table, 'p1', 'NewDealer');
    table = requestTopUp(table, 'p1', 150, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[0].id);

    table = rotateBanker(table, 'p1');
    expect(table.bankerId).toBe('p1');
    expect(table.dealerRoundsPlayed).toBe(0);
    expect(table.dealerBank).toBe(150);
    expect(table.players['p1'].isBanker).toBe(true);
    expect(table.players[table.hostId].isBanker).toBe(false);
  });

  it('crowns dealer manually when requested', () => {
    let table = createInitialTable('7K9X2', 'Host', 0, 10);
    table = addPlayer(table, 'p1', 'Player 1');
    table = requestTopUp(table, 'p1', 50, 'TOPUP');
    table = approveTopUp(table, table.topUpRequests[0].id);

    table = rotateBanker(table, 'p1');
    expect(table.bankerId).toBe('p1');
    expect(table.players['p1'].isBanker).toBe(true);
    expect(table.logs[0].type).toBe('DEALER_ROTATED');
    expect(table.logs[0].description).toContain('Dealer rotated to Player 1');
  });

  it('persists and restores user session for resumable room experience', () => {
    clearSessionStorage();
    const session = {
      roomId: '7K9X2',
      playerId: 'player-xyz',
      playerName: 'Kyaw Kyaw',
      isHost: false,
    };

    saveSessionToStorage(session);
    const loaded = loadSessionFromStorage();
    expect(loaded).toEqual(session);

    clearSessionStorage();
    expect(loadSessionFromStorage()).toBeNull();
  });
});
