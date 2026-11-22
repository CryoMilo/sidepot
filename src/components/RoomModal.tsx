import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, PlusCircle, LogIn, X, Copy, Check } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  mode: 'CREATE' | 'JOIN' | 'QR_SHARE';
  currentRoomId?: string;
  onClose: () => void;
  onCreateRoom: (roomId: string, name: string, buyIn: number) => void;
  onJoinRoom: (roomId: string, name: string) => void;
}

export default function RoomModal({
  isOpen,
  mode: initialMode,
  currentRoomId = '',
  onClose,
  onCreateRoom,
  onJoinRoom,
}: RoomModalProps) {
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN' | 'QR_SHARE'>(initialMode);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(currentRoomId || '');
  const [buyIn, setBuyIn] = useState(100);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(code);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?room=${roomCode || currentRoomId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activeTab === 'CREATE') {
      const code = roomCode.trim().toUpperCase() || '7K92';
      onCreateRoom(code, name.trim(), buyIn);
    } else if (activeTab === 'JOIN') {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#082418] via-[#0b2f1f] to-[#05160e] border-2 border-[#D4AF37]/50 rounded-[36px] max-w-sm w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative text-white">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#0a291c] border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#12422e] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Tab switchers if not QR mode */}
        {initialMode !== 'QR_SHARE' && (
          <div className="flex bg-[#051a11] p-1 rounded-2xl border border-[#D4AF37]/35 mb-5">
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'CREATE'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                  : 'text-amber-200 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Table</span>
            </button>
            <button
              onClick={() => setActiveTab('JOIN')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'JOIN'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                  : 'text-amber-200 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Join Table</span>
            </button>
          </div>
        )}

        {/* QR Share View */}
        {activeTab === 'QR_SHARE' ? (
          <div className="text-center py-2">
            <h3 className="text-lg font-black text-amber-100">Invite Table Players</h3>
            <p className="text-xs font-bold text-emerald-200/70 mt-0.5 mb-4">
              Scan QR code with phone camera to join
            </p>

            <div className="bg-white p-4 rounded-3xl border-2 border-[#D4AF37]/60 shadow-xl inline-block mx-auto mb-4">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}?room=${currentRoomId}`}
                size={180}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#071E15"
              />
            </div>

            <div className="text-center mb-4">
              <div className="text-[11px] font-black uppercase text-[#FCD34D] tracking-wider">
                Room Code
              </div>
              <div className="text-2xl font-black text-white tracking-widest mt-0.5">
                {currentRoomId}
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] py-2.5 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-amber-200 mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ko Aung"
                className="w-full bg-[#051a11] border border-[#D4AF37]/50 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-amber-200">Room Code (4-chars)</label>
                {activeTab === 'CREATE' && (
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[10px] font-black text-[#FDE047] hover:underline"
                  >
                    Generate Random
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={8}
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7K92"
                className="w-full bg-[#051a11] border border-[#D4AF37]/50 rounded-2xl px-3.5 py-2.5 text-sm font-black text-white tracking-widest placeholder-emerald-200/40 uppercase focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>

            {activeTab === 'CREATE' && (
              <div>
                <label className="block text-xs font-black text-amber-200 mb-1">
                  Starting Token Buy-In
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBuyIn(amt)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${
                        buyIn === amt
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] border-[#FCD34D] shadow-sm'
                          : 'bg-[#061c13] text-amber-200 border-[#D4AF37]/40 hover:bg-[#0a291c]'
                      }`}
                    >
                      {amt} Tokens
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] py-3 rounded-2xl font-black text-sm shadow-md transition-transform active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>{activeTab === 'CREATE' ? 'Start Game Night' : 'Join Table'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
