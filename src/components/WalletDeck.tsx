import { useState } from 'react';
import { Wallet, ArrowUp, PlusCircle, Crown, Sliders, Check } from 'lucide-react';
import DraggableChip from './DraggableChip';

interface WalletDeckProps {
  chips: number;
  currentBet: number;
  isBanker: boolean;
  onBet: (amount: number) => void;
  onTopUp: (amount: number) => void;
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
  onBet,
  onTopUp,
}: WalletDeckProps) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(7);

  const handleCustomBet = () => {
    if (customAmount > 0 && customAmount <= chips) {
      onBet(customAmount);
      setShowCustom(false);
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-3.5 shadow-[0_12px_30px_rgba(180,83,9,0.08)] border-2 border-[#FFF1CD] w-full max-w-md mx-auto touch-none select-none">
      {/* Wallet Bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#92400E]">
          {isBanker ? (
            <>
              <Crown className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Dealer Stack</span>
            </>
          ) : (
            <>
              <Wallet className="w-3.5 h-3.5 text-[#92400E]" />
              <span>Your Stack</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-lg font-black text-[#D97706] tabular-nums">
            {chips} <span className="text-[11px] font-bold text-[#92400E]">Tokens</span>
          </div>
          <button
            onClick={() => setShowTopUp(!showTopUp)}
            className="text-[10px] font-extrabold text-[#B45309] bg-[#FEF3C7] hover:bg-[#FDE68A] px-2 py-0.5 rounded-full border border-[#FCD34D] flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Top Up</span>
          </button>
        </div>
      </div>

      {/* Current Bet info / Role banner */}
      <div className="flex items-center justify-between text-[11px] font-extrabold mb-1.5 px-0.5">
        {currentBet > 0 ? (
          <div className="text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-lg border border-[#FDE68A]">
            Current Bet: <span className="text-[#78350F] font-black">{currentBet} tokens</span>
          </div>
        ) : (
          <div className="text-[#B45309] flex items-center gap-1">
            <ArrowUp className="w-3 h-3 animate-bounce" />
            <span>Flick or tap a token UP to bet</span>
          </div>
        )}

        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all ${
            showCustom
              ? 'bg-[#F59E0B] text-white border-[#D97706]'
              : 'bg-[#FFFDF9] text-[#92400E] border-[#FCD34D] hover:bg-[#FEF3C7]'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Custom</span>
        </button>
      </div>

      {/* Custom Amount Bar */}
      {showCustom && (
        <div className="mb-2 p-2 bg-[#FFFDF8] rounded-xl border border-[#FCD34D] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCustomAmount(prev => Math.max(1, prev - 1))}
              className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#92400E] font-black text-sm flex items-center justify-center border border-[#FDE68A]"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={chips}
              value={customAmount}
              onChange={e => setCustomAmount(parseInt(e.target.value, 10) || 1)}
              className="w-16 text-center text-sm font-black text-[#78350F] bg-white border border-[#FCD34D] rounded-lg py-1 focus:outline-none"
            />
            <button
              onClick={() => setCustomAmount(prev => Math.min(chips, prev + 1))}
              className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#92400E] font-black text-sm flex items-center justify-center border border-[#FDE68A]"
            >
              +
            </button>
          </div>

          <button
            onClick={handleCustomBet}
            disabled={chips < customAmount || customAmount <= 0}
            className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-black text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Bet {customAmount} Tokens</span>
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Draggable Chip Tray */}
      <div className="relative w-full">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 touch-pan-x">
          {/* Preset Denominations: 1, 2, 5, 10, 15, 20, 25, 30, 35, 40 */}
          {TOKEN_DENOMINATIONS.map(denom => (
            <DraggableChip
              key={denom.val}
              amount={denom.val}
              label={String(denom.val)}
              gradientClass={denom.gradient}
              textColor={denom.text}
              disabled={chips < denom.val}
              onBet={onBet}
            />
          ))}

          {/* ALL-IN Chip */}
          <DraggableChip
            amount={chips}
            label="ALL IN"
            subLabel={`${chips} TKN`}
            gradientClass="bg-[radial-gradient(circle_at_35%_30%,#A855F7,#7E22CE)]"
            textColor="#FFFFFF"
            disabled={chips <= 0}
            onBet={onBet}
          />
        </div>
      </div>

      {/* Top-Up Rebuy Bar */}
      {showTopUp && (
        <div className="mt-2.5 pt-2 border-t border-dashed border-[#FDE68A] flex items-center justify-between gap-1.5">
          <span className="text-[11px] font-bold text-[#92400E]">Add Tokens:</span>
          <div className="flex gap-1.5">
            {[20, 50, 100].map(amt => (
              <button
                key={amt}
                onClick={() => {
                  onTopUp(amt);
                  setShowTopUp(false);
                }}
                className="text-[11px] font-black bg-[#FFFDF9] border border-[#FCD34D] hover:bg-[#FEF3C7] text-[#92400E] px-2.5 py-1 rounded-lg"
              >
                +{amt}
              </button>
            ))}
            <button
              onClick={() => setShowTopUp(false)}
              className="text-[10px] font-bold text-[#94A3B8] px-1 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
