import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TableState,
  HandDecisionOutcome,
  BetMultiplier,
  PlayerRoundResult,
} from './types';
import {
  createInitialTable,
  addPlayer,
  placeBet,
  commitPlayerBet,
  resetPlayerBet,
  requestTopUp,
  approveTopUp,
  rejectTopUp,
  setDealerBank,
  stagePlayerDecision,
  settleRoundMulti,
  editRoundResult,
  rotateBanker,
  advancePhase,
  adjustPlayerChips,
} from './utils/gameEngine';
import {
  createPeerInstance,
  formatPeerId,
  broadcastState,
  sendActionToHost,
  parseNetworkMessage,
  loadStateFromStorage,
  saveStateToStorage,
  clearStateStorage,
  saveSessionToStorage,
  loadSessionFromStorage,
  clearSessionStorage,
  UserSession,
} from './services/peerService';
import { playSound } from './utils/audio';
import Header from './components/Header';
import GoldenJar from './components/GoldenJar';
import WalletDeck from './components/WalletDeck';
import GameBoardTable from './components/GameBoardTable';
import RoomModal from './components/RoomModal';
import TopUpModal from './components/TopUpModal';
import ActionLogsModal from './components/ActionLogsModal';
import { PlayCircle } from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';

export default function App() {
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isJarDancing, setIsJarDancing] = useState<boolean>(false);

  // Modals
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [roomModalMode, setRoomModalMode] = useState<'CREATE' | 'JOIN' | 'QR_SHARE'>('JOIN');
  const [showActionLogsModal, setShowActionLogsModal] = useState<boolean>(false);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);

  // Resumable session state if user was disconnected
  const [cachedSession, setCachedSession] = useState<UserSession | null>(null);

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
  const startHostPeer = useCallback(
    (roomCode: string, initialTable: TableState) => {
      cleanupPeer();
      const formattedId = formatPeerId(roomCode);
      const peer = createPeerInstance(formattedId);
      peerRef.current = peer;

      peer.on('open', () => {
        setIsConnected(true);
        setTableState(initialTable);
        saveStateToStorage(initialTable);
        saveSessionToStorage({
          roomId: roomCode,
          playerId: initialTable.hostId,
          playerName: initialTable.players[initialTable.hostId]?.name || 'Host',
          isHost: true,
        });
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
                playSound('clink');
                break;
              }
              case 'COMMIT_BET': {
                const { playerId, amount } = msg.payload;
                next = commitPlayerBet(current, playerId, amount);
                triggerJarDance();
                playSound('clink');
                break;
              }
              case 'RESET_BET': {
                const { playerId } = msg.payload;
                next = resetPlayerBet(current, playerId);
                playSound('pop');
                break;
              }
              case 'REQUEST_TOP_UP': {
                const { playerId, tokens, type } = msg.payload;
                next = requestTopUp(current, playerId, tokens, type);
                playSound('clink');
                break;
              }
              case 'APPROVE_TOP_UP': {
                const { requestId } = msg.payload;
                next = approveTopUp(current, requestId);
                playSound('win');
                break;
              }
              case 'REJECT_TOP_UP': {
                const { requestId } = msg.payload;
                next = rejectTopUp(current, requestId);
                playSound('pop');
                break;
              }
              case 'SET_DEALER_BANK': {
                const { amount } = msg.payload;
                next = setDealerBank(current, amount);
                playSound('clink');
                break;
              }
              case 'STAGE_DECISION': {
                const { playerId, outcome, multiplier } = msg.payload;
                next = stagePlayerDecision(current, playerId, outcome, multiplier);
                break;
              }
              case 'SETTLE_ROUND': {
                next = settleRoundMulti(current);
                triggerJarDance();
                playSound('win');
                break;
              }
              case 'EDIT_ROUND': {
                const { roundNumber, newResults, editorName, reason } = msg.payload;
                next = editRoundResult(current, roundNumber, newResults, editorName, reason);
                playSound('clink');
                break;
              }
              case 'ROTATE_BANKER': {
                const { newBankerId } = msg.payload;
                next = rotateBanker(current, newBankerId, true);
                playSound('win');
                break;
              }
              case 'ADJUST_CHIPS': {
                const { playerId, amount } = msg.payload;
                next = adjustPlayerChips(current, playerId, amount);
                break;
              }
              case 'ADVANCE_PHASE': {
                const { nextPhase } = msg.payload;
                next = advancePhase(current, nextPhase);
                break;
              }
            }

            broadcastState(hostConnectionsRef.current, next);
            saveStateToStorage(next);
            return next;
          });
        });

        conn.on('close', () => {
          hostConnectionsRef.current = hostConnectionsRef.current.filter(c => c !== conn);
        });
      });

      peer.on('error', (err: any) => {
        console.warn('Host peer error:', err);
        if (err && (err.type === 'unavailable-id' || err.type === 'network')) {
          const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
          const fallbackRoom = `${roomCode}-${suffix}`;
          const updatedTable = { ...initialTable, roomId: fallbackRoom };
          setTableState(updatedTable);
          setTimeout(() => startHostPeer(fallbackRoom, updatedTable), 500);
        }
      });
    },
    [cleanupPeer]
  );

  // --- CLIENT PEER INITIALIZATION ---
  const startClientPeer = useCallback(
    (roomCode: string, playerName: string, existingPlayerId?: string) => {
      cleanupPeer();
      const myId = existingPlayerId || 'player-' + Math.random().toString(36).substring(2, 9);
      setMyPlayerId(myId);

      saveSessionToStorage({
        roomId: roomCode,
        playerId: myId,
        playerName,
        isHost: false,
      });

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
            saveStateToStorage(msg.payload);
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
    },
    [cleanupPeer]
  );

  // Reconnection helper
  const handleReconnect = useCallback(() => {
    const session = loadSessionFromStorage();
    if (session) {
      if (session.isHost && tableState) {
        startHostPeer(session.roomId, tableState);
      } else {
        startClientPeer(session.roomId, session.playerName, session.playerId);
      }
    }
  }, [tableState, startHostPeer, startClientPeer]);

  // Mobile wake-up detection
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

  // Initial load: check for resumable room
  useEffect(() => {
    const savedState = loadStateFromStorage();
    const savedSession = loadSessionFromStorage();
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');

    if (savedSession && savedState && savedSession.roomId === savedState.roomId) {
      setCachedSession(savedSession);
      setTableState(savedState);
      setMyPlayerId(savedSession.playerId);
      setIsHost(savedSession.isHost);
      if (savedSession.isHost) {
        startHostPeer(savedSession.roomId, savedState);
      } else {
        startClientPeer(savedSession.roomId, savedSession.playerName, savedSession.playerId);
      }
    } else if (savedSession) {
      setCachedSession(savedSession);
      if (savedSession.isHost && savedState) {
        setTableState(savedState);
        setMyPlayerId(savedSession.playerId);
        setIsHost(true);
        startHostPeer(savedSession.roomId, savedState);
      } else {
        setMyPlayerId(savedSession.playerId);
        setIsHost(false);
        startClientPeer(savedSession.roomId, savedSession.playerName, savedSession.playerId);
      }
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
  const handleCreateRoom = (
    roomCode: string,
    hostName: string,
    thbPerToken: number,
    hostQrUrl?: string,
    dealerRotationFrequency: number = 5
  ) => {
    const initialTable = createInitialTable(
      roomCode,
      hostName,
      0,
      thbPerToken,
      hostQrUrl,
      dealerRotationFrequency
    );
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
        playSound('clink');
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'COMMIT_BET', {
        playerId: myPlayerId,
        amount,
      });
      triggerJarDance();
      playSound('clink');
    }
  };

  // Top-Up Request
  const handleRequestTopUp = (tokens: number, type: 'TOPUP' | 'CASHOUT') => {
    if (!tableState || !myPlayerId) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = requestTopUp(current, myPlayerId, tokens, type);
        playSound('clink');
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'REQUEST_TOP_UP', {
        playerId: myPlayerId,
        tokens,
        type,
      });
      playSound('clink');
    }
  };

  // Host Approves Top-Up / Cash-Out
  const handleApproveTopUp = (requestId: string) => {
    if (!tableState || !isHost) return;
    setTableState(current => {
      if (!current) return null;
      const next = approveTopUp(current, requestId);
      playSound('win');
      broadcastState(hostConnectionsRef.current, next);
      saveStateToStorage(next);
      return next;
    });
  };

  // Host Rejects Top-Up / Cash-Out
  const handleRejectTopUp = (requestId: string) => {
    if (!tableState || !isHost) return;
    setTableState(current => {
      if (!current) return null;
      const next = rejectTopUp(current, requestId);
      playSound('pop');
      broadcastState(hostConnectionsRef.current, next);
      saveStateToStorage(next);
      return next;
    });
  };

  // Dealer sets bankroll
  const handleSetDealerBank = (amount: number) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = setDealerBank(current, amount);
        playSound('clink');
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'SET_DEALER_BANK', { amount });
      playSound('clink');
    }
  };

  // Stage Player Decision (Win/Lose/Draw, Multiplier)
  const handleStageDecision = (
    playerId: string,
    outcome: HandDecisionOutcome,
    multiplier: BetMultiplier
  ) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = stagePlayerDecision(current, playerId, outcome, multiplier);
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'STAGE_DECISION', {
        playerId,
        outcome,
        multiplier,
      });
    }
  };

  // Settle Round
  const handleSettleRound = () => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = settleRoundMulti(current);
        triggerJarDance();
        playSound('win');
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'SETTLE_ROUND', {});
    }
  };

  // Edit Round Result
  const handleEditRoundResult = (
    roundNumber: number,
    newResults: PlayerRoundResult[],
    editorName: string,
    reason?: string
  ) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = editRoundResult(current, roundNumber, newResults, editorName, reason);
        playSound('clink');
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'EDIT_ROUND', {
        roundNumber,
        newResults,
        editorName,
        reason,
      });
    }
  };

  // Rotate Dealer
  const handleRotateBanker = (newBankerId: string) => {
    if (!tableState) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = rotateBanker(current, newBankerId, true);
        playSound('win');
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'ROTATE_BANKER', { newBankerId });
    }
  };

  // Adjust Chips (Prank feature)
  const handleAdjustChips = (amount: number) => {
    if (!tableState || !myPlayerId) return;

    if (isHost) {
      setTableState(current => {
        if (!current) return null;
        const next = adjustPlayerChips(current, myPlayerId, amount);
        broadcastState(hostConnectionsRef.current, next);
        saveStateToStorage(next);
        return next;
      });
    } else {
      sendActionToHost(clientConnectionRef.current, 'ADJUST_CHIPS', {
        playerId: myPlayerId,
        amount,
      });
    }
  };

  const handleLeaveRoom = () => {
    clearStateStorage();
    clearSessionStorage();
    cleanupPeer();
    setTableState(null);
    setCachedSession(null);
    setMyPlayerId('');
    setIsHost(false);
    setRoomModalMode('JOIN');
    setShowRoomModal(true);
  };

  const myPlayer = tableState?.players[myPlayerId];
  const activeBanker = tableState?.players[tableState.bankerId];
  const isCurrentBanker = myPlayer ? myPlayer.isBanker : false;
  const isHostOrDealer = isHost || isCurrentBanker;

  return (
    <main className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-screen overflow-hidden select-none touch-none casino-felt-bg safe-area-container flex flex-col justify-between text-[#F8FAFC]">
      {/* Table Active State */}
      {tableState ? (
        <div className="w-full max-w-md mx-auto flex flex-col justify-between h-full gap-1.5 overflow-hidden">
          {/* Top Bar Header (Navbar with iPhone Safe Area padding) */}
          <div className="shrink-0 z-20">
            <Header
              roomId={tableState.roomId}
              bankerName={activeBanker ? activeBanker.name : 'Unknown'}
              isConnected={isConnected}
              onOpenQr={() => {
                setRoomModalMode('QR_SHARE');
                setShowRoomModal(true);
              }}
              onOpenActionLogs={() => setShowActionLogsModal(true)}
              onLeaveRoom={handleLeaveRoom}
              onReconnect={handleReconnect}
            />
          </div>

          {/* Golden Jar Mascot: Always compact horizontal row below Navbar */}
          <div className="shrink-0 z-10 w-full">
            <GoldenJar
              playerChips={myPlayer ? myPlayer.chips : tableState.defaultBuyIn || 0}
              isDancing={isJarDancing}
              onClick={triggerJarDance}
              onOpenTopUp={() => setShowTopUpModal(true)}
            />
          </div>

          {/* Game Board Table: flex-1 middle section with Red Velvet Tablecloth */}
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden">
            <GameBoardTable
              tableState={tableState}
              myPlayerId={myPlayerId}
              isBanker={isCurrentBanker}
              onStageDecision={handleStageDecision}
              onSettleRound={handleSettleRound}
              onSetDealerBank={handleSetDealerBank}
              onRotateBanker={handleRotateBanker}
              onOpenTopUpModal={() => setShowTopUpModal(true)}
            />
          </div>

          {/* Player Wallet & Bet Deck with Reset and Commit */}
          <div className="shrink-0 z-10">
            <WalletDeck
              chips={myPlayer ? myPlayer.chips : 0}
              currentBet={myPlayer ? myPlayer.currentBet : 0}
              isBanker={isCurrentBanker}
              isCommitted={myPlayer ? myPlayer.isCommitted : false}
              hasPendingApprovals={
                (isCurrentBanker || isHost) &&
                (tableState.topUpRequests || []).some(r => r.status === 'PENDING')
              }
              players={tableState.players}
              onRotateBanker={handleRotateBanker}
              onCommitBet={handleCommitBet}
              onOpenTopUpModal={() => setShowTopUpModal(true)}
              onAdjustChips={handleAdjustChips}
            />
          </div>
        </div>
      ) : (
        /* Empty Welcome Stage / Resumable Room Prompt */
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
          <div className="w-20 h-20 rounded-3xl bg-[#1A0307] border-2 border-[#D4AF37]/70 flex items-center justify-center mx-auto mb-4 shadow-[0_0_35px_rgba(212,175,55,0.3)]">
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
          <h1 className="text-3xl font-black text-amber-100 tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
            SidePot
          </h1>
          <p className="text-sm font-bold text-amber-200/80 mt-1 max-w-xs">
            Casino digital chip ledger & dealer banking for Shan Koe Mee card nights.
          </p>

          {/* Resumable Room Shortcut */}
          {cachedSession && (
            <div className="mt-5 w-full bg-[#240409] border border-[#D4AF37]/60 rounded-2xl p-3 text-left">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                Active Game Night Saved
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-black text-white">
                  Room #{cachedSession.roomId} ({cachedSession.playerName})
                </span>
                <button
                  onClick={handleReconnect}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#451A03] font-black text-xs rounded-xl flex items-center gap-1 shadow-md active:scale-95"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setRoomModalMode('CREATE');
              setShowRoomModal(true);
            }}
            className="mt-4 w-full bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] py-3.5 rounded-2xl font-black text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-transform active:scale-95"
          >
            Create New Room & Bank
          </button>
          <button
            onClick={() => {
              setRoomModalMode('JOIN');
              setShowRoomModal(true);
            }}
            className="mt-2.5 w-full bg-[#1F0307] hover:bg-[#34060E] text-[#FDE047] border-2 border-[#D4AF37]/50 py-3.5 rounded-2xl font-black text-sm shadow-sm transition-transform active:scale-95"
          >
            Join Room with 5-Char Code
          </button>
        </div>
      )}

      {/* Room Creation / Joining / QR Share Modal */}
      <RoomModal
        isOpen={showRoomModal}
        mode={roomModalMode}
        currentRoomId={
          tableState?.roomId ||
          (typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('room') || ''
            : '')
        }
        onClose={() => {
          if (tableState) setShowRoomModal(false);
        }}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />

      {/* Action Logs & Payments Modal (Replacing Settlement Modal) */}
      {tableState && (
        <ActionLogsModal
          isOpen={showActionLogsModal}
          onClose={() => setShowActionLogsModal(false)}
          roundHistory={tableState.roundHistory || []}
          logs={tableState.logs || []}
          isHostOrDealer={isHostOrDealer}
          currentUserName={myPlayer ? myPlayer.name : 'Host'}
          onEditRoundResult={handleEditRoundResult}
        />
      )}

      {/* Top-Up & Cash-Out Modal */}
      {tableState && (
        <TopUpModal
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          isHost={isHost}
          isDealer={isCurrentBanker}
          myPlayerId={myPlayerId}
          players={tableState.players}
          thbPerToken={tableState.thbPerToken || 10}
          hostQrUrl={tableState.hostQrUrl}
          topUpRequests={tableState.topUpRequests || []}
          onRequestTopUp={handleRequestTopUp}
          onApproveRequest={handleApproveTopUp}
          onRejectRequest={handleRejectTopUp}
        />
      )}
    </main>
  );
}
