import { useState } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { TopUpRequest, Player } from '../types';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
  myPlayerId: string;
  players: Record<string, Player>;
  thbPerToken: number;
  hostQrUrl?: string;
  topUpRequests: TopUpRequest[];
  onRequestTopUp: (tokens: number, type: 'TOPUP' | 'CASHOUT') => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
}

export default function TopUpModal({
  isOpen,
  onClose,
  isHost,
  myPlayerId,
  players,
  thbPerToken = 10,
  hostQrUrl,
  topUpRequests = [],
  onRequestTopUp,
  onApproveRequest,
  onRejectRequest,
}: TopUpModalProps) {
  const [tab, setTab] = useState<'BUY' | 'CASHOUT' | 'HOST_QUEUE'>('BUY');
  const [tokenAmount, setTokenAmount] = useState<number>(50);
  const [cashOutAmount, setCashOutAmount] = useState<number>(50);
  const [requestSent, setRequestSent] = useState<boolean>(false);

  if (!isOpen) return null;

  const me = players[myPlayerId];
  const myChips = me ? me.chips : 0;
  const pendingRequests = topUpRequests.filter(r => r.status === 'PENDING');
  const myPendingRequests = topUpRequests.filter(
    r => r.playerId === myPlayerId && r.status === 'PENDING'
  );

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenAmount <= 0) return;
    onRequestTopUp(tokenAmount, 'TOPUP');
    setRequestSent(true);
    setTimeout(() => setRequestSent(false), 3000);
  };

  const handleCashOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashOutAmount <= 0 || cashOutAmount > myChips) return;
    onRequestTopUp(cashOutAmount, 'CASHOUT');
    setRequestSent(true);
    setTimeout(() => setRequestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#160205] via-[#2E040B] to-[#120104] border-2 border-[#D4AF37]/50 rounded-[32px] max-w-sm w-full p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#3B070F] border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#500A15] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-[#451A03] shadow-md">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-100">Top-Up & Cash-Out</h3>
            <span className="text-[10px] text-amber-300/80 font-bold">
              Rate: ฿{thbPerToken} per token
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#1F0307] p-1 rounded-2xl border border-[#D4AF37]/35 mb-4">
          <button
            onClick={() => setTab('BUY')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-black transition-all ${
              tab === 'BUY'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Buy Tokens</span>
          </button>
          <button
            onClick={() => setTab('CASHOUT')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-black transition-all ${
              tab === 'CASHOUT'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Cash Out</span>
          </button>
          {isHost && (
            <button
              onClick={() => setTab('HOST_QUEUE')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-black transition-all relative ${
                tab === 'HOST_QUEUE'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                  : 'text-amber-200/80 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approvals</span>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* TAB 1: BUY TOKENS */}
        {tab === 'BUY' && (
          <div className="space-y-4">
            {/* Host QR Display */}
            <div className="bg-[#240409] p-3 rounded-2xl border border-[#D4AF37]/40 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-200 mb-2">
                <QrCode className="w-4 h-4 text-[#F59E0B]" />
                <span>Host Bank QR Payment</span>
              </div>
              {hostQrUrl ? (
                <div className="inline-block bg-white p-2 rounded-2xl border border-[#D4AF37]/60 shadow-lg">
                  <img
                    src={hostQrUrl}
                    alt="Host Bank QR"
                    className="w-44 h-44 object-contain rounded-xl mx-auto"
                  />
                </div>
              ) : (
                <div className="py-6 px-4 border border-dashed border-[#D4AF37]/40 rounded-xl text-amber-300/60 text-xs">
                  Host has not uploaded a bank QR. Contact host for payment details.
                </div>
              )}
              <p className="text-[10px] text-amber-300/70 mt-2 font-bold">
                Scan & transfer THB to the host, then enter tokens requested below.
              </p>
            </div>

            {/* Token Selector Form */}
            <form onSubmit={handleBuySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-amber-200 mb-1">
                  Tokens to Buy
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[20, 50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTokenAmount(amt)}
                      className={`py-1.5 rounded-xl text-xs font-black border transition-all ${
                        tokenAmount === amt
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] border-[#FCD34D]'
                          : 'bg-[#1F0307] text-amber-200 border-[#D4AF37]/35'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={tokenAmount}
                    onChange={e => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#180206] border border-[#D4AF37]/50 rounded-xl px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-amber-300">
                    tokens
                  </span>
                </div>
              </div>

              {/* THB calculation summary */}
              <div className="bg-[#240409] p-2.5 rounded-xl border border-[#D4AF37]/35 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200/80">Total Real THB:</span>
                <span className="text-base font-black text-[#FDE047]">
                  ฿{(tokenAmount * thbPerToken).toLocaleString()} THB
                </span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] py-2.5 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Request Tokens</span>
              </button>

              {requestSent && (
                <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs text-center font-bold">
                  Request sent! Awaiting host approval.
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: CASH OUT */}
        {tab === 'CASHOUT' && (
          <div className="space-y-4">
            <div className="bg-[#240409] p-3 rounded-2xl border border-[#D4AF37]/40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-200/80 font-bold">Your Available Tokens:</span>
                <span className="text-sm font-black text-white">{myChips} tokens</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-200/80 font-bold">Max Value in THB:</span>
                <span className="text-sm font-black text-[#FDE047]">
                  ฿{(myChips * thbPerToken).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleCashOutSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-amber-200 mb-1">
                  Tokens to Cash Out
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[20, 50, 100, myChips].map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={amt <= 0 || amt > myChips}
                      onClick={() => setCashOutAmount(amt)}
                      className={`py-1.5 rounded-xl text-xs font-black border transition-all disabled:opacity-30 ${
                        cashOutAmount === amt
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] border-[#FCD34D]'
                          : 'bg-[#1F0307] text-amber-200 border-[#D4AF37]/35'
                      }`}
                    >
                      {idx === 3 ? 'All' : amt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={myChips}
                    value={cashOutAmount}
                    onChange={e =>
                      setCashOutAmount(Math.min(myChips, Math.max(1, parseInt(e.target.value) || 1)))
                    }
                    className="w-full bg-[#180206] border border-[#D4AF37]/50 rounded-xl px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-amber-300">
                    tokens
                  </span>
                </div>
              </div>

              <div className="bg-[#240409] p-2.5 rounded-xl border border-[#D4AF37]/35 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200/80">Host Pays You:</span>
                <span className="text-base font-black text-[#FDE047]">
                  ฿{(cashOutAmount * thbPerToken).toLocaleString()} THB
                </span>
              </div>

              <p className="text-[10px] text-amber-300/70 font-bold">
                Tap Cash out. The host pays you back in real money (PromptPay/Cash) and confirms it.
              </p>

              <button
                type="submit"
                disabled={myChips <= 0 || cashOutAmount > myChips}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 disabled:opacity-40 text-[#451A03] py-2.5 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Cash Out</span>
              </button>

              {requestSent && (
                <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs text-center font-bold">
                  Cash-out request submitted! Awaiting host settlement.
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: HOST APPROVAL QUEUE */}
        {tab === 'HOST_QUEUE' && isHost && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-200">
              Pending Requests ({pendingRequests.length})
            </h4>

            {pendingRequests.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#1A0307] border border-[#D4AF37]/30 text-center text-amber-200/50 text-xs">
                No pending requests.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-[#240409] border border-[#D4AF37]/45 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                            req.type === 'TOPUP'
                              ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/50'
                              : 'bg-amber-900/80 text-amber-300 border border-amber-500/50'
                          }`}
                        >
                          {req.type === 'TOPUP' ? 'Buy' : 'Cash Out'}
                        </span>
                        <span className="text-xs font-black text-white">{req.playerName}</span>
                      </div>
                      <div className="text-xs font-bold text-[#FDE047] mt-0.5">
                        {req.tokens} tokens (฿{req.thbAmount.toLocaleString()})
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onApproveRequest(req.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => onRejectRequest(req.id)}
                        className="px-2 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-xl text-xs font-black transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Player's active pending banner if waiting */}
        {myPendingRequests.length > 0 && tab !== 'HOST_QUEUE' && (
          <div className="mt-4 p-2.5 rounded-xl bg-[#200508] border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F59E0B] animate-spin" />
            <div className="flex-1">
              <span className="font-bold block">
                Pending Approval: {myPendingRequests[0].tokens} tokens (฿
                {myPendingRequests[0].thbAmount})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
