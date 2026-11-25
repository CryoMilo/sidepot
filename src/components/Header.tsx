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
    <header className="flex items-center justify-between w-full max-w-md mx-auto py-1 px-1 mb-0.5 shrink-0 select-none">
      {/* Brand & Room Info (Clickable to open QR share modal) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenQr}
          aria-label={`Show Room QR Code and share link for room ${roomId}`}
          title="Tap to show Room QR Code & share link"
          className="h-9 flex items-center gap-1.5 bg-[#250409]/90 hover:bg-[#38060E] px-3 rounded-full border border-[#D4AF37]/50 shadow-md backdrop-blur-sm cursor-pointer transition-[transform,background-color] duration-150 active:scale-[0.97]"
        >
          {/* Custom SVG Vault / Jar Icon */}
          <svg
            className="w-4 h-4 shrink-0"
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
          <span className="text-[11px] font-black bg-[#160205] text-[#FDE047] px-1.5 py-0.5 rounded-md border border-[#F59E0B]/50 tabular-nums">
            #{roomId}
          </span>
        </button>

        {/* Connection status indicator */}
        <button
          type="button"
          onClick={onReconnect}
          disabled={isConnected}
          aria-label={isConnected ? 'P2P Connected' : 'Disconnected, tap to reconnect'}
          title={isConnected ? 'P2P Connected' : 'Disconnected — click to reconnect'}
          className={`h-9 flex items-center gap-1 text-[11px] font-bold px-2.5 rounded-full border transition-[transform,background-color] duration-150 ${
            isConnected
              ? 'bg-[#064E3B]/80 text-[#34D399] border-[#059669]/60 cursor-default'
              : 'bg-[#7F1D1D]/80 text-[#FCA5A5] border-[#DC2626]/60 hover:bg-[#991B1B] active:scale-[0.97] cursor-pointer'
          }`}
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
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
          aria-label="Action and Payment Logs"
          title="Action & Payment Logs"
          className="w-9 h-9 rounded-full bg-[#250409]/90 border border-[#D4AF37]/50 flex items-center justify-center text-amber-200 hover:bg-[#3D0A13] hover:text-white shadow-sm transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onLeaveRoom}
          aria-label="Leave Table"
          title="Leave Table"
          className="w-9 h-9 rounded-full bg-[#3B0707] border border-[#EF4444]/50 flex items-center justify-center text-[#FCA5A5] hover:bg-[#5C0A0A] shadow-sm transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
