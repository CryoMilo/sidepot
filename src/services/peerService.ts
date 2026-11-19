import Peer, { DataConnection } from 'peerjs';
import { TableState } from '../types';

export type NetworkMessageType =
  | 'SYNC_STATE'
  | 'JOIN_TABLE'
  | 'PLACE_BET'
  | 'COMMIT_BET'
  | 'RESET_BET'
  | 'RESOLVE_BET'
  | 'ROTATE_BANKER'
  | 'TOP_UP'
  | 'ADJUST_CHIPS'
  | 'TRANSFER_DEBT'
  | 'REPAY_DEBT'
  | 'CLEAR_REPAYMENT_ALERT'
  | 'ADVANCE_PHASE'
  | 'PING'
  | 'PONG';

export interface NetworkMessage<T = any> {
  type: NetworkMessageType;
  payload: T;
  timestamp: number;
}

export function formatPeerId(roomCode: string): string {
  const clean = roomCode.trim().toLowerCase();
  return clean.startsWith('sidepot-') ? clean : `sidepot-${clean}`;
}

export function extractRoomCode(peerId: string): string {
  const clean = peerId.trim().toUpperCase();
  return clean.startsWith('SIDEPOT-') ? clean.replace('SIDEPOT-', '') : clean;
}

export function createNetworkMessage<T>(type: NetworkMessageType, payload: T): NetworkMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

export function parseNetworkMessage(raw: unknown): NetworkMessage | null {
  try {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as NetworkMessage;
    }
    if (typeof raw === 'object' && raw !== null && 'type' in raw) {
      return raw as NetworkMessage;
    }
    return null;
  } catch {
    return null;
  }
}

const STORAGE_KEY = 'sidepot_active_room_state';

// In-memory fallback when localStorage is mocked or unavailable in node tests
let memoryStorage: string | null = null;

export function saveStateToStorage(state: TableState): void {
  try {
    const serialized = JSON.stringify(state);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } else {
      memoryStorage = serialized;
    }
  } catch {
    // Best-effort storage
  }
}

export function loadStateFromStorage(): TableState | null {
  try {
    let raw: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } else {
      raw = memoryStorage;
    }

    if (!raw) return null;
    return JSON.parse(raw) as TableState;
  } catch {
    return null;
  }
}

export function clearStateStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    memoryStorage = null;
  } catch {
    // Best-effort
  }
}

export function broadcastState(connections: DataConnection[], state: TableState): void {
  const message = createNetworkMessage('SYNC_STATE', state);
  saveStateToStorage(state);

  connections.forEach(conn => {
    if (conn.open) {
      try {
        conn.send(message);
      } catch {
        // Drop disconnected client
      }
    }
  });
}

export function sendActionToHost(connection: DataConnection | null, type: NetworkMessageType, payload: any): void {
  if (!connection || !connection.open) return;
  const message = createNetworkMessage(type, payload);
  try {
    connection.send(message);
  } catch {
    // Transmission error
  }
}

export function createPeerInstance(id?: string): Peer {
  return new Peer(id || '', {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
    },
  });
}
