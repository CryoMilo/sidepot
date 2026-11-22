import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  Crown,
  Flame,
  Zap,
  Gem,
  Cat,
  Dog,
  Star,
  Heart,
  Coffee,
  Dice5,
  Coins,
  Check,
  X,
  AlertTriangle,
  RotateCw,
  Shield,
  ArrowDownLeft,
} from 'lucide-react';
import {
  TableState,
  Player,
  HandDecisionOutcome,
  BetMultiplier,
} from '../types';
import { calculatePotentialPayout } from '../utils/gameEngine';

interface GameBoardTableProps {
  tableState: TableState;
  myPlayerId: string;
  isBanker: boolean;
  onStageDecision: (
    playerId: string,
    outcome: HandDecisionOutcome,
    multiplier: BetMultiplier
  ) => void;
  onSettleRound: () => void;
  onSetDealerBank: (amount: number) => void;
  onRotateBanker?: (newBankerId: string) => void;
  onOpenTopUpModal?: () => void;
}

export function renderAvatarIcon(iconName?: string) {
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles className="w-4 h-4 text-amber-300" />;
    case 'Crown':
      return <Crown className="w-4 h-4 text-amber-300" />;
    case 'Flame':
      return <Flame className="w-4 h-4 text-rose-400" />;
    case 'Zap':
      return <Zap className="w-4 h-4 text-yellow-300" />;
    case 'Gem':
      return <Gem className="w-4 h-4 text-cyan-300" />;
    case 'Cat':
      return <Cat className="w-4 h-4 text-amber-200" />;
    case 'Dog':
      return <Dog className="w-4 h-4 text-amber-200" />;
    case 'Star':
      return <Star className="w-4 h-4 text-amber-300" />;
    case 'Heart':
      return <Heart className="w-4 h-4 text-rose-400" />;
    case 'Coffee':
      return <Coffee className="w-4 h-4 text-amber-100" />;
    case 'Dice5':
      return <Dice5 className="w-4 h-4 text-amber-200" />;
    case 'Bot':
    default:
      return <Bot className="w-4 h-4 text-emerald-300" />;
  }
}

export default function GameBoardTable({
  tableState,
  myPlayerId,
  isBanker,
  onStageDecision,
  onSettleRound,
  onSetDealerBank,
  onRotateBanker,
  onOpenTopUpModal,
}: GameBoardTableProps) {
  const [selectedPlayerForDecision, setSelectedPlayerForDecision] = useState<Player | null>(null);
  const [tempOutcome, setTempOutcome] = useState<HandDecisionOutcome>('WIN');
  const [tempMultiplier, setTempMultiplier] = useState<BetMultiplier>(1);
  const [showBankModal, setShowBankModal] = useState<boolean>(false);

  const myPlayer = tableState.players[myPlayerId];
  const myChips = myPlayer ? myPlayer.chips : 0;
  const isHost = myPlayerId === tableState.hostId;

  // Bank modal state: only opened when user clicks to insert into bank
  const isBankModalOpen = showBankModal;

  const initialPreset = isHost ? 100 : Math.min(myChips, 20);
  const [newBankAmount, setNewBankAmount] = useState<number>(tableState.dealerBank || initialPreset);

  const playersList = Object.values(tableState.players);
  // Sort so myPlayerId is placed at bottom center (index 0)
  const sortedPlayers = [...playersList].sort((a, b) => {
    if (a.id === myPlayerId) return -1;
    if (b.id === myPlayerId) return 1;
    return 0;
  });

  const staged = tableState.stagedDecisions || {};
  const coverage = calculatePotentialPayout(tableState);
  const activeBetsCount = playersList.filter(p => !p.isBanker && p.currentBet > 0).length;

  const currentDealerIdx = playersList.findIndex(p => p.id === tableState.bankerId);
  const nextPlayerIdx = (currentDealerIdx + 1) % (playersList.length || 1);
  const nextCandidate = playersList[nextPlayerIdx];

  const handleOpenDecision = (player: Player) => {
    if (!isBanker || player.isBanker || player.currentBet <= 0) return;
    const existing = staged[player.id];
    setTempOutcome(existing ? existing.outcome : 'WIN');
    setTempMultiplier(existing ? existing.multiplier : 1);
    setSelectedPlayerForDecision(player);
  };

  const handleConfirmDecision = () => {
    if (!selectedPlayerForDecision) return;
    onStageDecision(selectedPlayerForDecision.id, tempOutcome, tempMultiplier);
    setSelectedPlayerForDecision(null);
  };

  const handleSaveBank = () => {
    if (newBankAmount <= 0) return;
    if (!isHost && newBankAmount > myChips) return;
    onSetDealerBank(newBankAmount);
    setShowBankModal(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-1 sm:p-2 min-h-0 select-none relative overflow-hidden">
      {/* Oval Poker Table Canvas */}
      <div className="relative w-full max-w-lg aspect-[1.12/1] sm:aspect-[1.28/1] max-h-[58vh] flex items-center justify-center">
        {/* CENTER POKER TABLE (Outer Rail & Red Velvet Felt) - z-10 */}
        <div className="absolute inset-x-8 sm:inset-x-10 inset-y-6 sm:inset-y-7 rounded-[100px] sm:rounded-[130px] bg-gradient-to-b from-[#2D060D] via-[#1B0307] to-[#0A0103] p-2.5 sm:p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(245,158,11,0.3)] border-2 border-[#D4AF37]/60 flex items-center justify-center z-10">
          {/* Inner Red Velvet Tablecloth (Felt) */}
          <div className="relative w-full h-full rounded-[85px] sm:rounded-[115px] bg-gradient-to-b from-[#8B1425] via-[#5C0A17] to-[#3B050E] shadow-[inset_0_8px_24px_rgba(0,0,0,0.85)] border border-[#F59E0B]/40 flex flex-col items-center justify-center overflow-hidden">
            {/* Subtle Felt Texture & Table Markings */}
            <div className="absolute inset-2 sm:inset-3 rounded-[75px] sm:rounded-[105px] border border-[#F59E0B]/20 pointer-events-none" />

            {/* CENTER TABLE HUD: Pot, Bankroll, Stint */}
            <div className="z-10 flex flex-col items-center text-center px-3.5 py-1 sm:py-1.5 bg-black/45 backdrop-blur-xs rounded-2xl border border-[#D4AF37]/35 shadow-md max-w-[190px] sm:max-w-[220px]">
              {/* Table Pot */}
              <div className="flex items-center gap-1.5 text-amber-200">
                <Coins className="w-3.5 h-3.5 text-[#FDE047]" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Table Pot
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white leading-tight drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                {tableState.pot}{' '}
                <span className="text-xs font-bold text-[#FCD34D]">tokens</span>
              </div>

              {/* Dealer Bank Status */}
              <div className="mt-0.5 pt-0.5 border-t border-[#D4AF37]/25 w-full flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
                <span className="text-amber-200/80">Bank:</span>
                {tableState.dealerBank > 0 ? (
                  <span
                    className={`font-black ${
                      coverage.canCover ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {tableState.dealerBank} tokens
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (isBanker) {
                        setNewBankAmount(isHost ? 100 : Math.min(myChips, 20));
                        setShowBankModal(true);
                      }
                    }}
                    className={`font-black text-[10px] ${
                      isBanker ? 'text-amber-300 underline cursor-pointer hover:text-white' : 'text-amber-200/60'
                    }`}
                  >
                    {isBanker ? 'Insert into Bank' : 'Awaiting Dealer...'}
                  </button>
                )}
              </div>

              {/* Dealer Rotation Stint Counter */}
              <div className="w-full flex items-center justify-between text-[9px] text-amber-300/70 mt-0.5">
                <span>Stint:</span>
                <span className="font-bold">
                  Round {(tableState.dealerRoundsPlayed || 0) + 1} /{' '}
                  {tableState.dealerRotationFrequency || 5}
                </span>
              </div>

              {/* Bank Cover Warning */}
              {!coverage.canCover && tableState.dealerBank > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded-md border border-rose-600/50">
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Cap: Needs {coverage.requiredPayout}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ON-FELT ACTIVE BET CHIPS (z-20, inside table boundary) */}
        {sortedPlayers.map((player, idx) => {
          if (player.currentBet <= 0) return null;
          const total = sortedPlayers.length;
          const angle = (idx / total) * 2 * Math.PI + Math.PI / 2;
          const betRadiusX = 27;
          const betRadiusY = 25;
          const betLeft = 50 + betRadiusX * Math.cos(angle);
          const betTop = 50 + betRadiusY * Math.sin(angle);

          return (
            <div
              key={`bet-${player.id}`}
              style={{
                position: 'absolute',
                left: `${betLeft}%`,
                top: `${betTop}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="z-20 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#D97706] text-[#451A03] font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-white/80 shadow-md flex items-center gap-0.5"
              >
                <span>฿{player.currentBet}</span>
              </motion.div>
            </div>
          );
        })}

        {/* RADIAL PLAYER SEATS OUTSIDE THE TABLE (z-30 / z-40) */}
        {sortedPlayers.map((player, idx) => {
          const total = sortedPlayers.length;
          const angle = (idx / total) * 2 * Math.PI + Math.PI / 2;
          const radiusX = 44;
          const radiusY = 42;
          const leftPercent = 50 + radiusX * Math.cos(angle);
          const topPercent = 50 + radiusY * Math.sin(angle);

          const hasActiveBet = player.currentBet > 0;
          const decision = staged[player.id];
          const isSelected = selectedPlayerForDecision?.id === player.id;

          return (
            <div
              key={player.id}
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => handleOpenDecision(player)}
              className={`z-30 flex flex-col items-center transition-transform ${
                isBanker && hasActiveBet && !player.isBanker ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
              }`}
            >
              {/* Seat Avatar & Badges */}
              <div className="relative">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-xl border-2 transition-all ${
                    isSelected
                      ? 'border-yellow-300 ring-2 ring-yellow-400 scale-105'
                      : player.isBanker
                      ? 'border-[#F59E0B] bg-gradient-to-br from-[#451A03] to-[#78350F]'
                      : 'border-white/50 bg-gradient-to-br from-[#1C0306] to-[#3B070F]'
                  }`}
                  style={{
                    backgroundColor: player.avatarColor ? `${player.avatarColor}33` : undefined,
                  }}
                >
                  {renderAvatarIcon(player.avatarIcon)}
                </div>

                {/* Dealer Badge ("D") */}
                {player.isBanker && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#451A03] font-black text-[9px] sm:text-[10px] flex items-center justify-center border border-white shadow-md z-40 pointer-events-none">
                    D
                  </div>
                )}

                {/* Staged Decision Badge */}
                {decision && hasActiveBet && (
                  <div
                    className={`absolute -bottom-1 -right-1 text-[8px] sm:text-[9px] font-black px-1 rounded-full shadow-md uppercase border z-40 ${
                      decision.outcome === 'WIN'
                        ? 'bg-emerald-600 text-white border-emerald-300'
                        : decision.outcome === 'LOSE'
                        ? 'bg-rose-700 text-white border-rose-300'
                        : 'bg-amber-600 text-white border-amber-300'
                    }`}
                  >
                    {decision.outcome[0]}x{decision.multiplier}
                  </div>
                )}
              </div>

              {/* Player Name & Chips Label - z-40 (HIGHER THAN TABLE) */}
              <div className="text-center mt-0.5 bg-black/75 px-1.5 py-0.5 rounded-md border border-[#D4AF37]/40 max-w-[75px] sm:max-w-[85px] relative z-40 shadow-lg backdrop-blur-xs">
                <span className="text-[9px] sm:text-[10px] font-black text-white truncate block">
                  {player.name} {player.id === myPlayerId ? '(You)' : ''}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-[#FDE047] block">
                  {player.chips}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DEALER DECISION CONTROLS & SETTLE BUTTON BAR */}
      {isBanker && (
        <div className="w-full max-w-md mt-2 flex items-center justify-between gap-2 px-2 shrink-0 z-30">
          <button
            type="button"
            onClick={() => {
              setNewBankAmount(tableState.dealerBank > 0 ? tableState.dealerBank : (isHost ? 100 : Math.min(myChips, 20)));
              setShowBankModal(true);
            }}
            className="px-2.5 py-2 rounded-xl bg-[#2D040A] border border-[#D4AF37]/50 text-amber-200 text-xs font-black flex items-center gap-1 hover:bg-[#430811] transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{tableState.dealerBank > 0 ? `Bank: ${tableState.dealerBank}` : 'Insert into Bank'}</span>
          </button>

          {/* "Crown next" button with Rotate icon */}
          {onRotateBanker && playersList.some(p => !p.isBanker) && (
            <button
              type="button"
              onClick={() => {
                if (nextCandidate) onRotateBanker(nextCandidate.id);
              }}
              title={`Crown next: ${nextCandidate?.name || 'next player'}`}
              className="px-2.5 py-2 rounded-xl bg-[#2D040A] border border-[#D4AF37]/50 text-amber-200 hover:bg-[#430811] text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Crown next</span>
            </button>
          )}

          <button
            onClick={onSettleRound}
            disabled={activeBetsCount === 0}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 disabled:opacity-40 text-[#451A03] font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              Settle Round {activeBetsCount > 0 ? `(${activeBetsCount} bets)` : ''}
            </span>
          </button>
        </div>
      )}

      {/* DEALER DECISION POPOVER MODAL */}
      <AnimatePresence>
        {selectedPlayerForDecision && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1C0206] via-[#2D040A] to-[#120104] border-2 border-[#D4AF37]/60 rounded-3xl p-4 max-w-xs w-full shadow-2xl text-white relative"
            >
              <button
                onClick={() => setSelectedPlayerForDecision(null)}
                className="absolute top-3 right-3 text-amber-200/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-sm font-black text-amber-100 flex items-center gap-1.5 mb-1">
                <Coins className="w-4 h-4 text-[#F59E0B]" />
                <span>Decide: {selectedPlayerForDecision.name}</span>
              </h4>
              <p className="text-xs text-amber-200/70 mb-3">
                Active Bet: <strong className="text-white">{selectedPlayerForDecision.currentBet} tokens</strong>
              </p>

              {/* Outcome Selection */}
              <div className="mb-3">
                <label className="block text-[11px] font-black text-amber-200 mb-1">
                  Hand Outcome
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['WIN', 'LOSE', 'DRAW'] as HandDecisionOutcome[]).map(outcome => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setTempOutcome(outcome)}
                      className={`py-1.5 rounded-xl text-xs font-black border transition-all ${
                        tempOutcome === outcome
                          ? outcome === 'WIN'
                            ? 'bg-emerald-600 border-emerald-300 text-white shadow-sm'
                            : outcome === 'LOSE'
                            ? 'bg-rose-700 border-rose-300 text-white shadow-sm'
                            : 'bg-amber-600 border-amber-300 text-white shadow-sm'
                          : 'bg-[#240409] text-amber-200/70 border-[#D4AF37]/35'
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier Selection */}
              <div className="mb-4">
                <label className="block text-[11px] font-black text-amber-200 mb-1">
                  Multiplier (x1, x2, x3, x5)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([1, 2, 3, 5] as BetMultiplier[]).map(mult => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setTempMultiplier(mult)}
                      className={`py-1.5 rounded-xl text-xs font-black border transition-all ${
                        tempMultiplier === mult
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] border-[#FCD34D]'
                          : 'bg-[#240409] text-amber-200/70 border-[#D4AF37]/35'
                      }`}
                    >
                      x{mult}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projected Payout Info */}
              <div className="bg-[#140103] p-2.5 rounded-xl border border-[#D4AF37]/35 mb-4 text-xs flex items-center justify-between">
                <span className="text-amber-200/80">Projected:</span>
                <span
                  className={`font-black ${
                    tempOutcome === 'WIN'
                      ? 'text-emerald-400'
                      : tempOutcome === 'LOSE'
                      ? 'text-rose-400'
                      : 'text-amber-300'
                  }`}
                >
                  {tempOutcome === 'WIN'
                    ? `Player wins +${selectedPlayerForDecision.currentBet * tempMultiplier}`
                    : tempOutcome === 'LOSE'
                    ? `Dealer wins +${selectedPlayerForDecision.currentBet * tempMultiplier}`
                    : 'Draw (Refund bet)'}
                </span>
              </div>

              <button
                onClick={handleConfirmDecision}
                className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Decision</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEALER BANK ALLOCATION MODAL (Opened via button click) */}
      <AnimatePresence>
        {isBankModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1C0206] via-[#2D040A] to-[#120104] border-2 border-[#D4AF37]/60 rounded-3xl p-5 max-w-xs w-full shadow-2xl text-white relative"
            >
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="absolute top-3 right-3 text-amber-200/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-base font-black text-amber-100 flex items-center gap-1.5 mb-1">
                <Shield className="w-5 h-5 text-[#F59E0B]" />
                <span>{tableState.dealerBank > 0 ? 'Adjust Dealer Bank' : 'Insert into Bank'}</span>
              </h4>
              <p className="text-xs text-amber-200/80 mb-3">
                {isHost
                  ? 'As the host, your bank account backs the room. Choose your bank tokens:'
                  : 'Choose the bank amount. This will be deducted from your tokens and used to pay winners.'}
              </p>

              {!isHost && myChips <= 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-600/50 text-xs text-rose-200 text-center font-bold">
                    You have 0 tokens. Please top up your tokens or crown the next player.
                  </div>
                  <div className="flex gap-2">
                    {onOpenTopUpModal && (
                      <button
                        type="button"
                        onClick={onOpenTopUpModal}
                        className="flex-1 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-md"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Top Up</span>
                      </button>
                    )}
                    {onRotateBanker && (
                      <button
                        type="button"
                        onClick={() => {
                          if (nextCandidate) onRotateBanker(nextCandidate.id);
                        }}
                        className="flex-1 py-2 bg-[#3B070F] border border-[#D4AF37]/40 text-amber-200 font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-md"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Crown Next</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {(isHost ? [50, 100, 200, 500] : [10, 20, 50, myChips]).map((amt, idx) => {
                      if (!isHost && amt > myChips && idx !== 3) return null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewBankAmount(amt)}
                          className={`py-1.5 rounded-xl text-xs font-black border transition-all ${
                            newBankAmount === amt
                              ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] border-[#FCD34D]'
                              : 'bg-[#180206] text-amber-200/80 border-[#D4AF37]/35'
                          }`}
                        >
                          {idx === 3 && !isHost ? 'All' : amt}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mb-4">
                    <label className="block text-[11px] font-black text-amber-200 mb-1">
                      Bank Tokens {!isHost && `(Max: ${myChips})`}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={isHost ? undefined : myChips}
                      value={newBankAmount}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setNewBankAmount(isHost ? Math.max(0, val) : Math.min(myChips, Math.max(0, val)));
                      }}
                      className="w-full bg-[#140103] border border-[#D4AF37]/50 rounded-xl px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                    />
                  </div>

                  <button
                    onClick={handleSaveBank}
                    disabled={newBankAmount <= 0 || (!isHost && newBankAmount > myChips)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:brightness-110 disabled:opacity-40 text-[#451A03] font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{tableState.dealerBank > 0 ? 'Confirm Bank Update' : 'Confirm Insert into Bank'}</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
