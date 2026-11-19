export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  chips: number;
  currentBet: number;
  isBanker: boolean;
  isConnected: boolean;
  totalBuyIn: number;
  isCommitted?: boolean;
}

export interface DebtRecord {
  id: string;
  lenderId: string;
  lenderName: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  status: 'UNPAID' | 'REPAID';
  createdAt: number;
  repaidAt?: number;
}

export type TablePhase = 'BETTING' | 'DEALING' | 'RESOLVING' | 'ROUND_SUMMARY';

export type BetOutcome =
  | 'WIN_1X'
  | 'SHAN_2X'
  | 'MEE_3X'
  | 'PUSH'
  | 'COLLECT'
  | 'COLLECT_2X'
  | 'COLLECT_3X';

export interface TableState {
  roomId: string;
  hostId: string;
  bankerId: string;
  roundNumber: number;
  pot: number;
  defaultBuyIn: number;
  players: Record<string, Player>;
  debts: DebtRecord[];
  phase: TablePhase;
  lastSettlement?: Record<string, number>;
  latestRepaymentAlert?: {
    debtId: string;
    lenderId: string;
    borrowerName: string;
    amount: number;
  };
}
