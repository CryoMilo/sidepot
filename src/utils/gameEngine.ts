import { TableState, Player, BetOutcome, TablePhase, DebtRecord } from '../types';

const AVATAR_COLORS = [
  '#0284C7', // Sky
  '#D97706', // Amber
  '#E11D48', // Rose
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#DB2777', // Pink
];

export function createInitialTable(roomId: string, hostName: string, buyIn: number): TableState {
  const hostId = 'host-' + Math.random().toString(36).substring(2, 9);
  const hostPlayer: Player = {
    id: hostId,
    name: hostName,
    avatarColor: AVATAR_COLORS[0],
    chips: buyIn,
    currentBet: 0,
    isBanker: true,
    isConnected: true,
    totalBuyIn: buyIn,
    isCommitted: false,
  };

  return {
    roomId,
    hostId,
    bankerId: hostId,
    roundNumber: 1,
    pot: 0,
    defaultBuyIn: buyIn,
    players: {
      [hostId]: hostPlayer,
    },
    debts: [],
    phase: 'BETTING',
  };
}

export function addPlayer(state: TableState, playerId: string, name: string): TableState {
  if (state.players[playerId]) {
    return {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...state.players[playerId],
          isConnected: true,
        },
      },
    };
  }

  const colorIndex = Object.keys(state.players).length % AVATAR_COLORS.length;
  const newPlayer: Player = {
    id: playerId,
    name,
    avatarColor: AVATAR_COLORS[colorIndex],
    chips: state.defaultBuyIn,
    currentBet: 0,
    isBanker: false,
    isConnected: true,
    totalBuyIn: state.defaultBuyIn,
    isCommitted: false,
  };

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: newPlayer,
    },
  };
}

export const MIN_BANKER_TOKENS = 20;

export function canBeBanker(player: Player): boolean {
  return player.chips >= MIN_BANKER_TOKENS;
}

export function placeBet(state: TableState, playerId: string, amount: number): TableState {
  const player = state.players[playerId];
  if (!player || player.isBanker || amount <= 0 || player.chips < amount) {
    return state;
  }

  return {
    ...state,
    pot: state.pot + amount,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        chips: player.chips - amount,
        currentBet: player.currentBet + amount,
      },
    },
  };
}

export function commitPlayerBet(state: TableState, playerId: string, amount: number): TableState {
  const player = state.players[playerId];
  if (!player || player.isBanker || amount <= 0 || player.chips < amount) {
    return state;
  }

  return {
    ...state,
    pot: state.pot + amount,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        chips: player.chips - amount,
        currentBet: player.currentBet + amount,
        isCommitted: true,
      },
    },
  };
}

export function resetPlayerBet(state: TableState, playerId: string): TableState {
  const player = state.players[playerId];
  if (!player || player.currentBet <= 0) return state;

  return {
    ...state,
    pot: Math.max(0, state.pot - player.currentBet),
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        chips: player.chips + player.currentBet,
        currentBet: 0,
        isCommitted: false,
      },
    },
  };
}

export function transferTokensAsDebt(
  state: TableState,
  lenderId: string,
  borrowerId: string,
  amount: number
): TableState {
  const lender = state.players[lenderId];
  const borrower = state.players[borrowerId];

  if (!lender || !borrower || lenderId === borrowerId || amount <= 0 || lender.chips < amount) {
    return state;
  }

  const newDebt: DebtRecord = {
    id: 'debt-' + Math.random().toString(36).substring(2, 9),
    lenderId,
    lenderName: lender.name,
    borrowerId,
    borrowerName: borrower.name,
    amount,
    status: 'UNPAID',
    createdAt: Date.now(),
  };

  return {
    ...state,
    debts: [...(state.debts || []), newDebt],
    players: {
      ...state.players,
      [lenderId]: {
        ...lender,
        chips: lender.chips - amount,
      },
      [borrowerId]: {
        ...borrower,
        chips: borrower.chips + amount,
      },
    },
  };
}

export function repayDebt(
  state: TableState,
  debtId: string,
  borrowerId: string
): TableState {
  const debt = (state.debts || []).find(
    d => d.id === debtId && d.borrowerId === borrowerId && d.status === 'UNPAID'
  );
  if (!debt) return state;

  const borrower = state.players[borrowerId];
  const lender = state.players[debt.lenderId];

  if (!borrower || !lender || borrower.chips < debt.amount) {
    return state;
  }

  const updatedDebts = state.debts.map(d =>
    d.id === debtId ? { ...d, status: 'REPAID' as const, repaidAt: Date.now() } : d
  );

  return {
    ...state,
    debts: updatedDebts,
    latestRepaymentAlert: {
      debtId,
      lenderId: debt.lenderId,
      borrowerName: borrower.name,
      amount: debt.amount,
    },
    players: {
      ...state.players,
      [borrowerId]: {
        ...borrower,
        chips: borrower.chips - debt.amount,
      },
      [debt.lenderId]: {
        ...lender,
        chips: lender.chips + debt.amount,
      },
    },
  };
}

export function clearRepaymentAlert(state: TableState): TableState {
  return {
    ...state,
    latestRepaymentAlert: undefined,
  };
}

export function resolvePlayerBet(state: TableState, playerId: string, outcome: BetOutcome): TableState {
  const player = state.players[playerId];
  const banker = state.players[state.bankerId];

  if (!player || !banker || player.isBanker || player.currentBet === 0) {
    return state;
  }

  const bet = player.currentBet;
  let playerChipDelta = 0;
  let bankerChipDelta = 0;

  switch (outcome) {
    case 'WIN_1X':
      // Player gets back bet + 1x from banker
      playerChipDelta = bet * 2;
      bankerChipDelta = -bet;
      break;
    case 'SHAN_2X':
      // Player gets back bet + 2x from banker
      playerChipDelta = bet * 3;
      bankerChipDelta = -(bet * 2);
      break;
    case 'MEE_3X':
      // Player gets back bet + 3x from banker
      playerChipDelta = bet * 4;
      bankerChipDelta = -(bet * 3);
      break;
    case 'COLLECT':
      // Banker keeps on-table bet (1x); player gets 0 back
      playerChipDelta = 0;
      bankerChipDelta = bet;
      break;
    case 'COLLECT_2X': {
      // Dealer Shan (2x): Banker keeps on-table bet + collects additional 1x from player's stack
      const extra2x = Math.min(player.chips, bet);
      playerChipDelta = -extra2x;
      bankerChipDelta = bet + extra2x;
      break;
    }
    case 'COLLECT_3X': {
      // Dealer Mee (3x): Banker keeps on-table bet + collects additional 2x from player's stack
      const extra3x = Math.min(player.chips, bet * 2);
      playerChipDelta = -extra3x;
      bankerChipDelta = bet + extra3x;
      break;
    }
    case 'PUSH':
      // Push: Bet returned to player without gain/loss
      playerChipDelta = bet;
      bankerChipDelta = 0;
      break;
  }

  return {
    ...state,
    pot: Math.max(0, state.pot - bet),
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        chips: player.chips + playerChipDelta,
        currentBet: 0,
        isCommitted: false,
      },
      [state.bankerId]: {
        ...banker,
        chips: banker.chips + bankerChipDelta,
      },
    },
  };
}

export function rotateBanker(state: TableState, newBankerId: string): TableState {
  const targetPlayer = state.players[newBankerId];
  if (!targetPlayer || targetPlayer.chips < MIN_BANKER_TOKENS) return state;

  let potDelta = 0;

  const updatedPlayers: Record<string, Player> = {};
  for (const [id, p] of Object.entries(state.players)) {
    if (id === newBankerId) {
      // If newly crowned banker had an active bet, refund it to their stack
      const refundedBet = p.currentBet;
      potDelta += refundedBet;
      updatedPlayers[id] = {
        ...p,
        isBanker: true,
        chips: p.chips + refundedBet,
        currentBet: 0,
        isCommitted: false,
      };
    } else {
      updatedPlayers[id] = {
        ...p,
        isBanker: false,
      };
    }
  }

  return {
    ...state,
    bankerId: newBankerId,
    pot: Math.max(0, state.pot - potDelta),
    players: updatedPlayers,
  };
}

export function advancePhase(state: TableState, nextPhase: TablePhase): TableState {
  let nextRound = state.roundNumber;
  let nextPot = state.pot;
  const updatedPlayers: Record<string, Player> = { ...state.players };

  if (nextPhase === 'BETTING') {
    nextRound += 1;
    // Reset bet committed flag for all players
    for (const id of Object.keys(updatedPlayers)) {
      updatedPlayers[id] = {
        ...updatedPlayers[id],
        isCommitted: false,
      };
    }
  }

  return {
    ...state,
    roundNumber: nextRound,
    pot: nextPot,
    players: updatedPlayers,
    phase: nextPhase,
  };
}

export function topUpPlayerChips(state: TableState, playerId: string, amount: number): TableState {
  const player = state.players[playerId];
  if (!player || amount <= 0) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        chips: player.chips + amount,
        totalBuyIn: player.totalBuyIn + amount,
      },
    },
  };
}

export function adjustPlayerChips(state: TableState, playerId: string, amount: number): TableState {
  const player = state.players[playerId];
  if (!player) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        chips: Math.max(0, player.chips + amount),
      },
    },
  };
}

export function verifyZeroSum(state: TableState): { balanced: boolean; netDiscrepancy: number } {
  const totalBuyIns = Object.values(state.players).reduce((sum, p) => sum + p.totalBuyIn, 0);
  const totalChipsInPlay = Object.values(state.players).reduce((sum, p) => sum + p.chips, 0) + state.pot;
  const netDiscrepancy = totalChipsInPlay - totalBuyIns;

  return {
    balanced: netDiscrepancy === 0,
    netDiscrepancy,
  };
}
