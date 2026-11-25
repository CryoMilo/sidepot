import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, PlusCircle, LogIn, X, Copy, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { generateRoomCode } from '../utils/gameEngine';

interface RoomModalProps {
  isOpen: boolean;
  mode: 'CREATE' | 'JOIN' | 'QR_SHARE';
  currentRoomId?: string;
  onClose: () => void;
  onCreateRoom: (
    roomId: string,
    name: string,
    thbPerToken: number,
    hostQrUrl?: string,
    dealerRotationFrequency?: number
  ) => void;
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
  const [roomCode, setRoomCode] = useState(currentRoomId || generateRoomCode());
  const [thbPerToken, setThbPerToken] = useState(10);
  const [dealerRotation, setDealerRotation] = useState(5);
  const [hostQrUrl, setHostQrUrl] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCode = () => {
    setRoomCode(generateRoomCode());
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setHostQrUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?room=${roomCode || currentRoomId}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activeTab === 'CREATE') {
      const code = roomCode.trim().toUpperCase() || generateRoomCode();
      onCreateRoom(
        code,
        name.trim(),
        thbPerToken > 0 ? thbPerToken : 10,
        hostQrUrl,
        dealerRotation > 0 ? dealerRotation : 5
      );
    } else if (activeTab === 'JOIN') {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#140205] via-[#2D040A] to-[#120104] border-2 border-[#D4AF37]/50 rounded-[32px] max-w-sm w-full p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative text-white max-h-[92vh] overflow-y-auto touch-pan-y">
        {onClose && (
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#3B070F] border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#500A15] hover:text-white transition-[transform,background-color] duration-150 active:scale-[0.95] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Tab switchers */}
        {initialMode !== 'QR_SHARE' && (
          <div className="flex bg-[#1F0307] p-1 rounded-2xl border border-[#D4AF37]/35 mb-4">
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'CREATE'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                  : 'text-amber-200/80 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>
            <button
              onClick={() => setActiveTab('JOIN')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'JOIN'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] shadow-sm'
                  : 'text-amber-200/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Join Room</span>
            </button>
          </div>
        )}

        {/* QR Share View */}
        {activeTab === 'QR_SHARE' ? (
          <div className="text-center py-2">
            <h3 className="text-lg font-black text-amber-100">Invite Room Players</h3>
            <p className="text-xs font-bold text-amber-200/70 mt-0.5 mb-4">
              Scan QR code with phone camera to join
            </p>

            <div className="bg-white p-3.5 rounded-3xl border-2 border-[#D4AF37]/60 shadow-xl inline-block mx-auto mb-4">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}?room=${currentRoomId}`}
                size={175}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#1C0206"
              />
            </div>

            <div className="text-center mb-4">
              <div className="text-[11px] font-black uppercase text-[#FCD34D] tracking-wider">
                5-Character Room Code
              </div>
              <div className="text-3xl font-black text-white tracking-widest mt-0.5">
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
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                className="w-full bg-[#1A0307] border border-[#D4AF37]/50 rounded-2xl px-3.5 py-2 text-sm font-bold text-white placeholder-amber-200/30 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-amber-200">
                  {activeTab === 'CREATE' ? '5-Character Room Code' : 'Enter 5-Character Code'}
                </label>
                {activeTab === 'CREATE' && (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-[10px] font-black text-[#FDE047] hover:underline"
                  >
                    Generate New
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={5}
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7K9X2"
                className="w-full bg-[#1A0307] border border-[#D4AF37]/50 rounded-2xl px-3.5 py-2 text-center text-lg font-black text-white tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>

            {activeTab === 'CREATE' && (
              <>
                {/* Bank QR Screenshot Upload */}
                <div className="bg-[#240409] p-3 rounded-2xl border border-[#D4AF37]/35">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Host Bank QR Screenshot</span>
                    </label>
                    <span className="text-[10px] text-amber-300/70">For Top-Ups</span>
                  </div>

                  {hostQrUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={hostQrUrl}
                        alt="Bank QR"
                        className="w-16 h-16 object-cover rounded-xl border border-[#D4AF37]/50 shadow-md"
                      />
                      <div className="flex-1">
                        <span className="text-xs text-emerald-300 font-bold block">
                          QR Attached
                        </span>
                        <label className="text-[10px] font-bold text-[#FCD34D] hover:underline cursor-pointer">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border border-dashed border-[#D4AF37]/50 rounded-xl py-3 px-2 cursor-pointer hover:bg-[#34060E] transition-colors">
                      <Upload className="w-5 h-5 text-amber-300/80 mb-1" />
                      <span className="text-xs font-bold text-amber-100">
                        Upload PromptPay / Bank QR
                      </span>
                      <span className="text-[10px] text-amber-300/60 mt-0.5">
                        Players scan this to pay you real THB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* THB per Token exchange rate */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-amber-200 mb-1">
                      1 Token = THB
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={thbPerToken}
                        onChange={e => setThbPerToken(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#1A0307] border border-[#D4AF37]/50 rounded-xl px-3 py-1.5 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-amber-300 font-bold">
                        ฿
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-amber-200 mb-1">
                      Dealer Rotate (Rounds)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={dealerRotation}
                      onChange={e => setDealerRotation(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#1A0307] border border-[#D4AF37]/50 rounded-xl px-3 py-1.5 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] py-2.5 rounded-2xl font-black text-sm shadow-md transition-transform active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>{activeTab === 'CREATE' ? 'Create Room & Bank' : 'Join Room'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
