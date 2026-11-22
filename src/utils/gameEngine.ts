import {
  TableState,
  Player,
  TablePhase,
  HandDecisionOutcome,
  BetMultiplier,
  StagedDecision,
  PlayerRoundResult,
  RoundRecord,
  TopUpRequest,
  ActionLogEntry,
  BetOutcome,
} from '../types';

export const AVATAR_COLORS = [
  '#0284C7', // Sky
  '#D97706', // Amber
  '#E11D48', // Rose
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#DB2777', // Pink
  '#10B981', // Emerald light
  '#F59E0B', // Amber light
];

export const AVATAR_ICONS = [
  'Bot',
  'Sparkles',
  'Crown',
  'Flame',
  'Zap',
  'Gem',
  'Cat',
  'Dog',
  'Star',
  'Heart',
  'Coffee',
  'Dice5',
];

export function getPlayerIcon(name: string, id: string): string {
  let hash = 0;
  const str = name + id;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_ICONS.length;
  return AVATAR_ICONS[index];
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 5 chars without ambiguous 0/O, 1/I
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createInitialTable(
  roomId: string,
  hostName: string,
  buyIn: number = 0,
  thbPerToken: number = 10,
  hostQrUrl?: string,
  dealerRotationFrequency: number = 5
): TableState {
  const hostId = 'host-' + Math.random().toString(36).substring(2, 9);
  const hostPlayer: Player = {
    id: hostId,
    name: hostName,
    avatarColor: AVATAR_COLORS[0],
    avatarIcon: getPlayerIcon(hostName, hostId),
    chips: buyIn > 0 ? buyIn : 0, // Host doesn't choose starting bank amount; sets via popup
    currentBet: 0,
    isBanker: true,
    isConnected: true,
    totalBuyIn: buyIn > 0 ? buyIn : 0,
    isCommitted: false,
  };

  return {
    roomId,
    hostId,
    bankerId: hostId,
    roundNumber: 1,
    pot: 0,
    defaultBuyIn: buyIn,
    thbPerToken: thbPerToken > 0 ? thbPerToken : 10,
    hostQrUrl,
    dealerRotationFrequency: dealerRotationFrequency > 0 ? dealerRotationFrequency : 5,
    dealerRoundsPlayed: 0,
    dealerBank: 0,
    players: {
      [hostId]: hostPlayer,
    },
    phase: 'BETTING',
    topUpRequests: [],
    roundHistory: [],
    logs: [
      {
        id: 'log-' + Math.random().toString(36).substring(2, 9),
        roundNumber: 1,
        timestamp: Date.now(),
        type: 'DEALER_ROTATED',
        description: `Room created by ${hostName}. Awaiting initial dealer bank allocation.`,
      },
    ],
    stagedDecisions: {},
    debts: [],
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
    avatarIcon: getPlayerIcon(name, playerId),
    chips: state.defaultBuyIn || 0,
    currentBet: 0,
    isBanker: false,
    isConnected: true,
    totalBuyIn: state.defaultBuyIn || 0,
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

/* =========================================================================
   TOP-UP & CASH-OUT SYSTEM (Replaces debt loan)
   ========================================================================= */

export function requestTopUp(
  state: TableState,
  playerId: string,
  tokens: number,
  type: 'TOPUP' | 'CASHOUT'
): TableState {
  const player = state.players[playerId];
  if (!player || tokens <= 0) return state;

  if (type === 'CASHOUT' && player.chips < tokens) {
    return state; // Cannot cash out more tokens than held
  }

  const thbAmount = tokens * (state.thbPerToken || 10);
  const newRequest: TopUpRequest = {
    id: 'req-' + Math.random().toString(36).substring(2, 9),
    playerId,
    playerName: player.name,
    tokens,
    thbAmount,
    type,
    status: 'PENDING',
    createdAt: Date.now(),
  };

  return {
    ...state,
    topUpRequests: [...(state.topUpRequests || []), newRequest],
  };
}

export function approveTopUp(state: TableState, requestId: string): TableState {
  const req = (state.topUpRequests || []).find(r => r.id === requestId && r.status === 'PENDING');
  if (!req) return state;

  const player = state.players[req.playerId];
  if (!player) return state;

  let updatedChips = player.chips;
  let updatedTotalBuyIn = player.totalBuyIn;

  if (req.type === 'TOPUP') {
    updatedChips += req.tokens;
    updatedTotalBuyIn += req.tokens;
  } else {
    // CASHOUT
    if (player.chips < req.tokens) return state;
    updatedChips -= req.tokens;
    updatedTotalBuyIn = Math.max(0, updatedTotalBuyIn - req.tokens);
  }

  const updatedRequests = state.topUpRequests.map(r =>
    r.id === requestId ? { ...r, status: 'APPROVED' as const, resolvedAt: Date.now() } : r
  );

  const logEntry: ActionLogEntry = {
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
    type: req.type,
    description:
      req.type === 'TOPUP'
        ? `${player.name} bought ${req.tokens} tokens for ฿${req.thbAmount}.`
        : `${player.name} cashed out ${req.tokens} tokens for ฿${req.thbAmount}.`,
    details: {
      playerId: player.id,
      playerName: player.name,
      tokens: req.tokens,
      thbAmount: req.thbAmount,
    },
  };

  return {
    ...state,
    topUpRequests: updatedRequests,
    players: {
      ...state.players,
      [player.id]: {
        ...player,
        chips: updatedChips,
        totalBuyIn: updatedTotalBuyIn,
      },
    },
    logs: [logEntry, ...(state.logs || [])],
  };
}

export function rejectTopUp(state: TableState, requestId: string): TableState {
  const updatedRequests = (state.topUpRequests || []).map(r =>
    r.id === requestId ? { ...r, status: 'REJECTED' as const, resolvedAt: Date.now() } : r
  );

  return {
    ...state,
    topUpRequests: updatedRequests,
  };
}

/* =========================================================================
   DEALER BANK & STAGED DECISION LOGIC
   ========================================================================= */

export function setDealerBank(state: TableState, amount: number): TableState {
  if (amount <= 0) return state;
  const banker = state.players[state.bankerId];
  if (!banker) return state;

  const isHost = banker.id === state.hostId;
  const updatedPlayers = { ...state.players };

  const currentBank = state.dealerBank || 0;
  const diff = amount - currentBank;

  if (!isHost) {
    // Non-host dealer: Subtracted from his tokens
    if (diff > 0) {
      if (banker.chips < diff) return state;
      updatedPlayers[state.bankerId] = {
        ...banker,
        chips: banker.chips - diff,
      };
    } else if (diff < 0) {
      updatedPlayers[state.bankerId] = {
        ...banker,
        chips: banker.chips + (-diff),
      };
    }
  } else {
    // Host dealer: backed by host's bank account
    if (diff > 0) {
      if (banker.chips >= diff) {
        updatedPlayers[state.bankerId] = {
          ...banker,
          chips: banker.chips - diff,
        };
      } else {
        const fromChips = banker.chips;
        const fromBacking = diff - fromChips;
        updatedPlayers[state.bankerId] = {
          ...banker,
          chips: 0,
          totalBuyIn: banker.totalBuyIn + fromBacking,
        };
      }
    } else if (diff < 0) {
      updatedPlayers[state.bankerId] = {
        ...banker,
        chips: banker.chips + (-diff),
      };
    }
  }

  const logEntry: ActionLogEntry = {
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
    type: 'DEALER_BANK_SET',
    description: `Dealer ${banker.name} allocated ${amount} tokens to bankroll.`,
    details: {
      tokens: amount,
    },
  };

  return {
    ...state,
    dealerBank: amount,
    players: updatedPlayers,
    logs: [logEntry, ...(state.logs || [])],
  };
}

export function stagePlayerDecision(
  state: TableState,
  playerId: string,
  outcome: HandDecisionOutcome,
  multiplier: BetMultiplier
): TableState {
  return {
    ...state,
    stagedDecisions: {
      ...(state.stagedDecisions || {}),
      [playerId]: { outcome, multiplier },
    },
  };
}

export function clearStagedDecisions(state: TableState): TableState {
  return {
    ...state,
    stagedDecisions: {},
    debts: [],
  };
}

export function calculatePotentialPayout(state: TableState): {
  requiredPayout: number;
  canCover: boolean;
  surplusOrDeficit: number;
} {
  let requiredPayout = 0;
  const staged = state.stagedDecisions || {};

  for (const [pId, p] of Object.entries(state.players)) {
    if (p.isBanker || p.currentBet <= 0) continue;
    const decision = staged[pId];
    if (decision && decision.outcome === 'WIN') {
      requiredPayout += p.currentBet * decision.multiplier;
    }
  }

  const available = state.dealerBank || 0;
  return {
    requiredPayout,
    canCover: requiredPayout <= available,
    surplusOrDeficit: available - requiredPayout,
  };
}

/* =========================================================================
   SETTLE ROUND (MANUAL MULTIPLIER & BANK PAYOUT CEILING)
   ========================================================================= */

export function settleRoundMulti(state: TableState): TableState {
  const banker = state.players[state.bankerId];
  if (!banker) return state;

  const coverage = calculatePotentialPayout(state);
  if (!coverage.canCover) {
    // The dealer can never pay out more than the bank holds!
    return state;
  }

  const staged = state.stagedDecisions || {};
  const results: PlayerRoundResult[] = [];
  const updatedPlayers: Record<string, Player> = { ...state.players };

  let dealerChipDelta = 0;
  let dealerBankDelta = 0;
  let potDeducted = 0;

  for (const [pId, player] of Object.entries(state.players)) {
    if (player.isBanker || player.currentBet <= 0) continue;

    const bet = player.currentBet;
    potDeducted += bet;

    const decision: StagedDecision = staged[pId] || { outcome: 'DRAW', multiplier: 1 };
    let tokenDelta = 0;

    if (decision.outcome === 'WIN') {
      // Player gets back original on-table bet + (bet * multiplier) profit from dealer
      const profit = bet * decision.multiplier;
      tokenDelta = profit;
      dealerChipDelta -= profit;
      dealerBankDelta -= profit;

      updatedPlayers[pId] = {
        ...player,
        chips: player.chips + bet + profit,
        currentBet: 0,
        isCommitted: false,
      };
    } else if (decision.outcome === 'LOSE') {
      // Player loses on-table bet.
      // If multiplier > 1, dealer collects extra (multiplier - 1) * bet from player's stack, capped by player's chips
      let extraLost = 0;
      if (decision.multiplier > 1) {
        extraLost = Math.min(player.chips, (decision.multiplier - 1) * bet);
      }
      const totalLost = bet + extraLost;
      tokenDelta = -totalLost;
      dealerChipDelta += totalLost;
      dealerBankDelta += totalLost;

      updatedPlayers[pId] = {
        ...player,
        chips: player.chips - extraLost,
        currentBet: 0,
        isCommitted: false,
      };
    } else {
      // DRAW: Player refunded on-table bet without profit/loss
      tokenDelta = 0;
      updatedPlayers[pId] = {
        ...player,
        chips: player.chips + bet,
        currentBet: 0,
        isCommitted: false,
      };
    }

    results.push({
      playerId: pId,
      playerName: player.name,
      bet,
      outcome: decision.outcome,
      multiplier: decision.multiplier,
      tokenDelta,
    });
  }

  // Update dealer's chips and bank
  const startingBank = state.dealerBank;
  const endingBank = Math.max(0, startingBank + dealerBankDelta);

  // Tokens won or lost stay in dealerBank until he is no longer dealer
  updatedPlayers[state.bankerId] = {
    ...banker,
    chips: banker.chips,
    currentBet: 0,
    isCommitted: false,
  };

  const roundRecord: RoundRecord = {
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
    dealerId: state.bankerId,
    dealerName: banker.name,
    startingBank,
    endingBank,
    results,
  };

  const logEntry: ActionLogEntry = {
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
    type: 'ROUND_SETTLED',
    description: `Round ${state.roundNumber} settled by Dealer ${banker.name}. Bank: ${startingBank} → ${endingBank} (${dealerBankDelta >= 0 ? '+' : ''}${dealerBankDelta}).`,
  };

  const nextRoundsPlayed = (state.dealerRoundsPlayed || 0) + 1;

  // If that gets to 0, next player is automatically crowned!
  if (endingBank <= 0) {
    const playerList = Object.values(updatedPlayers);
    const currentIdx = playerList.findIndex(p => p.id === state.bankerId);
    const nextIdx = (currentIdx + 1) % playerList.length;
    const nextBanker = playerList[nextIdx];

    const bankDepletedLog: ActionLogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      roundNumber: state.roundNumber,
      timestamp: Date.now(),
      type: 'DEALER_ROTATED',
      description: `Dealer bank depleted to 0! Automatically crowned next player ${nextBanker.name}.`,
    };

    const stateAfterSettle: TableState = {
      ...state,
      pot: Math.max(0, state.pot - potDeducted),
      dealerBank: 0,
      dealerRoundsPlayed: nextRoundsPlayed,
      players: updatedPlayers,
      stagedDecisions: {},
      roundHistory: [roundRecord, ...(state.roundHistory || [])],
      logs: [bankDepletedLog, logEntry, ...(state.logs || [])],
      roundNumber: state.roundNumber + 1,
      phase: 'BETTING',
    };

    return rotateBanker(stateAfterSettle, nextBanker.id, true);
  }

  return {
    ...state,
    pot: Math.max(0, state.pot - potDeducted),
    dealerBank: endingBank,
    dealerRoundsPlayed: nextRoundsPlayed,
    players: updatedPlayers,
    stagedDecisions: {},
    roundHistory: [roundRecord, ...(state.roundHistory || [])],
    logs: [logEntry, ...(state.logs || [])],
    roundNumber: state.roundNumber + 1,
    phase: 'BETTING',
  };
}

/* =========================================================================
   EDIT ROUND RESULTS (WITH DELTA COMPENSATION & AUDIT TRAIL)
   ========================================================================= */

export function editRoundResult(
  state: TableState,
  roundNumber: number,
  newResults: PlayerRoundResult[],
  editorName: string,
  reason?: string
): TableState {
  const roundIndex = (state.roundHistory || []).findIndex(r => r.roundNumber === roundNumber);
  if (roundIndex === -1) return state;

  const oldRound = state.roundHistory[roundIndex];
  const dealer = state.players[oldRound.dealerId];
  if (!dealer) return state;

  const updatedPlayers = { ...state.players };
  let netDealerDelta = 0;

  // Calculate delta for each player
  for (const newRes of newResults) {
    const oldRes = oldRound.results.find(r => r.playerId === newRes.playerId);
    const oldDelta = oldRes ? oldRes.tokenDelta : 0;
    const playerDiff = newRes.tokenDelta - oldDelta;

    if (playerDiff !== 0 && updatedPlayers[newRes.playerId]) {
      const p = updatedPlayers[newRes.playerId];
      updatedPlayers[newRes.playerId] = {
        ...p,
        chips: Math.max(0, p.chips + playerDiff),
      };
      // Zero-sum counter for dealer
      netDealerDelta -= playerDiff;
    }
  }

  // Apply counter delta to dealer (to dealerBank if currently active dealer, otherwise to chips)
  let updatedDealerBank = state.dealerBank;
  if (oldRound.dealerId === state.bankerId) {
    updatedDealerBank = Math.max(0, (state.dealerBank || 0) + netDealerDelta);
  } else {
    updatedPlayers[oldRound.dealerId] = {
      ...dealer,
      chips: Math.max(0, dealer.chips + netDealerDelta),
    };
  }

  const newEndingBank = Math.max(0, oldRound.endingBank + netDealerDelta);

  const updatedRound: RoundRecord = {
    ...oldRound,
    endingBank: newEndingBank,
    results: newResults,
    isEdited: true,
    editHistory: [
      ...(oldRound.editHistory || []),
      {
        timestamp: Date.now(),
        editedBy: editorName,
        previousResults: oldRound.results,
        reason,
      },
    ],
  };

  const updatedHistory = [...state.roundHistory];
  updatedHistory[roundIndex] = updatedRound;

  const logEntry: ActionLogEntry = {
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    roundNumber,
    timestamp: Date.now(),
    type: 'ROUND_EDITED',
    description: `Round ${roundNumber} edited by ${editorName}. Adjusted ${newResults.length} player outcomes.`,
  };

  return {
    ...state,
    dealerBank: updatedDealerBank,
    players: updatedPlayers,
    roundHistory: updatedHistory,
    logs: [logEntry, ...(state.logs || [])],
  };
}

/* =========================================================================
   BANKER ROTATION
   ========================================================================= */

export function rotateBanker(state: TableState, newBankerId: string, force: boolean = false): TableState {
  const targetPlayer = state.players[newBankerId];
  if (!targetPlayer) return state;
  if (!force && targetPlayer.chips < MIN_BANKER_TOKENS && targetPlayer.id !== state.hostId) {
    return state;
  }

  let potDelta = 0;
  const updatedPlayers: Record<string, Player> = {};

  for (const [id, p] of Object.entries(state.players)) {
    if (id === newBankerId) {
      const refundedBet = p.currentBet;
      potDelta += refundedBet;
      updatedPlayers[id] = {
        ...p,
        isBanker: true,
        chips: p.chips + refundedBet,
        currentBet: 0,
        isCommitted: false,
      };
    } else if (id === state.bankerId) {
      // Outgoing dealer: return any remaining bank tokens to their stack
      const refund = (state.dealerBank || 0) > 0 ? state.dealerBank : 0;
      updatedPlayers[id] = {
        ...p,
        isBanker: false,
        chips: p.chips + refund,
      };
    } else {
      updatedPlayers[id] = {
        ...p,
        isBanker: false,
      };
    }
  }

  const logEntry: ActionLogEntry = {
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
    type: 'DEALER_ROTATED',
    description: `Dealer rotated to ${targetPlayer.name}. Awaiting dealer bank allocation.`,
  };

  return {
    ...state,
    bankerId: newBankerId,
    dealerRoundsPlayed: 0,
    dealerBank: 0, // Awaiting newly crowned dealer to set their bank amount
    stagedDecisions: {},
    pot: Math.max(0, state.pot - potDelta),
    players: updatedPlayers,
    logs: [logEntry, ...(state.logs || [])],
  };
}

export function advancePhase(state: TableState, nextPhase: TablePhase): TableState {
  let nextRound = state.roundNumber;
  const updatedPlayers: Record<string, Player> = { ...state.players };

  if (nextPhase === 'BETTING') {
    nextRound += 1;
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
  const totalChipsInPlay =
    Object.values(state.players).reduce((sum, p) => sum + p.chips, 0) +
    (state.dealerBank || 0) +
    state.pot;
  const netDiscrepancy = totalChipsInPlay - totalBuyIns;

  return {
    balanced: netDiscrepancy === 0,
    netDiscrepancy,
  };
}

// Backward compatibility helper for resolvePlayerBet if needed in tests
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
      playerChipDelta = bet * 2;
      bankerChipDelta = -bet;
      break;
    case 'SHAN_2X':
      playerChipDelta = bet * 3;
      bankerChipDelta = -(bet * 2);
      break;
    case 'MEE_3X':
      playerChipDelta = bet * 4;
      bankerChipDelta = -(bet * 3);
      break;
    case 'COLLECT':
      playerChipDelta = 0;
      bankerChipDelta = bet;
      break;
    case 'COLLECT_2X': {
      const extra2x = Math.min(player.chips, bet);
      playerChipDelta = -extra2x;
      bankerChipDelta = bet + extra2x;
      break;
    }
    case 'COLLECT_3X': {
      const extra3x = Math.min(player.chips, bet * 2);
      playerChipDelta = -extra3x;
      bankerChipDelta = bet + extra3x;
      break;
    }
    case 'PUSH':
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
        chips: Math.max(0, banker.chips + bankerChipDelta),
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

  const newDebt = {
    id: 'debt-' + Math.random().toString(36).substring(2, 9),
    lenderId,
    lenderName: lender.name,
    borrowerId,
    borrowerName: borrower.name,
    amount,
    status: 'UNPAID' as const,
    createdAt: Date.now(),
  };

  return {
    ...state,
    debts: [...((state as any).debts || []), newDebt],
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
  } as TableState;
}

export function repayDebt(
  state: TableState,
  debtId: string,
  borrowerId: string
): TableState {
  const debts = (state as any).debts || [];
  const debt = debts.find(
    (d: any) => d.id === debtId && d.borrowerId === borrowerId && d.status === 'UNPAID'
  );
  if (!debt) return state;

  const borrower = state.players[borrowerId];
  const lender = state.players[debt.lenderId];

  if (!borrower || !lender || borrower.chips < debt.amount) {
    return state;
  }

  const updatedDebts = debts.map((d: any) =>
    d.id === debtId ? { ...d, status: 'REPAID', repaidAt: Date.now() } : d
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
  } as TableState;
}

export function clearRepaymentAlert(state: TableState): TableState {
  return {
    ...state,
    latestRepaymentAlert: undefined,
  } as TableState;
}
