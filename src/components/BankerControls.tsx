import { TableState, BetOutcome } from '../types';
import { Crown, Zap, Flame, ShieldCheck, CheckCheck, AlertCircle, PlusCircle } from 'lucide-react';
import { playSound } from '../utils/audio';

interface BankerControlsProps {
  state: TableState;
  isCurrentPlayerBanker: boolean;
  isHost: boolean;
  onResolveBet: (playerId: string, outcome: BetOutcome) => void;
  onRotateBanker: (newBankerId: string) => void;
  onAdvancePhase: (nextPhase: any) => void;
  onTopUpBanker: (amount: number) => void;
}

export default function BankerControls({
  state,
  isCurrentPlayerBanker,
  isHost,
  onResolveBet,
  onRotateBanker,
  onAdvancePhase,
  onTopUpBanker,
}: BankerControlsProps) {
  const activeBanker = state.players[state.bankerId];
  const activeBetPlayers = Object.values(state.players).filter(
    p => !p.isBanker && p.currentBet > 0
  );

  const canManageBanker = isHost || isCurrentPlayerBanker;
  const isBankerDepleted = activeBanker ? activeBanker.chips <= 0 : false;

  const handleResolve = (playerId: string, outcome: BetOutcome) => {
    if (outcome === 'COLLECT') playSound('pop');
    else if (outcome === 'WIN_1X' || outcome === 'SHAN_2X' || outcome === 'MEE_3X') playSound('win');
    else playSound('clink');

    onResolveBet(playerId, outcome);
  };

  const handleCollectAll = () => {
    activeBetPlayers.forEach(p => {
      onResolveBet(p.id, 'COLLECT');
    });
    playSound('pop');
  };

  const handlePayAll1x = () => {
    activeBetPlayers.forEach(p => {
      onResolveBet(p.id, 'WIN_1X');
    });
    playSound('win');
  };

  return (
    <div className="bg-[#FFF9EB] border-2 border-[#FDE68A] rounded-[28px] p-5 w-full max-w-md mx-auto shadow-md">
      {/* Banker Status Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#FDE68A]/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#B45309]" />
          </div>
          <div>
            <div className="text-xs font-black text-[#78350F]">
              Banker: {activeBanker ? activeBanker.name : 'Unknown'}
            </div>
            <div
              className={`text-[10px] font-black ${
                isBankerDepleted ? 'text-[#DC2626]' : 'text-[#92400E]'
              }`}
            >
              Stack: ${activeBanker ? activeBanker.chips.toLocaleString() : 0}
            </div>
          </div>
        </div>

        {/* Rotate Banker Control - Restricted to Host or Active Banker */}
        {canManageBanker ? (
          <select
            value={state.bankerId}
            onChange={e => onRotateBanker(e.target.value)}
            className="text-xs font-extrabold bg-white border border-[#FCD34D] text-[#78350F] py-1 px-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          >
            {Object.values(state.players).map(p => (
              <option key={p.id} value={p.id}>
                Crown {p.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] px-2.5 py-1 rounded-lg border border-[#FCD34D]">
            Active Dealer
          </span>
        )}
      </div>

      {/* Banker Depleted Warning */}
      {isBankerDepleted && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-2.5 mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#991B1B]">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            <span>Bankroll Depleted!</span>
          </div>
          {isCurrentPlayerBanker && (
            <button
              onClick={() => onTopUpBanker(5000)}
              className="text-[11px] font-black bg-[#DC2626] text-white px-2.5 py-1 rounded-xl flex items-center gap-1 hover:bg-[#B91C1C] transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+$5k Rebuy</span>
            </button>
          )}
        </div>
      )}

      {/* Bets to Resolve */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-black uppercase text-[#92400E] tracking-wider">
          <span>Active Bets ({activeBetPlayers.length})</span>
          {activeBetPlayers.length > 1 && isCurrentPlayerBanker && (
            <div className="flex gap-2">
              <button
                onClick={handlePayAll1x}
                className="text-[10px] font-black text-[#059669] hover:underline"
              >
                Pay All 1x
              </button>
              <button
                onClick={handleCollectAll}
                className="text-[10px] font-black text-[#DC2626] hover:underline"
              >
                Collect All
              </button>
            </div>
          )}
        </div>

        {activeBetPlayers.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-4 text-center border border-[#FDE68A]">
            <CheckCheck className="w-6 h-6 text-[#16A34A] mx-auto mb-1" />
            <div className="text-xs font-black text-[#78350F]">All bets resolved!</div>
            <p className="text-[11px] text-[#92400E] mt-0.5">
              Ready to deal physical cards or start next hand.
            </p>
            {canManageBanker && (
              <button
                onClick={() => onAdvancePhase('BETTING')}
                className="mt-3 text-xs font-black bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2 rounded-xl shadow-sm transition-transform active:scale-95"
              >
                Start Next Round #{state.roundNumber + 1}
              </button>
            )}
          </div>
        ) : (
          activeBetPlayers.map(player => (
            <div
              key={player.id}
              className="bg-white rounded-2xl p-3 border border-[#FDE68A] shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: player.avatarColor }}
                  />
                  <span className="text-sm font-black text-[#422006]">{player.name}</span>
                </div>
                <div className="text-xs font-extrabold text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                  Bet: ${player.currentBet.toLocaleString()}
                </div>
              </div>

              {/* Action Resolution Buttons */}
              {isCurrentPlayerBanker ? (
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <button
                    onClick={() => handleResolve(player.id, 'WIN_1X')}
                    className="text-[10px] font-extrabold bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] py-1.5 rounded-lg hover:bg-[#D1FAE5] active:scale-95 transition-all text-center"
                  >
                    1x Win
                  </button>
                  <button
                    onClick={() => handleResolve(player.id, 'SHAN_2X')}
                    className="text-[10px] font-extrabold bg-[#FFFBEB] border border-[#FCD34D] text-[#92400E] py-1.5 rounded-lg hover:bg-[#FEF3C7] active:scale-95 transition-all flex items-center justify-center gap-0.5"
                  >
                    <Zap className="w-2.5 h-2.5 text-[#D97706]" />
                    <span>2x</span>
                  </button>
                  <button
                    onClick={() => handleResolve(player.id, 'MEE_3X')}
                    className="text-[10px] font-extrabold bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] py-1.5 rounded-lg hover:bg-[#FEE2E2] active:scale-95 transition-all flex items-center justify-center gap-0.5"
                  >
                    <Flame className="w-2.5 h-2.5 text-[#DC2626]" />
                    <span>3x</span>
                  </button>
                  <button
                    onClick={() => handleResolve(player.id, 'PUSH')}
                    className="text-[10px] font-extrabold bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] py-1.5 rounded-lg hover:bg-[#F1F5F9] active:scale-95 transition-all flex items-center justify-center gap-0.5"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-[#64748B]" />
                    <span>Push</span>
                  </button>
                  <button
                    onClick={() => handleResolve(player.id, 'COLLECT')}
                    className="text-[10px] font-extrabold bg-[#7F1D1D] text-white py-1.5 rounded-lg hover:bg-[#991B1B] active:scale-95 transition-all text-center"
                  >
                    Collect
                  </button>
                </div>
              ) : (
                <div className="text-[11px] font-medium text-[#94A3B8] italic text-center py-1">
                  Awaiting Banker decision...
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
