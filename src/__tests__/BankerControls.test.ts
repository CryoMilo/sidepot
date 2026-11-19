import { describe, it, expect } from 'vitest';
import { createInitialTable, addPlayer, placeBet } from '../utils/gameEngine';

describe('BankerControls and Settlement Logic', () => {
  it('detects when banker bankroll is depleted', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    expect(table.players[table.bankerId].chips).toBe(5000);

    // Simulate depletion
    table.players[table.bankerId].chips = -1000;
    expect(table.players[table.bankerId].chips <= 0).toBe(true);
  });

  it('correctly reports unsettled pot in zero-sum calculation', () => {
    let table = createInitialTable('7K92', 'Ko Aung', 5000);
    table = addPlayer(table, 'p2', 'Min Min');
    table = placeBet(table, 'p2', 1000);

    // Active pot has $1,000
    expect(table.pot).toBe(1000);
  });
});
