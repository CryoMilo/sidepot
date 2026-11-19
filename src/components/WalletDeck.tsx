import React, { useState } from 'react';
import { Wallet, ArrowUp, PlusCircle } from 'lucide-react';
import DraggableChip from './DraggableChip';

interface WalletDeckProps {
  chips: number;
  currentBet: number;
  isBanker: boolean;
  onBet: (amount: number) => void;
  onTopUp: (amount: number) => void;
}

export default function WalletDeck({
  chips,
  currentBet,
  isBanker,
  onBet,
  onTopUp,
}: WalletDeckProps) {
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-[0_16px_36px_rgba(180,83,9,0.08)] border-2 border-[#FFF1CD] w-full max-w-md mx-auto">
      {/* Wallet Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[#92400E]">
          <Wallet className="w-4 h-4 text-[#92400E]" />
          <span>Your Stack</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xl font-black text-[#D97706] tabular-nums">
            ${chips.toLocaleString()}
          </div>
          <button
            onClick={() => setShowTopUp(true)}
            className="text-[11px] font-extrabold text-[#B45309] bg-[#FEF3C7] hover:bg-[#FDE68A] px-2.5 py-1 rounded-full border border-[#FCD34D] flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Rebuy</span>
          </button>
        </div>
      </div>

      {/* Current Round Bet indicator */}
      {currentBet > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-3 py-1.5 mb-3 flex items-center justify-between text-xs font-bold text-[#B45309]">
          <span>Bet in this round:</span>
          <span className="font-extrabold text-[#78350F]">${currentBet.toLocaleString()}</span>
        </div>
      )}

      {/* Drag instruction */}
      {!isBanker ? (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#B45309] my-2">
          <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
          <span>Drag or flick a chip UP into the Golden Jar</span>
        </div>
      ) : (
        <div className="text-center text-[11px] font-extrabold text-[#D97706] bg-[#FEF3C7] py-1.5 rounded-xl my-2">
          👑 You are the Banker! You collect & pay bets from your stack.
        </div>
      )}

      {/* Chips Rack */}
      {!isBanker && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="h-24 rounded-2xl bg-[#FFFBF0] border-2 border-dashed border-[#FDE68A] flex items-center justify-center">
            <DraggableChip
              amount={100}
              label="+100"
              gradientClass="bg-[radial-gradient(circle_at_35%_30%,#38BDF8,#0284C7)]"
              textColor="#FFFFFF"
              disabled={chips < 100}
              onBet={onBet}
            />
          </div>

          <div className="h-24 rounded-2xl bg-[#FFFBF0] border-2 border-dashed border-[#FDE68A] flex items-center justify-center">
            <DraggableChip
              amount={500}
              label="+500"
              gradientClass="bg-[radial-gradient(circle_at_35%_30%,#FDE047,#D97706)]"
              textColor="#78350F"
              disabled={chips < 500}
              onBet={onBet}
            />
          </div>

          <div className="h-24 rounded-2xl bg-[#FFFBF0] border-2 border-dashed border-[#FDE68A] flex items-center justify-center">
            <DraggableChip
              amount={1000}
              label="+1K"
              gradientClass="bg-[radial-gradient(circle_at_35%_30%,#FB7185,#E11D48)]"
              textColor="#FFFFFF"
              disabled={chips < 1000}
              onBet={onBet}
            />
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      {showTopUp && (
        <div className="mt-4 pt-3 border-t border-dashed border-[#FDE68A] flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#92400E]">Add Chips:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                onTopUp(1000);
                setShowTopUp(false);
              }}
              className="text-xs font-extrabold bg-[#FFFDF9] border border-[#FCD34D] hover:bg-[#FEF3C7] text-[#92400E] px-2.5 py-1 rounded-lg"
            >
              +$1,000
            </button>
            <button
              onClick={() => {
                onTopUp(5000);
                setShowTopUp(false);
              }}
              className="text-xs font-extrabold bg-[#FFFDF9] border border-[#FCD34D] hover:bg-[#FEF3C7] text-[#92400E] px-2.5 py-1 rounded-lg"
            >
              +$5,000
            </button>
            <button
              onClick={() => setShowTopUp(false)}
              className="text-xs font-bold text-[#94A3B8] px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
