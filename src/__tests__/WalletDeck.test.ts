import { describe, it, expect } from 'vitest';
import DraggableChip from '../components/DraggableChip';
import WalletDeck from '../components/WalletDeck';

describe('WalletDeck & DraggableChip Components', () => {
  it('exports component functions', () => {
    expect(typeof DraggableChip).toBe('function');
    expect(typeof WalletDeck).toBe('function');
  });
});
