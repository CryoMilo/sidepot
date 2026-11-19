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

const TOKEN_DENOMINATIONS = [
  { val: 1, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#38BDF8,#0284C7)]', text: '#FFFFFF' },
  { val: 2, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#60A5FA,#2563EB)]', text: '#FFFFFF' },
  { val: 5, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#FDE047,#D97706)]', text: '#78350F' },
  { val: 10, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#F59E0B,#B45309)]', text: '#FFFFFF' },
  { val: 15, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#34D399,#059669)]', text: '#FFFFFF' },
  { val: 20, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#10B981,#047857)]', text: '#FFFFFF' },
  { val: 25, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#FB923C,#EA580C)]', text: '#FFFFFF' },
  { val: 30, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#F97316,#C2410C)]', text: '#FFFFFF' },
  { val: 35, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#FB7185,#E11D48)]', text: '#FFFFFF' },
  { val: 40, gradient: 'bg-[radial-gradient(circle_at_35%_30%,#F43F5E,#BE123C)]', text: '#FFFFFF' },
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
      {/* Top Header Row: Stack & Transfer Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isBanker ? (
            <Crown className="w-4 h-4 text-[#D97706]" />
          ) : (
            <Wallet className="w-4 h-4 text-[#92400E]" />
          )}
          <span className="text-xs font-black text-[#78350F]">
            {isBanker ? 'Dealer' : 'You'}:
          </span>
          <span className="text-sm font-black text-[#D97706] tabular-nums">
            {availableChips} tokens
          </span>
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

      {/* Horizontal Scrollable Draggable Chip Rack */}
      <div className="relative w-full">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5 touch-pan-x">
          {TOKEN_DENOMINATIONS.map(denom => (
            <DraggableChip
              key={denom.val}
              amount={denom.val}
              label={String(denom.val)}
              gradientClass={denom.gradient}
              textColor={denom.text}
              disabled={availableChips < denom.val}
              onBet={handleStageChip}
            />
          ))}

          {/* ALL-IN Chip */}
          <DraggableChip
            amount={availableChips}
            label="ALL IN"
            subLabel={`${availableChips} TKN`}
            gradientClass="bg-[radial-gradient(circle_at_35%_30%,#A855F7,#7E22CE)]"
            textColor="#FFFFFF"
            disabled={availableChips <= 0}
            onBet={handleStageChip}
          />
        </div>
      </div>
    </div>
  );
}