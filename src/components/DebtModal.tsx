import { useState } from 'react';
import { Player, DebtRecord } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  HandCoins,
  QrCode,
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
  const [showQr, setShowQr] = useState<boolean>(false);

  if (!isOpen) return null;

  const myPlayer = players[myPlayerId];
  const myChips = myPlayer ? myPlayer.chips : 0;
  const otherPlayers = Object.values(players).filter(p => p.id !== myPlayerId);

  // Default selected borrower if not set
  const targetBorrowerId =
    selectedBorrowerId || (otherPlayers.length > 0 ? otherPlayers[0].id : '');

  // Debts I owe
  const myUnpaidDebts = (debts || []).filter(
    d => d.borrowerId === myPlayerId && d.status === 'UNPAID'
  );

  // Debts owed to me
  const debtsOwedToMe = (debts || []).filter(
    d => d.lenderId === myPlayerId
  );

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
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-3.5">
      <div className="bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EA] to-[#FFF2D5] border-3 border-[#FFE4A0] rounded-[32px] max-w-sm w-full p-5 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#78350F] hover:bg-[#FEF3C7]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-8 h-8 rounded-full bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-[#B45309]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#78350F]">Token Transfers & Debts</h3>
            <p className="text-[10px] font-bold text-[#92400E]">
              Zero-interest peer loans with automatic ledger tracking
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#FFF8E7] p-1 rounded-2xl border border-[#FDE68A] mb-3 shrink-0">
          <button
            onClick={() => setActiveTab('TRANSFER')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'TRANSFER'
                ? 'bg-white text-[#78350F] shadow-sm'
                : 'text-[#92400E] hover:text-[#78350F]'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Lend Tokens</span>
          </button>
          <button
            onClick={() => setActiveTab('DEBTS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'DEBTS'
                ? 'bg-white text-[#78350F] shadow-sm'
                : 'text-[#92400E] hover:text-[#78350F]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Debts ({myUnpaidDebts.length})</span>
          </button>
        </div>

        {/* Tab 1: Lend / Transfer */}
        {activeTab === 'TRANSFER' && (
          <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pr-0.5">
            {/* Recipient Selector */}
            <div>
              <label className="block text-[11px] font-black text-[#78350F] mb-1">
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
                          ? 'bg-[#FEF3C7] border-[#F59E0B] shadow-sm'
                          : 'bg-white border-[#FDE68A] hover:bg-[#FFFDF9]'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: p.avatarColor }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-black text-[#422006] truncate">{p.name}</div>
                        <div className="text-[10px] font-bold text-[#92400E]">{p.chips} tokens</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white/70 p-3 rounded-xl border border-[#FDE68A] text-center text-xs font-bold text-[#92400E]">
                  Waiting for other players to join the table...
                </div>
              )}
            </div>

            {/* Amount Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black text-[#78350F]">Amount to Lend</label>
                <span className="text-[10px] font-bold text-[#92400E]">
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
                        ? 'bg-[#F59E0B] text-white border-[#D97706]'
                        : 'bg-white text-[#92400E] border-[#FCD34D] disabled:opacity-40'
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
                className="w-full bg-white border border-[#FCD34D] rounded-xl px-3 py-1.5 text-xs font-black text-[#422006] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>

            {/* QR Toggle */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-[10px] font-black text-[#B45309] flex items-center gap-1 hover:underline"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'Hide QR Code' : 'Show Transfer QR'}</span>
              </button>
            </div>

            {showQr && (
              <div className="bg-white p-3 rounded-2xl border border-[#FDE68A] text-center">
                <div className="inline-block p-2 bg-white rounded-xl border border-[#FDE68A]">
                  <QRCodeSVG
                    value={`sidepot-lend:${myPlayerId}:${transferAmount}`}
                    size={120}
                    level="M"
                    fgColor="#78350F"
                  />
                </div>
                <div className="text-[10px] font-bold text-[#92400E] mt-1">
                  Borrower can scan to confirm loan of {transferAmount} tokens
                </div>
              </div>
            )}

            {/* Transfer Action Button */}
            <button
              type="button"
              disabled={!targetBorrowerId || transferAmount <= 0 || transferAmount > myChips}
              onClick={handleTransfer}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-black text-xs py-2.5 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5"
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
              <div className="text-[11px] font-black uppercase text-[#92400E] tracking-wider mb-1.5">
                Debts You Owe ({myUnpaidDebts.length})
              </div>

              {myUnpaidDebts.length === 0 ? (
                <div className="bg-white/80 rounded-xl p-3 text-center border border-[#FDE68A]">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] mx-auto mb-1" />
                  <div className="text-xs font-black text-[#78350F]">No Unpaid Debts</div>
                  <p className="text-[10px] text-[#92400E] mt-0.5">You are debt-free!</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {myUnpaidDebts.map(d => {
                    const canAfford = myChips >= d.amount;
                    return (
                      <div
                        key={d.id}
                        className="bg-white rounded-xl p-2.5 border border-[#FDE68A] shadow-sm flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-black text-[#422006]">
                            Owe {d.lenderName}
                          </div>
                          <div className="text-[10px] font-extrabold text-[#D97706]">
                            {d.amount} Tokens
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleRepay(d.id, d.amount)}
                          className="bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-transform active:scale-95"
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
            <div className="pt-2 border-t border-[#FDE68A]/60">
              <div className="text-[11px] font-black uppercase text-[#92400E] tracking-wider mb-1.5">
                Debts Owed To You ({debtsOwedToMe.filter(d => d.status === 'UNPAID').length})
              </div>

              {debtsOwedToMe.length === 0 ? (
                <div className="text-[10px] text-[#92400E] italic text-center py-1">
                  You haven't lent tokens to anyone yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {debtsOwedToMe.map(d => (
                    <div
                      key={d.id}
                      className="bg-white/80 rounded-xl px-2.5 py-1.5 border border-[#FDE68A] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-[#92400E]" />
                        <span className="font-bold text-[#422006]">{d.borrowerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#78350F]">{d.amount} tkn</span>
                        {d.status === 'REPAID' ? (
                          <span className="text-[9px] font-extrabold text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded">
                            Repaid
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded flex items-center gap-0.5">
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
