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
    <div className="bg-[#082418]/95 border-2 border-[#D4AF37]/50 rounded-[24px] p-3 w-full max-w-md mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-2 text-white">
      {/* Banker Status Header (Simplified, No Duplicate Stack Display) */}
      <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#051a11] border border-[#D4AF37]/60 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-100">
              Dealer: {activeBanker ? activeBanker.name : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Rotate Banker Control */}
        {canManageBanker ? (
          <select
            value={state.bankerId}
            onChange={e => onRotateBanker(e.target.value)}
            className="text-[11px] font-black bg-[#051a11] border border-[#D4AF37]/50 text-amber-200 py-1 px-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
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
          <span className="text-[10px] font-bold text-[#FDE047] bg-[#051a11] px-2 py-0.5 rounded-lg border border-[#D4AF37]/40">
            Active Dealer
          </span>
        )}
      </div>

      {/* Banker Depleted Warning */}
      {isBankerDepleted && (
        <div className="bg-[#450A0A] border border-[#EF4444]/60 rounded-xl p-2 flex items-center gap-1.5 text-xs font-black text-[#FECACA]">
          <AlertCircle className="w-4 h-4 text-[#EF4444]" />
          <span>Dealer Bankroll Depleted! Transfer tokens via debt to continue.</span>
        </div>
      )}

      {/* Active Bets Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#FCD34D] tracking-wider px-0.5">
          <span>Active Bets ({activeBetPlayers.length})</span>
          {activeBetPlayers.length > 1 && isCurrentPlayerBanker && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePayAll1x}
                className="text-[10px] font-black text-[#34D399] hover:underline"
              >
                Pay All 1x
              </button>
              <button
                type="button"
                onClick={handleCollectAll}
                className="text-[10px] font-black text-[#F87171] hover:underline"
              >
                Collect All
              </button>
            </div>
          )}
        </div>

        {activeBetPlayers.length === 0 ? (
          <div className="bg-[#051a11]/90 rounded-xl p-2.5 text-center border border-[#D4AF37]/35">
            <CheckCheck className="w-5 h-5 text-[#34D399] mx-auto mb-0.5" />
            <div className="text-xs font-black text-amber-100">All bets resolved</div>
            {canManageBanker && (
              <button
                type="button"
                onClick={() => onAdvancePhase('BETTING')}
                className="mt-2 text-xs font-black bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] px-3.5 py-1.5 rounded-xl shadow-sm transition-transform active:scale-95"
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
                  className="bg-[#0a291c] rounded-xl p-2 border border-[#D4AF37]/35 shadow-md flex flex-col gap-1.5"
                >
                  {/* Clickable Header Row: Click to Expand / Collapse */}
                  <div
                    onClick={() =>
                      isCurrentPlayerBanker &&
                      setExpandedPlayerId(isExpanded ? null : player.id)
                    }
                    className={`flex items-center justify-between ${
                      isCurrentPlayerBanker
                        ? 'cursor-pointer hover:bg-[#0f3827] py-0.5 rounded-lg px-1 transition-colors'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full border border-black/40"
                        style={{ backgroundColor: player.avatarColor }}
                      />
                      <span className="text-xs font-black text-white">{player.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {player.isCommitted ? (
                        <span className="text-[9px] font-black text-[#34D399] bg-[#064E3B] px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-[#059669]/60">
                          <Check className="w-2.5 h-2.5" />
                          <span>Ready</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#FDE047] bg-[#78350F]/60 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-[#F59E0B]/50">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Staging</span>
                        </span>
                      )}
                      <span className="text-xs font-black text-[#FDE047]">
                        {player.currentBet} tkn
                      </span>

                      {/* Expand / Collapse Action Badge for Dealer */}
                      {isCurrentPlayerBanker && (
                        <span className="text-[10px] font-black text-[#FDE047] bg-[#051a11] px-2 py-0.5 rounded-lg border border-[#D4AF37]/45 flex items-center gap-0.5 ml-1">
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
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-[#D4AF37]/30 animate-fadeIn">
                      {/* Row 1: Player Wins & Push */}
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'WIN_1X')}
                          className="text-[10px] font-black bg-[#065F46] hover:bg-[#047857] border border-[#10B981]/50 text-white py-1 rounded-lg active:scale-95 transition-all text-center"
                        >
                          1x Win
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'SHAN_2X')}
                          className="text-[10px] font-black bg-[#78350F] hover:bg-[#92400E] border border-[#F59E0B]/60 text-[#FEF08A] py-1 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Zap className="w-2.5 h-2.5 text-[#FEF08A]" />
                          <span>2x Shan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'MEE_3X')}
                          className="text-[10px] font-black bg-[#831843] hover:bg-[#9D174D] border border-[#F43F5E]/60 text-[#FECDD3] py-1 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Flame className="w-2.5 h-2.5 text-[#FECDD3]" />
                          <span>3x Mee</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'PUSH')}
                          className="text-[10px] font-black bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-[#E2E8F0] py-1 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-[#94A3B8]" />
                          <span>Push</span>
                        </button>
                      </div>

                      {/* Row 2: Dealer Wins (Collect 1x, Dealer Shan 2x, Dealer Mee 3x) */}
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'COLLECT')}
                          className="text-[10px] font-black bg-[#7F1D1D] hover:bg-[#991B1B] text-white border border-[#DC2626]/50 py-1 rounded-lg active:scale-95 transition-all text-center"
                        >
                          Collect 1x
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'COLLECT_2X')}
                          className="text-[10px] font-black bg-gradient-to-r from-[#991B1B] to-[#7F1D1D] hover:brightness-110 text-[#FEF08A] border border-[#EF4444]/60 py-1 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Zap className="w-2.5 h-2.5 text-[#FEF08A]" />
                          <span>Dealer Shan 2x</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(player.id, 'COLLECT_3X')}
                          className="text-[10px] font-black bg-gradient-to-r from-[#450A0A] to-[#7F1D1D] hover:brightness-110 text-[#FECACA] border border-[#DC2626]/60 py-1 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Flame className="w-2.5 h-2.5 text-[#FCA5A5]" />
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
