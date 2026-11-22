import { useState, useEffect, useRef, useCallback } from 'react';
import { TableState, BetOutcome } from './types';
import {
  createInitialTable,
  addPlayer,
  placeBet,
  commitPlayerBet,
  resetPlayerBet,
  resolvePlayerBet,
  rotateBanker,
  advancePhase,
  topUpPlayerChips,
  transferTokensAsDebt,
  repayDebt,
  clearRepaymentAlert,
  adjustPlayerChips,
} from './utils/gameEngine';
import {
  createPeerInstance,
  formatPeerId,
  broadcastState,
  sendActionToHost,
  parseNetworkMessage,
  loadStateFromStorage,
  clearStateStorage,
} from './services/peerService';
import Header from './components/Header';
import GoldenJar from './components/GoldenJar';
import WalletDeck from './components/WalletDeck';
import BankerControls from './components/BankerControls';
import RoomModal from './components/RoomModal';
import DebtModal from './components/DebtModal';
import SettlementModal from './components/SettlementModal';
import { Check } from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';

const CLIENT_SESSION_KEY = 'sidepot_client_session';

export default function App() {
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isJarDancing, setIsJarDancing] = useState<boolean>(false);

  // Modals
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [roomModalMode, setRoomModalMode] = useState<'CREATE' | 'JOIN' | 'QR_SHARE'>('JOIN');
  const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
  const [showDebtModal, setShowDebtModal] = useState<boolean>(false);

  // Networking refs
  const peerRef = useRef<Peer | null>(null);
  const hostConnectionsRef = useRef<DataConnection[]>([]);
  const clientConnectionRef = useRef<DataConnection | null>(null);

  const cleanupPeer = useCallback(() => {
    if (clientConnectionRef.current) {
      clientConnectionRef.current.close();
      clientConnectionRef.current = null;
    }
    hostConnectionsRef.current.forEach(c => c.close());
    hostConnectionsRef.current = [];
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const triggerJarDance = () => {
    setIsJarDancing(true);
    setTimeout(() => setIsJarDancing(false), 800);
  };

  // --- HOST PEER INITIALIZATION ---
  const startHostPeer = useCallback((roomCode: string, initialTable: TableState) => {
    cleanupPeer();
    const formattedId = formatPeerId(roomCode);
    const peer = createPeerInstance(formattedId);
    peerRef.current = peer;

    peer.on('open', () => {
      setIsConnected(true);
      setTableState(initialTable);
    });

    peer.on('connection', conn => {
      hostConnectionsRef.current.push(conn);

      conn.on('open', () => {
        setTableState(current => {
          if (current) {
            conn.send({ type: 'SYNC_STATE', payload: current });
          }
          return current;
        });
      });

      conn.on('data', rawData => {
        const msg = parseNetworkMessage(rawData);
        if (!msg) return;

        setTableState(current => {
          if (!current) return null;
          let next = current;

          switch (msg.type) {
            case 'JOIN_TABLE': {
              const { playerId, name } = msg.payload;
              next = addPlayer(current, playerId, name);
              break;
            }
            case 'PLACE_BET': {
              const { playerId, amount } = msg.payload;
              next = placeBet(current, playerId, amount);
              triggerJarDance();
              break;
            }
            case 'COMMIT_BET': {
              const { playerId, amount } = msg.payload;
              next = commitPlayerBet(current, playerId, amount);
              triggerJarDance();
              break;
            }
            case 'RESET_BET': {
              const { playerId } = msg.payload;
              next = resetPlayerBet(current, playerId);
              break;
            }
            case 'TRANSFER_DEBT': {
              const { lenderId, borrowerId, amount } = msg.payload;
              next = transferTokensAsDebt(current, lenderId, borrowerId, amount);
              break;
            }
            case 'REPAY_DEBT': {
              const { debtId, borrowerId } = msg.payload;
              next = repayDebt(current, debtId, borrowerId);
              break;
            }
            case 'CLEAR_REPAYMENT_ALERT': {
              next = clearRepaymentAlert(current);
              break;
            }
            case 'ADJUST_CHIPS': {
              const { playerId, amount } = msg.payload;
              next = adjustPlayerChips(current, playerId, amount);
              break;
            }
            case 'RESOLVE_BET': {
              const { playerId, outcome } = msg.payload;
              next = resolvePlayerBet(current, playerId, outcome);
              triggerJarDance();
              break;
            }
            case 'ROTATE_BANKER': {
              const { newBankerId } = msg.payload;
              next = rotateBanker(current, newBankerId);
              break;
            }
            case 'TOP_UP': {
              const { playerId, amount } = msg.payload;
              next = topUpPlayerChips(current, playerId, amount);
              break;
            }
            case 'ADVANCE_PHASE': {
              const { nextPhase } = msg.payload;
              next = advancePhase(current, nextPhase);
              break;
            }
          }

          broadcastState(hostConnectionsRef.current, next);
          return next;
        });
      });

      conn.on('close', () => {
        hostConnectionsRef.current = hostConnectionsRef.current.filter(c => c !== conn);
      });
    });

    peer.on('error', (err: any) => {
      console.warn('Host peer error:', err);
      // Auto-resolve room code collision
      if (err && (err.type === 'unavailable-id' || err.type === 'network')) {
        const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
        const fallbackRoom = `${roomCode}-${suffix}`;
        const updatedTable = { ...initialTable, roomId: fallbackRoom };
        setTableState(updatedTable);
        setTimeout(() => startHostPeer(fallbackRoom, updatedTable), 500);
      }
    });
  }, [cleanupPeer]);

  // --- CLIENT PEER INITIALIZATION ---
  const startClientPeer = useCallback((roomCode: string, playerName: string, existingPlayerId?: string) => {
    cleanupPeer();
    const myId = existingPlayerId || ('player-' + Math.random().toString(36).substring(2, 9));
    setMyPlayerId(myId);

    // Save client session so screen lock / refresh preserves identity
    try {
      sessionStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify({
        roomId: roomCode,
        playerId: myId,
        name: playerName,
      }));
    } catch {
      // ignore
    }

    const peer = createPeerInstance();
    peerRef.current = peer;

    peer.on('open', () => {
      const targetPeerId = formatPeerId(roomCode);
      const conn = peer.connect(targetPeerId, { reliable: true });
      clientConnectionRef.current = conn;

      conn.on('open', () => {
        setIsConnected(true);
        conn.send({
          type: 'JOIN_TABLE',
          payload: { playerId: myId, name: playerName },
        });
      });

      conn.on('data', rawData => {
        const msg = parseNetworkMessage(rawData);
        if (msg && msg.type === 'SYNC_STATE') {
          setTableState(msg.payload);
        }
      });

      conn.on('close', () => {
        setIsConnected(false);
      });
    });

    peer.on('error', err => {
      console.warn('Client peer error:', err);
      setIsConnected(false);
    });
  }, [cleanupPeer]);

  // Reconnection helper
  const handleReconnect = useCallback(() => {
    if (isHost && tableState) {
      startHostPeer(tableState.roomId, tableState);
    } else {
      try {
        const savedSession = sessionStorage.getItem(CLIENT_SESSION_KEY);
        if (savedSession) {
          const { roomId, playerId, name } = JSON.parse(savedSession);
          startClientPeer(roomId, name, playerId);
        }
      } catch {
        // ignore
      }
    }
  }, [isHost, tableState, startHostPeer, startClientPeer]);

  // Handle mobile wake up / tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        handleReconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, handleReconnect]);

  // Auto-restore on page load
  useEffect(() => {
    const saved = loadStateFromStorage();
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');

    let clientSession: { roomId: string; playerId: string; name: string } | null = null;
    try {
      const raw = sessionStorage.getItem(CLIENT_SESSION_KEY);
      if (raw) clientSession = JSON.parse(raw);
    } catch {
      // ignore
    }

    if (saved && saved.roomId) {
      setTableState(saved);
      setMyPlayerId(saved.hostId);
      setIsHost(true);
      startHostPeer(saved.roomId, saved);
    } else if (clientSession && clientSession.roomId) {
      setIsHost(false);
      startClientPeer(clientSession.roomId, clientSession.name, clientSession.playerId);
    } else if (roomFromUrl) {
      setRoomModalMode('JOIN');
      setShowRoomModal(true);
    } else {
      setRoomModalMode('CREATE');
      setShowRoomModal(true);
    }

    return () => {
      cleanupPeer();
    };
  }, [cleanupPeer, startHostPeer, startClientPeer]);

  // --- ACTIONS ---
  const handleCreateRoom = (roomCode: string, hostName: string, buyIn: number) => {
    const initialTable = createInitialTable(roomCode, hostName, buyIn);
    setMyPlayerId(initialTable.hostId);
    setIsHost(true);
    setTableState(initialTable);
    startHostPeer(roomCode, initialTable);
    setShowRoomModal(false);
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    setIsHost(false);
    startClientPeer(roomCode, playerName);
    setShowRoomModal(false);
  };

  const handleCommitBet = (amount: number) => {
    if (!tableState || !myPlayerId) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = commitPlayerBet(current, myPlayerId, amount);
        triggerJarDance();
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'COMMIT_BET', {
        playerId: myPlayerId,
        amount,
      });
      triggerJarDance();
    }
  };

  const handleTransferAsDebt = (lenderId: string, borrowerId: string, amount: number) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = transferTokensAsDebt(current, lenderId, borrowerId, amount);
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'TRANSFER_DEBT', {
        lenderId,
        borrowerId,
        amount,
      });
    }
  };

  const handleRepayDebt = (debtId: string, borrowerId: string) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = repayDebt(current, debtId, borrowerId);
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'REPAY_DEBT', {
        debtId,
        borrowerId,
      });
    }
  };

  const handleClearRepaymentAlert = () => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = clearRepaymentAlert(current);
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'CLEAR_REPAYMENT_ALERT', {});
    }
  };

  const handleResolveBet = (playerId: string, outcome: BetOutcome) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = resolvePlayerBet(current, playerId, outcome);
        triggerJarDance();
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'RESOLVE_BET', {
        playerId,
        outcome,
      });
      triggerJarDance();
    }
  };

  const handleRotateBanker = (newBankerId: string) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = rotateBanker(current, newBankerId);
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'ROTATE_BANKER', { newBankerId });
    }
  };

  const handleAdjustChips = (amount: number) => {
    if (!tableState || !myPlayerId) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = adjustPlayerChips(current, myPlayerId, amount);
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'ADJUST_CHIPS', {
        playerId: myPlayerId,
        amount,
      });
    }
  };

  const handleAdvancePhase = (nextPhase: any) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = advancePhase(current, nextPhase);
        broadcastState(hostConnectionsRef.current, next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'ADVANCE_PHASE', { nextPhase });
    }
  };

  const handleLeaveRoom = () => {
    clearStateStorage();
    try {
      sessionStorage.removeItem(CLIENT_SESSION_KEY);
    } catch {
      // ignore
    }
    cleanupPeer();
    setTableState(null);
    setMyPlayerId('');
    setIsHost(false);
    setRoomModalMode('JOIN');
    setShowRoomModal(true);
  };

  const myPlayer = tableState?.players[myPlayerId];
  const activeBanker = tableState?.players[tableState.bankerId];
  const isCurrentBanker = myPlayer ? myPlayer.isBanker : false;

  return (
    <main className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-screen overflow-hidden select-none touch-none casino-felt-bg safe-area-container sm:p-4 flex flex-col justify-between text-[#F8FAFC]">
      {/* Table Active State */}
      {tableState ? (
        <div className="w-full max-w-md mx-auto flex flex-col justify-between h-full gap-2 overflow-hidden">
          {/* Top Bar Header (Navbar) */}
          <div className="shrink-0 z-20">
            <Header
              roomId={tableState.roomId}
              bankerName={activeBanker ? activeBanker.name : 'Unknown'}
              isConnected={isConnected}
              onOpenQr={() => {
                setRoomModalMode('QR_SHARE');
                setShowRoomModal(true);
              }}
              onOpenSettlement={() => setShowSettlementModal(true)}
              onLeaveRoom={handleLeaveRoom}
              onReconnect={handleReconnect}
            />
          </div>

          {/* Golden Jar: Stuck at top just below Navbar */}
          <div className="shrink-0 z-10 w-full">
            <GoldenJar
              playerChips={myPlayer ? myPlayer.chips : tableState.defaultBuyIn}
              isDancing={isJarDancing}
              onClick={triggerJarDance}
            />
          </div>

          {/* Banker Controls: Takes flexible middle space */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <BankerControls
              state={tableState}
              isCurrentPlayerBanker={isCurrentBanker}
              isHost={isHost}
              onResolveBet={handleResolveBet}
              onRotateBanker={handleRotateBanker}
              onAdvancePhase={handleAdvancePhase}
            />
          </div>

          {/* Player Wallet & Bet Deck with Reset and Commit */}
          <div className="shrink-0">
            <WalletDeck
              chips={myPlayer ? myPlayer.chips : 0}
              currentBet={myPlayer ? myPlayer.currentBet : 0}
              isBanker={isCurrentBanker}
              isCommitted={myPlayer ? myPlayer.isCommitted : false}
              onCommitBet={handleCommitBet}
              onOpenDebtModal={() => setShowDebtModal(true)}
              onAdjustChips={handleAdjustChips}
            />
          </div>
        </div>
      ) : (
        /* Empty Welcome Stage */
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
          <div className="w-20 h-20 rounded-3xl bg-[#082418] border-2 border-[#D4AF37]/70 flex items-center justify-center mx-auto mb-4 shadow-[0_0_35px_rgba(212,175,55,0.25)]">
            <svg
              className="w-10 h-10"
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
          </div>
          <h1 className="text-3xl font-black text-amber-100 tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">SidePot</h1>
          <p className="text-sm font-bold text-emerald-200/80 mt-1 max-w-xs">
            Real-time digital chip ledger for Shan Koe Mee, Poker & card nights.
          </p>
          <button
            onClick={() => {
              setRoomModalMode('CREATE');
              setShowRoomModal(true);
            }}
            className="mt-6 w-full bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] py-3.5 rounded-2xl font-black text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-transform active:scale-95"
          >
            Create New Game Table
          </button>
          <button
            onClick={() => {
              setRoomModalMode('JOIN');
              setShowRoomModal(true);
            }}
            className="mt-2.5 w-full bg-[#0a291c] hover:bg-[#12422e] text-[#FDE047] border-2 border-[#D4AF37]/50 py-3.5 rounded-2xl font-black text-sm shadow-sm transition-transform active:scale-95"
          >
            Join Existing Table
          </button>
        </div>
      )}

      {/* Modals */}
      <RoomModal
        isOpen={showRoomModal}
        mode={roomModalMode}
        currentRoomId={tableState?.roomId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') || '' : '')}
        onClose={() => {
          if (tableState) setShowRoomModal(false);
        }}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />

      {showSettlementModal && tableState && (
        <SettlementModal
          state={tableState}
          onClose={() => setShowSettlementModal(false)}
        />
      )}

      {/* Debt & Transfer Modal */}
      {tableState && (
        <DebtModal
          isOpen={showDebtModal}
          onClose={() => setShowDebtModal(false)}
          myPlayerId={myPlayerId}
          roomId={tableState.roomId}
          players={tableState.players}
          debts={tableState.debts || []}
          onTransferAsDebt={handleTransferAsDebt}
          onRepayDebt={handleRepayDebt}
        />
      )}

      {/* Lender Repayment Notification Dialog */}
      {tableState?.latestRepaymentAlert &&
        tableState.latestRepaymentAlert.lenderId === myPlayerId && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EA] to-[#FFF2D5] border-3 border-[#FFE4A0] rounded-[32px] max-w-xs w-full p-5 text-center shadow-2xl relative">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-[#16A34A]" />
              </div>
              <h3 className="text-base font-black text-[#78350F]">Debt Repaid!</h3>
              <p className="text-xs font-bold text-[#92400E] mt-1 mb-4">
                <span className="font-black text-[#16A34A]">
                  {tableState.latestRepaymentAlert.borrowerName}
                </span>{' '}
                has repaid their loan of{' '}
                <span className="font-black text-[#78350F]">
                  {tableState.latestRepaymentAlert.amount} tokens
                </span>
                .
              </p>
              <button
                type="button"
                onClick={handleClearRepaymentAlert}
                className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-2.5 rounded-xl font-black text-xs shadow-md transition-transform active:scale-95"
              >
                Got It
              </button>
            </div>
          </div>
        )}
    </main>
  );
}
