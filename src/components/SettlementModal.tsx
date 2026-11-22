import { useEffect } from 'react';
import { TableState } from '../types';
import { Trophy, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { verifyZeroSum } from '../utils/gameEngine';
import confetti from 'canvas-confetti';

interface SettlementModalProps {
  state: TableState;
  onClose: () => void;
}

export default function SettlementModal({ state, onClose }: SettlementModalProps) {
  const { balanced, netDiscrepancy } = verifyZeroSum(state);
  const isPotUnsettled = state.pot > 0;

  useEffect(() => {
    if (balanced && !isPotUnsettled) {
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
    }
  }, [balanced, isPotUnsettled]);

  const playerStats = Object.values(state.players).map(p => {
    const netProfit = p.chips - p.totalBuyIn;
    return {
      ...p,
      netProfit,
    };
  }).sort((a, b) => b.netProfit - a.netProfit);

  const topWinner = playerStats[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#082418] via-[#0b2f1f] to-[#05160e] border-2 border-[#D4AF37]/50 rounded-[36px] max-w-md w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative max-h-[90vh] overflow-y-auto text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#0a291c] border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#12422e] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center pt-2 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#051a11] border-2 border-[#D4AF37]/60 flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Trophy className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <h2 className="text-xl font-black text-amber-100">End of Night Settlement</h2>
          <p className="text-xs font-bold text-emerald-200/70 mt-0.5">
            Table #{state.roomId} • Round {state.roundNumber}
          </p>
        </div>

        {/* Unsettled Pot Warning */}
        {isPotUnsettled && (
          <div className="bg-[#450A0A] border border-[#EF4444]/60 rounded-2xl p-3 mb-4 flex items-center gap-2.5 text-xs font-extrabold text-[#FECACA]">
            <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0" />
            <div>
              <div>Unresolved Pot: {state.pot.toLocaleString()} tokens</div>
              <div className="text-[10px] text-[#FCA5A5] font-semibold mt-0.5">
                Active bets are still on the table. The dealer must resolve all hands before final payout settlement.
              </div>
            </div>
          </div>
        )}

        {/* Top Winner Highlight */}
        {topWinner && topWinner.netProfit > 0 && !isPotUnsettled && (
          <div className="bg-gradient-to-r from-[#064E3B] to-[#0a291c] rounded-2xl p-3 border border-[#D4AF37]/50 flex items-center justify-between mb-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-200">Night's MVP:</span>
              <span className="text-sm font-black text-white">{topWinner.name}</span>
            </div>
            <div className="text-sm font-black text-[#34D399]">
              +{topWinner.netProfit.toLocaleString()} tokens
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="space-y-2 mb-5">
          <div className="text-[11px] font-black uppercase text-[#FCD34D] tracking-wider px-1">
            Player Balance Breakdown
          </div>
          {playerStats.map(p => (
            <div
              key={p.id}
              className="bg-[#061c13] rounded-2xl p-3 border border-[#D4AF37]/35 flex items-center justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-black/40"
                    style={{ backgroundColor: p.avatarColor }}
                  />
                  <span className="text-sm font-black text-white">{p.name}</span>
                  {p.isBanker && (
                    <span className="text-[9px] font-extrabold bg-[#051a11] text-[#FDE047] px-1.5 py-0.5 rounded border border-[#D4AF37]/40">
                      DEALER
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-emerald-200/60 font-bold mt-0.5">
                  Buy-in: {p.totalBuyIn.toLocaleString()} • Chips: {p.chips.toLocaleString()}
                </div>
              </div>

              <div
                className={`flex items-center gap-1 text-sm font-black tabular-nums ${
                  p.netProfit > 0
                    ? 'text-[#34D399]'
                    : p.netProfit < 0
                    ? 'text-[#F87171]'
                    : 'text-[#94A3B8]'
                }`}
              >
                {p.netProfit > 0 && <TrendingUp className="w-4 h-4" />}
                {p.netProfit < 0 && <TrendingDown className="w-4 h-4" />}
                <span>
                  {p.netProfit > 0 ? '+' : ''}{p.netProfit.toLocaleString()} tokens
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Zero-Sum Balance Proof */}
        {balanced && !isPotUnsettled ? (
          <div className="bg-[#064E3B]/80 border border-[#10B981]/50 rounded-2xl p-3 text-center flex items-center justify-center gap-2 text-xs font-black text-[#A7F3D0]">
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            <span>Zero-Sum Verified: All chip tallies match 100%</span>
          </div>
        ) : (
          <div className="bg-[#78350F]/60 border border-[#F59E0B]/50 rounded-2xl p-2.5 text-center text-xs font-bold text-[#FEF08A]">
            {isPotUnsettled
              ? `Waiting on ${state.pot.toLocaleString()} tokens in active table bets.`
              : `Discrepancy: ${netDiscrepancy.toLocaleString()} tokens`}
          </div>
        )}
      </div>
    </div>
  );
}
