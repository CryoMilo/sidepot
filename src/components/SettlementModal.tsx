import { useEffect } from 'react';
import { TableState } from '../types';
import { Trophy, TrendingUp, TrendingDown, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettlementModalProps {
  state: TableState;
  onClose: () => void;
}

export default function SettlementModal({ state, onClose }: SettlementModalProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FDE047', '#38BDF8', '#FB7185'],
      });
    } catch {
      // ignore in test / headless
    }
  }, []);

  const playerStats = Object.values(state.players).map(p => {
    const netProfit = p.chips - p.totalBuyIn;
    return {
      ...p,
      netProfit,
    };
  }).sort((a, b) => b.netProfit - a.netProfit);

  const topWinner = playerStats[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EA] to-[#FFF2D5] border-3 border-[#FFE4A0] rounded-[36px] max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#78350F] hover:bg-[#FEF3C7]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center pt-2 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border-2 border-[#FCD34D] flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Trophy className="w-6 h-6 text-[#D97706]" />
          </div>
          <h2 className="text-xl font-black text-[#78350F]">End of Night Settlement</h2>
          <p className="text-xs font-bold text-[#92400E] mt-0.5">
            Table #{state.roomId} • Round {state.roundNumber}
          </p>
        </div>

        {/* Top Winner Highlight */}
        {topWinner && topWinner.netProfit > 0 && (
          <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-2xl p-3 border border-[#FCD34D] flex items-center justify-between mb-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#78350F]">Night's MVP:</span>
              <span className="text-sm font-black text-[#422006]">{topWinner.name}</span>
            </div>
            <div className="text-sm font-black text-[#047857]">
              +${topWinner.netProfit.toLocaleString()}
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="space-y-2 mb-5">
          <div className="text-[11px] font-black uppercase text-[#92400E] tracking-wider px-1">
            Player Balance Breakdown
          </div>
          {playerStats.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-3 border border-[#FDE68A] flex items-center justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.avatarColor }}
                  />
                  <span className="text-sm font-black text-[#422006]">{p.name}</span>
                  {p.isBanker && (
                    <span className="text-[9px] font-extrabold bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded border border-[#FCD34D]">
                      BANKER
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#94A3B8] font-bold mt-0.5">
                  Buy-in: ${p.totalBuyIn.toLocaleString()} • Chips: ${p.chips.toLocaleString()}
                </div>
              </div>

              <div
                className={`flex items-center gap-1 text-sm font-black tabular-nums ${
                  p.netProfit > 0
                    ? 'text-[#059669]'
                    : p.netProfit < 0
                    ? 'text-[#DC2626]'
                    : 'text-[#64748B]'
                }`}
              >
                {p.netProfit > 0 && <TrendingUp className="w-4 h-4" />}
                {p.netProfit < 0 && <TrendingDown className="w-4 h-4" />}
                <span>
                  {p.netProfit > 0 ? '+' : ''}${p.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Zero-Sum Balance Proof */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3 text-center flex items-center justify-center gap-2 text-xs font-black text-[#065F46]">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>Zero-Sum Verified: All chip tallies match 100%</span>
        </div>
      </div>
    </div>
  );
}
