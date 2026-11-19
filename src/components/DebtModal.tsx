import { useState, useRef, useEffect, useCallback } from 'react';
import { Player, DebtRecord } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  ScanLine,
  QrCode,
  RotateCcw,
  CheckCircle2,
  Users,
  Coins,
  ArrowRightLeft,
  Clock,
  AlertCircle,
  Check,
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

interface ScannedLoanRequest {
  borrowerId: string;
  borrowerName: string;
  amount: number;
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
  const [activeTab, setActiveTab] = useState<'SCAN_LEND' | 'REQUEST_LOAN' | 'DEBTS'>('SCAN_LEND');
  const [requestAmount, setRequestAmount] = useState<number>(20);
  const [scannedRequest, setScannedRequest] = useState<ScannedLoanRequest | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const myPlayer = players[myPlayerId];
  const myChips = myPlayer ? myPlayer.chips : 0;
  const otherPlayers = Object.values(players).filter(p => p.id !== myPlayerId);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Parse QR String
  const processQrText = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (clean.startsWith('sidepot-borrow:')) {
        const parts = clean.split(':');
        if (parts.length >= 4) {
          const borrowerId = parts[1];
          const borrowerName = parts[2];
          const amount = parseInt(parts[3], 10);

          if (borrowerId !== myPlayerId && amount > 0) {
            setScannedRequest({ borrowerId, borrowerName, amount });
            playSound('clink');
            stopCamera();
          }
        }
      }
    },
    [myPlayerId, stopCamera]
  );

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError('');
    setScannedRequest(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        // Check for BarcodeDetector support
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          scanIntervalRef.current = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  processQrText(barcodes[0].rawValue);
                }
              } catch {
                // ignore detection frame errors
              }
            }
          }, 350);
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable. Ensure camera permissions are granted.');
      setCameraActive(false);
    }
  }, [processQrText]);

  // Clean up on unmount or tab switch
  useEffect(() => {
    if (!isOpen || activeTab !== 'SCAN_LEND') {
      stopCamera();
    } else {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Debts I owe
  const myUnpaidDebts = (debts || []).filter(
    d => d.borrowerId === myPlayerId && d.status === 'UNPAID'
  );

  // Debts owed to me
  const debtsOwedToMe = (debts || []).filter(d => d.lenderId === myPlayerId);

  const handleConfirmLoan = () => {
    if (!scannedRequest || myChips < scannedRequest.amount) return;
    onTransferAsDebt(myPlayerId, scannedRequest.borrowerId, scannedRequest.amount);
    playSound('win');
    setScannedRequest(null);
    setActiveTab('DEBTS');
  };

  const handleRepay = (debtId: string, amount: number) => {
    if (myChips < amount) return;
    onRepayDebt(debtId, myPlayerId);
    playSound('win');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EA] to-[#FFF2D5] border-3 border-[#FFE4A0] rounded-[32px] max-w-sm w-full p-4 sm:p-5 shadow-2xl relative flex flex-col max-h-[88vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#78350F] hover:bg-[#FEF3C7]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-[#B45309]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#78350F]">Peer Token Loans</h3>
            <p className="text-[10px] font-bold text-[#92400E]">
              Zero-interest peer loans with automatic ledger tracking
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#FFF8E7] p-1 rounded-2xl border border-[#FDE68A] mb-3 shrink-0">
          <button
            onClick={() => {
              setScannedRequest(null);
              setActiveTab('SCAN_LEND');
            }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'SCAN_LEND'
                ? 'bg-white text-[#78350F] shadow-sm'
                : 'text-[#92400E] hover:text-[#78350F]'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scan to Lend</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('REQUEST_LOAN');
            }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'REQUEST_LOAN'
                ? 'bg-white text-[#78350F] shadow-sm'
                : 'text-[#92400E] hover:text-[#78350F]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Borrow QR</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('DEBTS');
            }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'DEBTS'
                ? 'bg-white text-[#78350F] shadow-sm'
                : 'text-[#92400E] hover:text-[#78350F]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Debts ({myUnpaidDebts.length})</span>
          </button>
        </div>

        {/* Tab 1: Live In-App Camera QR Scanner */}
        {activeTab === 'SCAN_LEND' && (
          <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 flex flex-col justify-between">
            {!scannedRequest ? (
              <div className="flex flex-col items-center">
                {/* Live Camera Viewfinder Container */}
                <div className="relative w-full aspect-square max-w-[240px] rounded-2xl overflow-hidden bg-black border-2 border-[#FCD34D] shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Camera Live Indicator */}
                  {cameraActive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-[9px] font-black text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>LIVE</span>
                    </div>
                  )}

                  {/* Scanning HUD Overlay Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="w-36 h-36 border-2 border-dashed border-[#F59E0B] rounded-2xl relative animate-pulse flex items-center justify-center">
                      <ScanLine className="w-8 h-8 text-[#FDE047] opacity-80" />
                    </div>
                    <span className="text-[10px] font-black text-white bg-black/60 px-2 py-0.5 rounded-full mt-3 backdrop-blur-sm">
                      Point at borrower's QR code
                    </span>
                  </div>
                </div>

                {cameraError && (
                  <div className="mt-2 text-center text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] p-2 rounded-xl border border-[#FECACA] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Simulated Quick Scan for Other Table Players (Testing & Fallback) */}
                {otherPlayers.length > 0 && (
                  <div className="mt-2.5 w-full pt-2 border-t border-[#FDE68A]/60">
                    <span className="text-[10px] font-bold text-[#92400E] block mb-1 text-center">
                      Or Quick-Scan Table Player:
                    </span>
                    <div className="flex gap-1.5 justify-center flex-wrap">
                      {otherPlayers.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            processQrText(`sidepot-borrow:${p.id}:${p.name}:20`)
                          }
                          className="text-[10px] font-black bg-white border border-[#FCD34D] text-[#78350F] px-2 py-1 rounded-lg hover:bg-[#FEF3C7]"
                        >
                          Scan {p.name} (20 tkn)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Scanned Loan Request Confirmation Card */
              <div className="bg-white rounded-2xl p-3.5 border-2 border-[#FCD34D] shadow-md text-center">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center mx-auto mb-1.5">
                  <Check className="w-5 h-5 text-[#B45309]" />
                </div>
                <h4 className="text-xs font-black text-[#78350F]">Loan Request Detected</h4>
                <div className="text-sm font-black text-[#422006] mt-1">
                  {scannedRequest.borrowerName}
                </div>
                <div className="text-2xl font-black text-[#D97706] my-1">
                  {scannedRequest.amount} <span className="text-xs font-bold text-[#92400E]">Tokens</span>
                </div>
                <p className="text-[10px] font-bold text-[#92400E] mb-3">
                  This transfer will be recorded as an unpaid debt.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScannedRequest(null);
                      startCamera();
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-black bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]"
                  >
                    Rescan
                  </button>
                  <button
                    type="button"
                    disabled={myChips < scannedRequest.amount}
                    onClick={handleConfirmLoan}
                    className="flex-1 py-2 rounded-xl text-xs font-black bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 text-white shadow-sm flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Lend Tokens</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Borrower QR Generator */}
        {activeTab === 'REQUEST_LOAN' && (
          <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 text-center">
            <div>
              <label className="block text-[11px] font-black text-[#78350F] mb-1">
                Select Amount to Borrow
              </label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[10, 20, 30, 50].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRequestAmount(amt)}
                    className={`py-1.5 rounded-xl text-xs font-black border transition-all ${
                      requestAmount === amt
                        ? 'bg-[#F59E0B] text-white border-[#D97706]'
                        : 'bg-white text-[#92400E] border-[#FCD34D]'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                value={requestAmount}
                onChange={e => setRequestAmount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-white border border-[#FCD34D] rounded-xl px-3 py-1.5 text-xs font-black text-[#422006] text-center focus:outline-none"
              />
            </div>

            {/* Generated QR Code for Lender to Scan */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#FDE68A] shadow-inner inline-block mx-auto">
              <QRCodeSVG
                value={`sidepot-borrow:${myPlayerId}:${myPlayer?.name || 'Player'}:${requestAmount}`}
                size={140}
                level="M"
                fgColor="#78350F"
              />
            </div>

            <div className="text-[11px] font-black text-[#78350F]">
              Have lender tap <span className="text-[#B45309]">"Scan to Lend"</span> to scan this QR
            </div>
          </div>
        )}

        {/* Tab 3: My Debts & Repayment */}
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
