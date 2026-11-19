import { Crown, QrCode, LogOut, FileText, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  roomId: string;
  bankerName: string;
  isConnected: boolean;
  onOpenQr: () => void;
  onOpenSettlement: () => void;
  onLeaveRoom: () => void;
  onReconnect?: () => void;
}

export default function Header({
  roomId,
  bankerName,
  isConnected,
  onOpenQr,
  onOpenSettlement,
  onLeaveRoom,
  onReconnect,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between w-full max-w-md mx-auto py-2 px-1 mb-2">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#FDE68A] shadow-sm">
          {/* Custom SVG Vault / Jar Icon */}
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B45309"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3h12l2 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-4z" />
            <line x1="4" y1="7" x2="20" y2="7" />
            <circle cx="12" cy="14" r="2" />
          </svg>
          <span className="text-sm font-black text-[#78350F] tracking-tight">SidePot</span>
          <span className="text-[10px] font-black bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded border border-[#FCD34D]">
            #{roomId}
          </span>
        </div>

        {/* Connection status indicator */}
        <button
          onClick={onReconnect}
          disabled={isConnected}
          title={isConnected ? 'P2P Connected' : 'Disconnected — click to reconnect'}
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
            isConnected
              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] cursor-default'
              : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] hover:bg-[#FEE2E2] active:scale-95 cursor-pointer'
          }`}
        >
          {isConnected ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span className="hidden xs:inline">Reconnect</span>
            </>
          )}
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#92400E] bg-[#FFFBEB] px-2 py-1 rounded-full border border-[#FDE68A]">
          <Crown className="w-3 h-3 text-[#D97706]" />
          <span>{bankerName}</span>
        </div>

        <button
          onClick={onOpenQr}
          title="Show Room QR Code"
          className="w-8 h-8 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#78350F] hover:bg-[#FEF3C7] shadow-sm transition-transform active:scale-95"
        >
          <QrCode className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettlement}
          title="End of Night Settlement"
          className="w-8 h-8 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#78350F] hover:bg-[#FEF3C7] shadow-sm transition-transform active:scale-95"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={onLeaveRoom}
          title="Leave Table"
          className="w-8 h-8 rounded-full bg-white border border-[#FECACA] flex items-center justify-center text-[#DC2626] hover:bg-[#FEE2E2] shadow-sm transition-transform active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
