import { LogOut, FileText, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  roomId: string;
  bankerName?: string;
  isConnected: boolean;
  onOpenQr: () => void;
  onOpenActionLogs: () => void;
  onLeaveRoom: () => void;
  onReconnect?: () => void;
}

export default function Header({
  roomId,
  isConnected,
  onOpenQr,
  onOpenActionLogs,
  onLeaveRoom,
  onReconnect,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between w-full max-w-md mx-auto py-1 px-1 mb-1 shrink-0 select-none">
      {/* Brand & Room Info (Clickable to open QR share modal) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenQr}
          title="Tap to show Room QR Code & share link"
          className="flex items-center gap-1.5 bg-[#250409]/90 hover:bg-[#38060E] px-3 py-1.5 rounded-full border border-[#D4AF37]/50 shadow-md backdrop-blur-sm cursor-pointer transition-all active:scale-95"
        >
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
          <span className="text-[10px] font-black bg-[#160205] text-[#FDE047] px-1.5 py-0.5 rounded border border-[#F59E0B]/50">
            #{roomId}
          </span>
        </button>

        {/* Connection status indicator */}
        <button
          type="button"
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
        <button
          type="button"
          onClick={onOpenActionLogs}
          title="Action & Payment Logs"
          className="w-8 h-8 rounded-full bg-[#250409]/90 border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#3D0A13] hover:text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onLeaveRoom}
          title="Leave Table"
          className="w-8 h-8 rounded-full bg-[#3B0707] border border-[#EF4444]/50 flex items-center justify-center text-[#FCA5A5] hover:bg-[#5C0A0A] shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
