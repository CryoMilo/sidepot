import { useState, useRef } from 'react';
import { Wallet, Crown, RotateCcw, Check, Coins, Sliders, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableChip from './DraggableChip';
import { playSound } from '../utils/audio';
import { Player } from '../types';

interface WalletDeckProps {
  chips: number;
  currentBet: number;
  isBanker: boolean;
  isCommitted?: boolean;
  players?: Record<string, Player>;
  onRotateBanker?: (newBankerId: string) => void;
  onCommitBet: (amount: number) => void;
  onOpenTopUpModal: () => void;
  onAdjustChips?: (amount: number) => void;
}

const CASINO_DENOMINATIONS = [
  { val: 1, label: '1', clayColor: '#CBD5E1', stripeColor: '#0284C7', textColor: '#1E293B', accentRing: '#94A3B8' },
  { val: 2, label: '2', clayColor: '#0284C7', stripeColor: '#FFFFFF', textColor: '#0369A1', accentRing: '#BAE6FD' },
  { val: 5, label: '5', clayColor: '#DC2626', stripeColor: '#FFFFFF', textColor: '#B91C1C', accentRing: '#FCA5A5' },
  { val: 10, label: '10', clayColor: '#2563EB', stripeColor: '#FBBF24', textColor: '#1D4ED8', accentRing: '#93C5FD' },
  { val: 15, label: '15', clayColor: '#0D9488', stripeColor: '#FFFFFF', textColor: '#0F766E', accentRing: '#99F6E4' },
  { val: 20, label: '20', clayColor: '#059669', stripeColor: '#FDE047', textColor: '#047857', accentRing: '#A7F3D0' },
  { val: 25, label: '25', clayColor: '#16A34A', stripeColor: '#F59E0B', textColor: '#15803D', accentRing: '#FCD34D' },
  { val: 30, label: '30', clayColor: '#EA580C', stripeColor: '#FFFFFF', textColor: '#C2410C', accentRing: '#FDBA74' },
  { val: 35, label: '35', clayColor: '#DB2777', stripeColor: '#FFFFFF', textColor: '#BE185D', accentRing: '#FBCFE8' },
  { val: 40, label: '40', clayColor: '#7C3AED', stripeColor: '#FDE047', textColor: '#6D28D9', accentRing: '#DDD6FE' },
];

export default function WalletDeck({
  chips,
  currentBet,
  isBanker,
  isCommitted = false,
  players,
  onRotateBanker,
  onCommitBet,
  onOpenTopUpModal,
  onAdjustChips,
}: WalletDeckProps) {
  const [stagedBet, setStagedBet] = useState<number>(0);
  const [showCustom, setShowCustom] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<number>(5);
  const [showChangeDealerModal, setShowChangeDealerModal] = useState<boolean>(false);

  const prankHoldTimer3s = useRef<number | null>(null);
  const prankHoldTimer5s = useRef<number | null>(null);
  const prankAccumulated = useRef<number>(0);
  const pressStart = useRef<number>(0);

  const availableChips = chips - stagedBet;

  const handleStageChip = (amount: number) => {
    if (isCommitted) return;
    if (availableChips >= amount) {
      setStagedBet(prev => prev + amount);
      playSound('clink');
    }
  };

  const handleCommit = () => {
    if (isCommitted) return;
    if (stagedBet > 0 && stagedBet <= chips) {
      onCommitBet(stagedBet);
      setStagedBet(0);
      playSound('clink');
    }
  };

  const handleReset = () => {
    if (isCommitted) return;
    setStagedBet(0);
    playSound('pop');
  };

  const handleResetPointerDown = () => {
    pressStart.current = Date.now();

    // 3 seconds: Add +10 tokens secretly
    prankHoldTimer3s.current = window.setTimeout(() => {
      if (onAdjustChips) {
        onAdjustChips(10);
        prankAccumulated.current += 10;
        playSound('clink');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([40, 40, 40]);
          } catch {
            // ignore
          }
        }
      }
    }, 3000);

    // 5 seconds: Prank reveal - re-deduct all accumulated prank tokens
    prankHoldTimer5s.current = window.setTimeout(() => {
      if (onAdjustChips && prankAccumulated.current > 0) {
        onAdjustChips(-prankAccumulated.current);
        prankAccumulated.current = 0;
        playSound('pop');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            // ignore
          }
        }
      }
    }, 5000);
  };

  const handleResetPointerUp = () => {
    if (prankHoldTimer3s.current) clearTimeout(prankHoldTimer3s.current);
    if (prankHoldTimer5s.current) clearTimeout(prankHoldTimer5s.current);
    prankHoldTimer3s.current = null;
    prankHoldTimer5s.current = null;

    const duration = Date.now() - pressStart.current;
    if (duration < 600) {
      handleReset();
    }
  };

  const handleCustomAdd = () => {
    if (isCommitted) return;
    if (customAmount > 0 && availableChips >= customAmount) {
      setStagedBet(prev => prev + customAmount);
      setShowCustom(false);
      playSound('clink');
    }
  };

  return (
    <div className="bg-[#180306]/95 rounded-[28px] p-3.5 sm:p-4 shadow-[0_12px_36px_rgba(0,0,0,0.7)] border-2 border-[#D4AF37]/50 w-full max-w-md mx-auto touch-none select-none flex flex-col gap-2.5 text-white">
      {/* Top Header Row: Role Banner & Top-up / Cash-out Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isBanker ? (
            <button
              type="button"
              onClick={() => setShowChangeDealerModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-black text-[#FDE047] bg-gradient-to-r from-[#3D0A14] to-[#250409] hover:brightness-125 px-2.5 py-1 rounded-xl border border-[#D4AF37]/60 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Change Dealer</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-200">
              <Wallet className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Casino Chips</span>
            </div>
          )}
          {isCommitted && currentBet > 0 && (
            <span className="text-[10px] font-black text-[#34D399] bg-[#064E3B] px-2 py-0.5 rounded-lg border border-[#059669]/60">
              Bet: {currentBet}
            </span>
          )}
        </div>

        {/* Top-Up / Cash-Out Button */}
        <button
          type="button"
          onClick={onOpenTopUpModal}
          className="text-[10px] font-black text-[#FDE047] bg-[#2C060D] hover:bg-[#3D0A14] px-2.5 py-1 rounded-xl border border-[#D4AF37]/50 flex items-center gap-1 transition-all active:scale-95 shadow-xs"
        >
          <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Top-up / Cash-out</span>
        </button>
      </div>

      {/* Dealer vs Player View: Dealers cover bets and do not place bets */}
      {isBanker ? (
        <div className="bg-[#240409] border border-[#D4AF37]/40 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#3B070F] border border-[#D4AF37]/60 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-100">Dealer Bankroll</div>
              <div className="text-[10px] font-bold text-amber-200/70">
                Covering all bets on the table. Click players to mark decisions.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowChangeDealerModal(true)}
            className="text-[10px] font-black text-[#FDE047] bg-[#3B070F] hover:bg-[#5C0A17] px-2.5 py-1 rounded-xl border border-[#D4AF37]/50 shrink-0 cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            Change Dealer
          </button>
        </div>
      ) : (
        <>
          {/* Staged Bet Bar: Hidden once committed to save space until next round */}
          {!isCommitted && (
            <div className="bg-[#240409] border border-[#D4AF37]/50 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex flex-col">
                <div className="text-[10px] font-extrabold text-[#FCD34D] uppercase tracking-wider">
                  Staged Bet
                </div>
                <div className="text-sm font-black text-white">
                  {stagedBet}{' '}
                  <span className="text-[10px] font-bold text-[#FDE047]">tokens</span>
                </div>
              </div>

              {/* Reset and Commit Action Buttons with 3s (+10) / 5s (prank reveal) long-press */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={stagedBet === 0}
                  onPointerDown={handleResetPointerDown}
                  onPointerUp={handleResetPointerUp}
                  onPointerLeave={handleResetPointerUp}
                  onContextMenu={e => e.preventDefault()}
                  className="bg-[#3B0707] hover:bg-[#5C0A0A] disabled:opacity-30 text-[#FCA5A5] border border-[#DC2626]/50 font-black text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-all active:scale-95 select-none"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  disabled={stagedBet <= 0}
                  onClick={handleCommit}
                  className="bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 disabled:opacity-35 text-[#451A03] font-black text-xs py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Commit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCustom(!showCustom)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    showCustom
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] border-[#FCD34D]'
                      : 'bg-[#30050B] text-amber-200 border-[#D4AF37]/50 hover:bg-[#450912]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Custom Amount Bar */}
          {!isCommitted && showCustom && (
            <div className="p-2 bg-[#200408] rounded-xl border border-[#D4AF37]/40 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCustomAmount(prev => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-lg bg-[#3B070F] text-[#FDE047] font-black text-xs flex items-center justify-center border border-[#D4AF37]/50 hover:bg-[#500A15]"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={availableChips}
                  value={customAmount}
                  onChange={e => setCustomAmount(parseInt(e.target.value, 10) || 1)}
                  className="w-14 text-center text-xs font-black text-white bg-[#140103] border border-[#D4AF37]/50 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                />
                <button
                  type="button"
                  onClick={() => setCustomAmount(prev => Math.min(availableChips, prev + 1))}
                  className="w-6 h-6 rounded-lg bg-[#3B070F] text-[#FDE047] font-black text-xs flex items-center justify-center border border-[#D4AF37]/50 hover:bg-[#500A15]"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleCustomAdd}
                disabled={availableChips < customAmount || customAmount <= 0}
                className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:brightness-110 disabled:opacity-35 text-[#451A03] font-black text-xs py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
              >
                <span>+ Stage {customAmount} Tokens</span>
              </button>
            </div>
          )}

          {/* Horizontal Scrollable Draggable Casino Chip Rack with Dedicated Tray Styling */}
          <div className="relative w-full bg-[#120104] rounded-2xl p-2 sm:p-2.5 border border-[#D4AF37]/35 shadow-inner">
            <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-1.5 px-2 touch-pan-x items-center">
              {CASINO_DENOMINATIONS.map(denom => (
                <DraggableChip
                  key={denom.val}
                  amount={denom.val}
                  label={denom.label}
                  clayColor={denom.clayColor}
                  stripeColor={denom.stripeColor}
                  textColor={denom.textColor}
                  accentRing={denom.accentRing}
                  disabled={isCommitted || availableChips < denom.val}
                  onBet={handleStageChip}
                />
              ))}

              {/* ALL-IN Casino Chip (Onyx Black & Gold) */}
              <DraggableChip
                amount={availableChips}
                label="ALL IN"
                subLabel="MAX"
                clayColor="#18181B"
                stripeColor="#F59E0B"
                inlayBg="#09090B"
                textColor="#FDE047"
                accentRing="#F59E0B"
                disabled={isCommitted || availableChips <= 0}
                onBet={handleStageChip}
              />
            </div>
          </div>
        </>
      )}

      {/* Change Dealer Modal: Array of existing other players as clickable button list */}
      <AnimatePresence>
        {showChangeDealerModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1C0206] via-[#2D040A] to-[#120104] border-2 border-[#D4AF37]/60 rounded-3xl p-5 max-w-xs w-full shadow-2xl text-white relative"
            >
              <button
                type="button"
                onClick={() => setShowChangeDealerModal(false)}
                className="absolute top-3 right-3 text-amber-200/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-base font-black text-amber-100 flex items-center gap-1.5 mb-1">
                <Crown className="w-5 h-5 text-[#F59E0B]" />
                <span>Change Dealer</span>
              </h4>
              <p className="text-xs text-amber-200/80 mb-3">
                Select a player to crown as the new Dealer:
              </p>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {Object.values(players || {})
                  .filter(p => !p.isBanker)
                  .map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (onRotateBanker) {
                          onRotateBanker(p.id);
                        }
                        setShowChangeDealerModal(false);
                        playSound('win');
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#180206] hover:bg-[#3B070F] border border-[#D4AF37]/40 text-left transition-all active:scale-98 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center border border-[#D4AF37]/60 bg-black/40 text-amber-300 font-black text-xs shrink-0"
                          style={{ backgroundColor: p.avatarColor ? `${p.avatarColor}33` : undefined }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white group-hover:text-amber-200">
                            {p.name}
                          </div>
                          <div className="text-[10px] font-bold text-amber-300/80">
                            {p.chips} tokens
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-[#451A03] bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-2.5 py-1 rounded-xl shadow-xs">
                        Crown
                      </span>
                    </button>
                  ))}

                {Object.values(players || {}).filter(p => !p.isBanker).length === 0 && (
                  <div className="p-4 rounded-2xl bg-[#140103] border border-[#D4AF37]/25 text-center text-xs text-amber-200/70 font-bold">
                    No other players at the table to crown.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
