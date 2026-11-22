import { useState } from 'react';
import { Player, DebtRecord } from '../types';
import {
  X,
  HandCoins,
  RotateCcw,
  CheckCircle2,
  Users,
  Coins,
  ArrowRightLeft,
  Clock,
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  myPlayerId: string;
  roomId: string;
  players: Record<string, Player>;
  debts: DebtRecord[];
  onTransferAsDebt: (lenderId: string, borrowerId: string, amount: number) => void;
  onRepayDebt: (debtId: string, borrowerId: string) => void;
}

export default function DebtModal({
  isOpen,
  onClose,
  myPlayerId,
  players,
  debts,
  onTransferAsDebt,
  onRepayDebt,
}: DebtModalProps) {
  const [activeTab, setActiveTab] = useState<'TRANSFER' | 'DEBTS'>('TRANSFER');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(20);

  if (!isOpen) return null;

  const myPlayer = players[myPlayerId];
  const myChips = myPlayer ? myPlayer.chips : 0;
  const otherPlayers = Object.values(players).filter(p => p.id !== myPlayerId);

  // Default selected borrower if not explicitly set
  const targetBorrowerId =
    selectedBorrowerId || (otherPlayers.length > 0 ? otherPlayers[0].id : '');

  // Debts I owe
  const myUnpaidDebts = (debts || []).filter(
    d => d.borrowerId === myPlayerId && d.status === 'UNPAID'
  );

  // Debts owed to me
  const debtsOwedToMe = (debts || []).filter(d => d.lenderId === myPlayerId);

  const handleTransfer = () => {
    if (!targetBorrowerId || transferAmount <= 0 || transferAmount > myChips) return;
    onTransferAsDebt(myPlayerId, targetBorrowerId, transferAmount);
    playSound('clink');
    setActiveTab('DEBTS');
  };

  const handleRepay = (debtId: string, amount: number) => {
    if (myChips < amount) return;
    onRepayDebt(debtId, myPlayerId);
    playSound('win');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gradient-to-b from-[#082418] via-[#0b2f1f] to-[#05160e] border-2 border-[#D4AF37]/50 rounded-[32px] max-w-sm w-full p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[85vh] text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#0a291c] border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#12422e] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#051a11] border border-[#D4AF37]/60 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-100">Peer Token Loans</h3>
            <p className="text-[10px] font-bold text-emerald-200/70">
              Zero-interest peer loans with automatic ledger tracking
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#051a11] p-1 rounded-2xl border border-[#D4AF37]/35 mb-3 shrink-0">
          <button
            onClick={() => setActiveTab('TRANSFER')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'TRANSFER'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Lend Tokens</span>
          </button>
          <button
            onClick={() => setActiveTab('DEBTS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'DEBTS'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Debts ({myUnpaidDebts.length})</span>
          </button>
        </div>

        {/* Tab 1: Traditional Select Name to Lend */}
        {activeTab === 'TRANSFER' && (
          <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pr-0.5">
            {/* Player Selection */}
            <div>
              <label className="block text-[11px] font-black text-amber-200 mb-1">
                Select Player to Lend Tokens
              </label>
              {otherPlayers.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {otherPlayers.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedBorrowerId(p.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        targetBorrowerId === p.id
                          ? 'bg-[#0f3827] border-[#D4AF37] shadow-sm'
                          : 'bg-[#061c13] border-[#D4AF37]/35 hover:bg-[#0a291c]'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/40"
                        style={{ backgroundColor: p.avatarColor }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-black text-white truncate">{p.name}</div>
                        <div className="text-[10px] font-bold text-[#FDE047]">
                          {p.chips} tokens
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-[#051a11] p-3 rounded-xl border border-[#D4AF37]/35 text-center text-xs font-bold text-amber-200">
                  Waiting for other players to join the table...
                </div>
              )}
            </div>

            {/* Amount Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black text-amber-200">Amount to Lend</label>
                <span className="text-[10px] font-bold text-[#FDE047]">
                  Available: {myChips} tokens
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[10, 20, 30, 50].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    disabled={myChips < amt}
                    onClick={() => setTransferAmount(amt)}
                    className={`py-1.5 rounded-xl text-xs font-black border transition-all ${
                      transferAmount === amt
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] border-[#FCD34D]'
                        : 'bg-[#061c13] text-amber-200 border-[#D4AF37]/40 disabled:opacity-30'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={myChips}
                value={transferAmount}
                onChange={e => setTransferAmount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#051a11] border border-[#D4AF37]/50 rounded-xl px-3 py-1.5 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>

            {/* Transfer Action Button */}
            <button
              type="button"
              disabled={!targetBorrowerId || transferAmount <= 0 || transferAmount > myChips}
              onClick={handleTransfer}
              className="w-full bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 disabled:opacity-35 text-[#451A03] font-black text-xs py-2.5 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5 mt-2"
            >
              <HandCoins className="w-4 h-4" />
              <span>Transfer {transferAmount} Tokens as Debt</span>
            </button>
          </div>
        )}

        {/* Tab 2: My Debts & Repayment */}
        {activeTab === 'DEBTS' && (
          <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pr-0.5">
            {/* Debts I Owe */}
            <div>
              <div className="text-[11px] font-black uppercase text-[#FCD34D] tracking-wider mb-1.5">
                Debts You Owe ({myUnpaidDebts.length})
              </div>

              {myUnpaidDebts.length === 0 ? (
                <div className="bg-[#051a11]/90 rounded-xl p-3 text-center border border-[#D4AF37]/35">
                  <CheckCircle2 className="w-5 h-5 text-[#34D399] mx-auto mb-1" />
                  <div className="text-xs font-black text-amber-100">No Unpaid Debts</div>
                  <p className="text-[10px] text-emerald-200/70 mt-0.5">You are debt-free!</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {myUnpaidDebts.map(d => {
                    const canAfford = myChips >= d.amount;
                    return (
                      <div
                        key={d.id}
                        className="bg-[#061c13] rounded-xl p-2.5 border border-[#D4AF37]/35 shadow-sm flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-black text-white">
                            Owe {d.lenderName}
                          </div>
                          <div className="text-[10px] font-extrabold text-[#FDE047]">
                            {d.amount} Tokens
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleRepay(d.id, d.amount)}
                          className="bg-[#059669] hover:bg-[#047857] disabled:opacity-35 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-transform active:scale-95"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Repay</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Debts Owed to Me */}
            <div className="pt-2 border-t border-[#D4AF37]/30">
              <div className="text-[11px] font-black uppercase text-[#FCD34D] tracking-wider mb-1.5">
                Debts Owed To You ({debtsOwedToMe.filter(d => d.status === 'UNPAID').length})
              </div>

              {debtsOwedToMe.length === 0 ? (
                <div className="text-[10px] text-emerald-200/60 italic text-center py-1">
                  You haven't lent tokens to anyone yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {debtsOwedToMe.map(d => (
                    <div
                      key={d.id}
                      className="bg-[#051a11] rounded-xl px-2.5 py-1.5 border border-[#D4AF37]/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-[#F59E0B]" />
                        <span className="font-bold text-white">{d.borrowerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#FDE047]">{d.amount} tkn</span>
                        {d.status === 'REPAID' ? (
                          <span className="text-[9px] font-extrabold text-[#34D399] bg-[#064E3B] px-1.5 py-0.5 rounded border border-[#059669]/60">
                            Repaid
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold text-[#FDE047] bg-[#78350F]/70 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-[#F59E0B]/50">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
