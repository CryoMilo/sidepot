import { useState } from 'react';
import { Wallet, Crown, RotateCcw, Check, HandCoins, Sliders } from 'lucide-react';
import DraggableChip from './DraggableChip';
import { playSound } from '../utils/audio';

interface WalletDeckProps {
  chips: number;
  currentBet: number;
  isBanker: boolean;
  isCommitted?: boolean;
  onCommitBet: (amount: number) => void;
  onResetBet: () => void;
  onOpenDebtModal: () => void;
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
  onCommitBet,
  onResetBet,
  onOpenDebtModal,
}: WalletDeckProps) {
  const [stagedBet, setStagedBet] = useState<number>(0);
  const [showCustom, setShowCustom] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<number>(5);

  const availableChips = chips - stagedBet;

  const handleStageChip = (amount: number) => {
    if (availableChips >= amount) {
      setStagedBet(prev => prev + amount);
      playSound('pop');
    }
  };

  const handleCommit = () => {
    if (stagedBet > 0 && stagedBet <= chips) {
      onCommitBet(stagedBet);
      setStagedBet(0);
      playSound('win');
    }
  };

  const handleReset = () => {
    setStagedBet(0);
    if (currentBet > 0) {
      onResetBet();
    }
    playSound('pop');
  };

  const handleCustomAdd = () => {
    if (customAmount > 0 && availableChips >= customAmount) {
      setStagedBet(prev => prev + customAmount);
      setShowCustom(false);
      playSound('clink');
    }
  };

  return (
    <div className="bg-white rounded-[26px] p-3 shadow-[0_8px_25px_rgba(180,83,9,0.07)] border-2 border-[#FFF1CD] w-full max-w-md mx-auto touch-none select-none flex flex-col gap-2">
      {/* Top Header Row: Role Banner & Transfer Action (No Repeating Token Counts) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isBanker ? (
            <div className="flex items-center gap-1 text-[11px] font-black text-[#B45309] bg-[#FEF3C7] px-2.5 py-0.5 rounded-xl border border-[#FCD34D]">
              <Crown className="w-3.5 h-3.5 text-[#D97706]" />
              <span>You are Dealer</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#92400E]">
              <Wallet className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Casino Chips</span>
            </div>
          )}
        </div>

        {/* Transfer / QR Debts Button */}
        <button
          type="button"
          onClick={onOpenDebtModal}
          className="text-[10px] font-black text-[#B45309] bg-[#FEF3C7] hover:bg-[#FDE68A] px-2.5 py-1 rounded-xl border border-[#FCD34D] flex items-center gap-1 transition-all active:scale-95"
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span>Transfer / Debts</span>
        </button>
      </div>

      {/* Staged & Committed Bet Bar with Reset and Commit Buttons */}
      <div className="bg-[#FFFDF7] border border-[#FDE68A] rounded-2xl p-2 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <div className="text-[10px] font-extrabold text-[#92400E] uppercase tracking-wider">
            {isCommitted ? 'Bet Committed' : 'Staged Bet'}
          </div>
          <div className="text-sm font-black text-[#78350F]">
            {isCommitted ? currentBet : stagedBet}{' '}
            <span className="text-[10px] font-bold text-[#B45309]">tokens</span>
          </div>
        </div>

        {/* Reset and Commit Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={stagedBet === 0 && currentBet === 0}
            onClick={handleReset}
            className="bg-white hover:bg-[#FEF2F2] disabled:opacity-40 text-[#DC2626] border border-[#FECACA] font-black text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-all active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          {!isCommitted ? (
            <button
              type="button"
              disabled={stagedBet <= 0}
              onClick={handleCommit}
              className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-black text-xs py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Commit</span>
            </button>
          ) : (
            <div className="bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] font-black text-[11px] py-1.5 px-3 rounded-xl flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Ready</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className={`p-1.5 rounded-xl border transition-all ${
              showCustom
                ? 'bg-[#F59E0B] text-white border-[#D97706]'
                : 'bg-white text-[#92400E] border-[#FCD34D] hover:bg-[#FEF3C7]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom Amount Bar */}
      {showCustom && (
        <div className="p-2 bg-[#FFFDF8] rounded-xl border border-[#FCD34D] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCustomAmount(prev => Math.max(1, prev - 1))}
              className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#92400E] font-black text-xs flex items-center justify-center border border-[#FDE68A]"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={availableChips}
              value={customAmount}
              onChange={e => setCustomAmount(parseInt(e.target.value, 10) || 1)}
              className="w-14 text-center text-xs font-black text-[#78350F] bg-white border border-[#FCD34D] rounded-lg py-1 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setCustomAmount(prev => Math.min(availableChips, prev + 1))}
              className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#92400E] font-black text-xs flex items-center justify-center border border-[#FDE68A]"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleCustomAdd}
            disabled={availableChips < customAmount || customAmount <= 0}
            className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-black text-xs py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
          >
            <span>+ Stage {customAmount} Tokens</span>
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Draggable Casino Chip Rack */}
      <div className="relative w-full">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 touch-pan-x">
          {CASINO_DENOMINATIONS.map(denom => (
            <DraggableChip
              key={denom.val}
              amount={denom.val}
              label={denom.label}
              clayColor={denom.clayColor}
              stripeColor={denom.stripeColor}
              textColor={denom.textColor}
              accentRing={denom.accentRing}
              disabled={availableChips < denom.val}
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
            disabled={availableChips <= 0}
            onBet={handleStageChip}
          />
        </div>
      </div>
    </div>
  );
}
