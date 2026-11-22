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
    <header className="flex items-center justify-between w-full max-w-md mx-auto py-1 px-1 mb-1">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#0a291c]/90 px-3 py-1.5 rounded-full border border-[#D4AF37]/50 shadow-md backdrop-blur-sm">
          {/* Custom SVG Vault / Jar Icon */}
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3h12l2 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-4z" />
            <line x1="4" y1="7" x2="20" y2="7" />
            <circle cx="12" cy="14" r="2" />
          </svg>
          <span className="text-sm font-black text-amber-100 tracking-tight">SidePot</span>
          <span className="text-[10px] font-black bg-[#061c13] text-[#FDE047] px-1.5 py-0.5 rounded border border-[#F59E0B]/50">
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
              ? 'bg-[#064E3B]/80 text-[#34D399] border-[#059669]/60 cursor-default'
              : 'bg-[#7F1D1D]/80 text-[#FCA5A5] border-[#DC2626]/60 hover:bg-[#991B1B] active:scale-95 cursor-pointer'
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
        {/* Dealer Identity (Visible to all players on mobile & desktop) */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-200 bg-[#0c3323]/90 px-2.5 py-1 rounded-full border border-[#D4AF37]/50 shadow-xs">
          <Crown className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <span className="max-w-[70px] xs:max-w-[100px] truncate font-extrabold">{bankerName}</span>
        </div>

        <button
          onClick={onOpenQr}
          title="Show Room QR Code"
          className="w-8 h-8 rounded-full bg-[#0a291c]/90 border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#12422e] hover:text-white shadow-sm transition-transform active:scale-95"
        >
          <QrCode className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettlement}
          title="End of Night Settlement"
          className="w-8 h-8 rounded-full bg-[#0a291c]/90 border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#12422e] hover:text-white shadow-sm transition-transform active:scale-95"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={onLeaveRoom}
          title="Leave Table"
          className="w-8 h-8 rounded-full bg-[#3B0707] border border-[#EF4444]/50 flex items-center justify-center text-[#FCA5A5] hover:bg-[#5C0A0A] shadow-sm transition-transform active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
