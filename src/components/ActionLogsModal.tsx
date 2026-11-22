import { useState } from 'react';
import {
  X,
  History,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  AlertCircle,
  Coins,
} from 'lucide-react';
import {
  RoundRecord,
  ActionLogEntry,
  PlayerRoundResult,
  HandDecisionOutcome,
  BetMultiplier,
} from '../types';

interface ActionLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundHistory: RoundRecord[];
  logs: ActionLogEntry[];
  isHostOrDealer: boolean;
  currentUserName: string;
  onEditRoundResult: (
    roundNumber: number,
    newResults: PlayerRoundResult[],
    editorName: string,
    reason?: string
  ) => void;
}

export default function ActionLogsModal({
  isOpen,
  onClose,
  roundHistory = [],
  logs = [],
  isHostOrDealer,
  currentUserName,
  onEditRoundResult,
}: ActionLogsModalProps) {
  const [activeTab, setActiveTab] = useState<'ROUNDS' | 'TRANSACTIONS' | 'LOGS'>('ROUNDS');
  const [editingRoundNum, setEditingRoundNum] = useState<number | null>(null);
  const [editableResults, setEditableResults] = useState<PlayerRoundResult[]>([]);
  const [editReason, setEditReason] = useState<string>('');
  const [expandedRounds, setExpandedRounds] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const toggleRoundExpand = (roundNum: number) => {
    setExpandedRounds(prev => ({
      ...prev,
      [roundNum]: !prev[roundNum],
    }));
  };

  const handleStartEdit = (round: RoundRecord) => {
    setEditingRoundNum(round.roundNumber);
    setEditableResults(JSON.parse(JSON.stringify(round.results)));
    setEditReason('');
  };

  const handleOutcomeChange = (playerId: string, outcome: HandDecisionOutcome) => {
    setEditableResults(prev =>
      prev.map(r => {
        if (r.playerId !== playerId) return r;
        let delta = 0;
        if (outcome === 'WIN') delta = r.bet * r.multiplier;
        else if (outcome === 'LOSE') delta = -(r.bet * r.multiplier);
        else delta = 0;
        return { ...r, outcome, tokenDelta: delta };
      })
    );
  };

  const handleMultiplierChange = (playerId: string, multiplier: BetMultiplier) => {
    setEditableResults(prev =>
      prev.map(r => {
        if (r.playerId !== playerId) return r;
        let delta = 0;
        if (r.outcome === 'WIN') delta = r.bet * multiplier;
        else if (r.outcome === 'LOSE') delta = -(r.bet * multiplier);
        else delta = 0;
        return { ...r, multiplier, tokenDelta: delta };
      })
    );
  };

  const handleSaveEdit = (roundNum: number) => {
    onEditRoundResult(roundNum, editableResults, currentUserName, editReason || 'Correction');
    setEditingRoundNum(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#140205] via-[#2D040A] to-[#120104] border-2 border-[#D4AF37]/50 rounded-[32px] max-w-md w-full p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative text-white max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#3B070F] border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#500A15] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-[#451A03] shadow-md">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-100">Action & Payment Logs</h3>
            <span className="text-[10px] text-amber-300/80 font-bold">
              Round records, audits, & transactions
            </span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-[#1F0307] p-1 rounded-2xl border border-[#D4AF37]/35 mb-3 shrink-0">
          <button
            onClick={() => setActiveTab('ROUNDS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'ROUNDS'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Rounds ({roundHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payments</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'LOGS'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>All Logs</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* TAB 1: ROUNDS */}
          {activeTab === 'ROUNDS' && (
            <div className="space-y-3">
              {roundHistory.length === 0 ? (
                <div className="p-8 text-center text-amber-200/50 text-xs">
                  No rounds settled yet.
                </div>
              ) : (
                roundHistory.map(round => {
                  const isExpanded = expandedRounds[round.roundNumber] !== false; // expanded by default
                  const isEditingThis = editingRoundNum === round.roundNumber;

                  return (
                    <div
                      key={round.roundNumber}
                      className="bg-[#240409] rounded-2xl border border-[#D4AF37]/45 p-3 space-y-2.5"
                    >
                      {/* Round Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#FDE047] uppercase">
                              Round {round.roundNumber}
                            </span>
                            {round.isEdited && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Edited
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-200/70 block">
                            Dealer: {round.dealerName} | Bank: {round.startingBank} →{' '}
                            {round.endingBank}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isHostOrDealer && !isEditingThis && (
                            <button
                              onClick={() => handleStartEdit(round)}
                              className="px-2 py-1 rounded-lg bg-[#3C0710] hover:bg-[#520B17] border border-[#D4AF37]/40 text-amber-200 text-[11px] font-black flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-[#F59E0B]" />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            onClick={() => toggleRoundExpand(round.roundNumber)}
                            className="p-1 text-amber-200/80 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Editable Mode */}
                      {isEditingThis ? (
                        <div className="space-y-2 pt-2 border-t border-[#D4AF37]/25">
                          <div className="text-[11px] font-black text-amber-200 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>Correct Results for Round {round.roundNumber}:</span>
                          </div>

                          <div className="space-y-1.5">
                            {editableResults.map(pRes => (
                              <div
                                key={pRes.playerId}
                                className="p-2 bg-[#190306] rounded-xl border border-[#D4AF37]/30 flex items-center justify-between gap-2"
                              >
                                <span className="text-xs font-black text-white truncate max-w-[80px]">
                                  {pRes.playerName}
                                </span>
                                <span className="text-[10px] text-amber-300/80">
                                  Bet: {pRes.bet}
                                </span>

                                {/* Outcome Selector */}
                                <select
                                  value={pRes.outcome}
                                  onChange={e =>
                                    handleOutcomeChange(
                                      pRes.playerId,
                                      e.target.value as HandDecisionOutcome
                                    )
                                  }
                                  className="bg-[#2D040A] text-amber-100 text-xs font-bold rounded-lg px-1.5 py-1 border border-[#D4AF37]/40"
                                >
                                  <option value="WIN">WIN</option>
                                  <option value="LOSE">LOSE</option>
                                  <option value="DRAW">DRAW</option>
                                </select>

                                {/* Multiplier Selector */}
                                <select
                                  value={pRes.multiplier}
                                  onChange={e =>
                                    handleMultiplierChange(
                                      pRes.playerId,
                                      parseInt(e.target.value) as BetMultiplier
                                    )
                                  }
                                  className="bg-[#2D040A] text-amber-100 text-xs font-bold rounded-lg px-1.5 py-1 border border-[#D4AF37]/40"
                                >
                                  <option value={1}>x1</option>
                                  <option value={2}>x2</option>
                                  <option value={3}>x3</option>
                                  <option value={5}>x5</option>
                                </select>
                              </div>
                            ))}
                          </div>

                          <input
                            type="text"
                            placeholder="Reason for correction (optional)"
                            value={editReason}
                            onChange={e => setEditReason(e.target.value)}
                            className="w-full bg-[#1A0307] border border-[#D4AF37]/40 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-amber-200/30"
                          />

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => setEditingRoundNum(null)}
                              className="px-2.5 py-1 rounded-xl bg-gray-800 text-gray-200 text-xs font-black"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(round.roundNumber)}
                              className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] text-xs font-black flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save & Rebalance</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Expanded View of Results */
                        isExpanded && (
                          <div className="space-y-1.5 pt-1 border-t border-[#D4AF37]/25">
                            {round.results.map(res => (
                              <div
                                key={res.playerId}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#1B0307]"
                              >
                                <span className="font-bold text-white">{res.playerName}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-amber-300/80">
                                    Bet: {res.bet} ({res.outcome} x{res.multiplier})
                                  </span>
                                  <span
                                    className={`font-black ${
                                      res.tokenDelta > 0
                                        ? 'text-emerald-400'
                                        : res.tokenDelta < 0
                                        ? 'text-rose-400'
                                        : 'text-amber-200/60'
                                    }`}
                                  >
                                    {res.tokenDelta > 0 ? `+${res.tokenDelta}` : res.tokenDelta}{' '}
                                    tokens
                                  </span>
                                </div>
                              </div>
                            ))}

                            {/* Audit Edit History Trail */}
                            {round.editHistory && round.editHistory.length > 0 && (
                              <div className="mt-2 p-2 bg-[#140103] rounded-lg border border-amber-600/30 text-[10px] text-amber-300/70 space-y-1">
                                <span className="font-black text-amber-200 block">Audit Log:</span>
                                {round.editHistory.map((edit, idx) => (
                                  <div key={idx}>
                                    Edited by {edit.editedBy} at{' '}
                                    {new Date(edit.timestamp).toLocaleTimeString()} ({edit.reason})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: PAYMENTS (TOP-UPS & CASH-OUTS) */}
          {activeTab === 'TRANSACTIONS' && (
            <div className="space-y-2">
              {logs.filter(l => l.type === 'TOPUP' || l.type === 'CASHOUT').length === 0 ? (
                <div className="p-8 text-center text-amber-200/50 text-xs">
                  No payment transactions registered yet.
                </div>
              ) : (
                logs
                  .filter(l => l.type === 'TOPUP' || l.type === 'CASHOUT')
                  .map(entry => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl bg-[#240409] border border-[#D4AF37]/35 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            entry.type === 'TOPUP'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {entry.description}
                          </span>
                          <span className="text-[10px] text-amber-300/60">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* TAB 3: ALL LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-1.5 font-mono text-xs">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="p-2 rounded-xl bg-[#1B0307] border border-[#D4AF37]/25 text-amber-100"
                >
                  <div className="flex items-center justify-between text-[10px] text-amber-300/60 mb-0.5">
                    <span className="font-bold">{log.type}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-sans text-white/90">{log.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
