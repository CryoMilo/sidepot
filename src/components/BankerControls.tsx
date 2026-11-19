import { useState } from 'react';
import { TableState, BetOutcome } from '../types';
import { MIN_BANKER_TOKENS } from '../utils/gameEngine';
import { Crown, Zap, Flame, ShieldCheck, CheckCheck, AlertCircle, Check, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { playSound } from '../utils/audio';

interface BankerControlsProps {
  state: TableState;
  isCurrentPlayerBanker: boolean;
  isHost: boolean;
  onResolveBet: (playerId: string, outcome: BetOutcome) => void;
  onRotateBanker: (newBankerId: string) => void;
  onAdvancePhase: (nextPhase: any) => void;
}

export default function BankerControls({
  state,
  isCurrentPlayerBanker,
  isHost,
  onResolveBet,
  onRotateBanker,
  onAdvancePhase,
}: BankerControlsProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const activeBanker = state.players[state.bankerId];
  const activeBetPlayers = Object.values(state.players).filter(
    p => !p.isBanker && p.currentBet > 0
  );

  const canManageBanker = isHost || isCurrentPlayerBanker;
  const isBankerDepleted = activeBanker ? activeBanker.chips <= 0 : false;

  const handleResolve = (playerId: string, outcome: BetOutcome) => {
    if (outcome === 'COLLECT' || outcome === 'COLLECT_2X' || outcome === 'COLLECT_3X') playSound('pop');
    else if (outcome === 'WIN_1X' || outcome === 'SHAN_2X' || outcome === 'MEE_3X') playSound('win');
    else playSound('clink');

    onResolveBet(playerId, outcome);
    setExpandedPlayerId(null);
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
    <div className="bg-[#FFF9EB] border-2 border-[#FDE68A] rounded-[24px] p-3 w-full max-w-md mx-auto shadow-sm flex flex-col gap-2">
      {/* Banker Status Header (Simplified, No Duplicate Stack Display) */}
      <div className="flex items-center justify-between pb-2 border-b border-[#FDE68A]/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#B45309]" />
          </div>
          <div>
            <div className="text-xs font-black text-[#78350F]">
              Dealer: {activeBanker ? activeBanker.name : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Rotate Banker Control */}
        {canManageBanker ? (
          <select
            value={state.bankerId}
            onChange={e => onRotateBanker(e.target.value)}
            className="text-[11px] font-black bg-white border border-[#FCD34D] text-[#78350F] py-1 px-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          >
            {Object.values(state.players).map(p => {
              const eligible = p.chips >= MIN_BANKER_TOKENS;
              return (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={!eligible && p.id !== state.bankerId}
                >
                  Crown {p.name} {eligible ? '' : '(Needs 20+)'}
                </option>
              );
            })}
          </select>
        ) : (
          <span className="text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-lg border border-[#FCD34D]">
            Active Dealer
          </span>
        )}
      </div>

      {/* Banker Depleted Warning */}
      {isBankerDepleted && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-2 flex items-center gap-1.5 text-xs font-black text-[#991B1B]">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>Dealer Bankroll Depleted! Transfer tokens via debt to continue.</span>
        </div>
      )}

      {/* Active Bets Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#92400E] tracking-wider px-0.5">
          <span>Active Bets ({activeBetPlayers.length})</span>
          {activeBetPlayers.length > 1 && isCurrentPlayerBanker && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePayAll1x}
                className="text-[10px] font-black text-[#059669] hover:underline"
              >
                Pay All 1x
              </button>
              <button
                type="button"
                onClick={handleCollectAll}
                className="text-[10px] font-black text-[#DC2626] hover:underline"
              >
                Collect All
              </button>
            </div>
          )}
        </div>

        {activeBetPlayers.length === 0 ? (
          <div className="bg-white/80 rounded-xl p-2.5 text-center border border-[#FDE68A]">
            <CheckCheck className="w-5 h-5 text-[#16A34A] mx-auto mb-0.5" />
            <div className="text-xs font-black text-[#78350F]">All bets resolved</div>
            {canManageBanker && (
              <button
                type="button"
                onClick={() => onAdvancePhase('BETTING')}
                className="mt-2 text-xs font-black bg-[#F59E0B] hover:bg-[#D97706] text-white px-3.5 py-1.5 rounded-xl shadow-sm transition-transform active:scale-95"
              >
                Start Next Round #{state.roundNumber + 1}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeBetPlayers.map(player => {
              const isExpanded = expandedPlayerId === player.id;
              return (
                <div
                  key={player.id}
                  className="bg-white rounded-xl p-2 border border-[#FDE68A] shadow-sm flex flex-col gap-1.5"
                >
                  {/* Clickable Header Row: Click to Expand / Collapse */}
                  <div
                    onClick={() =>
                      isCurrentPlayerBanker &&
                      setExpandedPlayerId(isExpanded ? null : player.id)
                    }
                    className={`flex items-center justify-between ${
                      isCurrentPlayerBanker
                        ? 'cursor-pointer hover:bg-[#FFFDF9] py-0.5'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: player.avatarColor }}
                      />
                      <span className="text-xs font-black text-[#422006]">{player.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {player.isCommitted ? (
                        <span className="text-[9px] font-black text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          <span>Ready</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Staging</span>
                        </span>
                      )}
                      <span className="text-xs font-black text-[#D97706]">
                        {player.currentBet} tkn
                      </span>

                      {/* Expand / Collapse Action Badge for Dealer */}
                      {isCurrentPlayerBanker && (
                        <span className="text-[10px] font-black text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-lg border border-[#FCD34D] flex items-center gap-0.5 ml-1">
                          <span>{isExpanded ? 'Close' : 'Resolve'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resolution Buttons Revealed on Click */}
                  {isCurrentPlayerBanker && isExpanded && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-[#FDE68A]/60 animate-fadeIn">
                      {/* Row 1: Player Wins & Push */}
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'WIN_1X')}
                          className="text-[10px] font-black bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] py-1 rounded-lg hover:bg-[#D1FAE5] active:scale-95 transition-all text-center"
                        >
                          1x Win
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'SHAN_2X')}
                          className="text-[10px] font-black bg-[#FFFBEB] border border-[#FCD34D] text-[#92400E] py-1 rounded-lg hover:bg-[#FEF3C7] active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Zap className="w-2.5 h-2.5 text-[#D97706]" />
                          <span>2x Shan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'MEE_3X')}
                          className="text-[10px] font-black bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] py-1 rounded-lg hover:bg-[#FEE2E2] active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Flame className="w-2.5 h-2.5 text-[#DC2626]" />
                          <span>3x Mee</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'PUSH')}
                          className="text-[10px] font-black bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] py-1 rounded-lg hover:bg-[#F1F5F9] active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-[#64748B]" />
                          <span>Push</span>
                        </button>
                      </div>

                      {/* Row 2: Dealer Wins (Collect 1x, Dealer Shan 2x, Dealer Mee 3x) */}
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'COLLECT')}
                          className="text-[10px] font-black bg-[#7F1D1D] hover:bg-[#991B1B] text-white py-1 rounded-lg active:scale-95 transition-all text-center"
                        >
                          Collect 1x
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'COLLECT_2X')}
                          className="text-[10px] font-black bg-[#991B1B] hover:bg-[#B91C1C] text-[#FEF08A] py-1 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Zap className="w-2.5 h-2.5 text-[#FEF08A]" />
                          <span>Dealer Shan 2x</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'COLLECT_3X')}
                          className="text-[10px] font-black bg-[#450A0A] hover:bg-[#5E0D0D] text-[#FECACA] py-1 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Flame className="w-2.5 h-2.5 text-[#F87171]" />
                          <span>Dealer Mee 3x</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
