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

export type TablePhase = 'BETTING' | 'DEALING' | 'RESOLVING' | 'ROUND_SUMMARY';

export type BetOutcome = 'WIN_1X' | 'SHAN_2X' | 'MEE_3X' | 'COLLECT' | 'PUSH';

export interface TableState {
  roomId: string;
  hostId: string;
  bankerId: string;
  roundNumber: number;
  pot: number;
  defaultBuyIn: number;
  players: Record<string, Player>;
  phase: TablePhase;
  lastSettlement?: Record<string, number>;
}
