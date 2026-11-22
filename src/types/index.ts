export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon?: string;
  chips: number;
  currentBet: number;
  isBanker: boolean;
  isConnected: boolean;
  totalBuyIn: number;
  isCommitted?: boolean;
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

export type HandDecisionOutcome = 'WIN' | 'LOSE' | 'DRAW';
export type BetMultiplier = 1 | 2 | 3 | 5;

export interface StagedDecision {
  outcome: HandDecisionOutcome;
  multiplier: BetMultiplier;
}

export interface PlayerRoundResult {
  playerId: string;
  playerName: string;
  bet: number;
  outcome: HandDecisionOutcome;
  multiplier: BetMultiplier;
  tokenDelta: number; // e.g. +40 for win x2 on 20 bet, -20 for loss x1
}

export interface RoundRecord {
  roundNumber: number;
  timestamp: number;
  dealerId: string;
  dealerName: string;
  startingBank: number;
  endingBank: number;
  results: PlayerRoundResult[];
  isEdited?: boolean;
  editHistory?: {
    timestamp: number;
    editedBy: string;
    previousResults: PlayerRoundResult[];
    reason?: string;
  }[];
}

export interface TopUpRequest {
  id: string;
  playerId: string;
  playerName: string;
  tokens: number;
  thbAmount: number;
  type: 'TOPUP' | 'CASHOUT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  resolvedAt?: number;
}

export interface ActionLogEntry {
  id: string;
  roundNumber: number;
  timestamp: number;
  type: 'ROUND_SETTLED' | 'ROUND_EDITED' | 'TOPUP' | 'CASHOUT' | 'DEALER_ROTATED' | 'DEALER_BANK_SET';
  description: string;
  details?: {
    playerId?: string;
    playerName?: string;
    bet?: number;
    outcome?: HandDecisionOutcome;
    multiplier?: BetMultiplier;
    tokenDelta?: number;
    tokens?: number;
    thbAmount?: number;
    oldOutcome?: string;
    newOutcome?: string;
  };
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

export interface TableState {
  roomId: string;
  hostId: string;
  bankerId: string;
  roundNumber: number;
  pot: number;
  defaultBuyIn: number;
  thbPerToken: number;
  hostQrUrl?: string;
  dealerRotationFrequency: number;
  dealerRoundsPlayed: number;
  dealerBank: number;
  players: Record<string, Player>;
  phase: TablePhase;
  topUpRequests: TopUpRequest[];
  roundHistory: RoundRecord[];
  logs: ActionLogEntry[];
  stagedDecisions?: Record<string, StagedDecision>;
  debts: DebtRecord[];
  latestRepaymentAlert?: {
    debtId: string;
    lenderId: string;
    borrowerName: string;
    amount: number;
  };
}
