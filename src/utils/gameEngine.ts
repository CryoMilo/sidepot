import { TableState, Player, BetOutcome, TablePhase } from '../types';

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
  };

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: newPlayer,
    },
  };
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
      // Banker keeps bet; player gets 0 back
      playerChipDelta = 0;
      bankerChipDelta = bet;
      break;
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
      },
      [state.bankerId]: {
        ...banker,
        chips: banker.chips + bankerChipDelta,
      },
    },
  };
}

export function rotateBanker(state: TableState, newBankerId: string): TableState {
  if (!state.players[newBankerId]) return state;

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
  if (nextPhase === 'BETTING') {
    nextRound += 1;
  }

  return {
    ...state,
    roundNumber: nextRound,
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

export function verifyZeroSum(state: TableState): { balanced: boolean; netDiscrepancy: number } {
  const totalBuyIns = Object.values(state.players).reduce((sum, p) => sum + p.totalBuyIn, 0);
  const totalChipsInPlay = Object.values(state.players).reduce((sum, p) => sum + p.chips, 0) + state.pot;
  const netDiscrepancy = totalChipsInPlay - totalBuyIns;

  return {
    balanced: netDiscrepancy === 0,
    netDiscrepancy,
  };
}
