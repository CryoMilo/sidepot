import { describe, it, expect } from 'vitest';
import {
  formatPeerId,
  extractRoomCode,
  createNetworkMessage,
  parseNetworkMessage,
  saveStateToStorage,
  loadStateFromStorage,
} from '../services/peerService';
import { createInitialTable } from '../utils/gameEngine';

describe('PeerJS P2P Networking Protocols', () => {
  it('formats custom room codes with prefix to prevent collisions', () => {
    expect(formatPeerId('7K92')).toBe('sidepot-7k92');
    expect(formatPeerId('ABCD')).toBe('sidepot-abcd');
  });

  it('extracts room code from prefixed peer ID', () => {
    expect(extractRoomCode('sidepot-7k92')).toBe('7K92');
    expect(extractRoomCode('7k92')).toBe('7K92');
  });

  it('creates and parses state sync messages correctly', () => {
    const table = createInitialTable('7K92', 'Ko Aung', 5000);
    const msg = createNetworkMessage('SYNC_STATE', table);
    const parsed = parseNetworkMessage(JSON.stringify(msg));

    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('SYNC_STATE');
    expect(parsed?.payload.roomId).toBe('7K92');
  });

  it('saves and restores table state from localStorage safely', () => {
    const table = createInitialTable('7K92', 'Ko Aung', 5000);
    saveStateToStorage(table);
    const restored = loadStateFromStorage();

    expect(restored).not.toBeNull();
    expect(restored?.roomId).toBe('7K92');
    expect(restored?.hostId).toBe(table.hostId);
  });
});
