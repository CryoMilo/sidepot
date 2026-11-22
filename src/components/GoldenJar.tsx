import { motion } from 'framer-motion';

export type JarMood = 'worried' | 'confident' | 'ecstatic';

export function getJarMood(chips: number): JarMood {
  if (chips < 20) return 'worried';
  if (chips <= 80) return 'confident';
  return 'ecstatic';
}

interface GoldenJarProps {
  playerChips: number;
  potTotal?: number;
  isDancing?: boolean;
  onClick?: () => void;
  onOpenTopUp?: () => void;
}

export default function GoldenJar({
  playerChips,
  isDancing = false,
  onClick,
  onOpenTopUp,
}: GoldenJarProps) {
  const mood = getJarMood(playerChips);

  return (
    <div className="w-full max-w-md mx-auto flex flex-row items-center justify-between px-3.5 py-1.5 bg-gradient-to-r from-[#240409] via-[#35070E] to-[#240409] rounded-2xl border-2 border-[#D4AF37]/50 shadow-lg select-none shrink-0 transition-all">
      {/* Golden Jar Mascot Icon: Compact horizontal row for all screens */}
      <motion.div
        className="relative cursor-pointer shrink-0 flex items-center justify-center"
        onClick={onClick}
        animate={
          isDancing
            ? {
                y: [0, -12, 0, -6, 0, -2, 0],
                rotate: [0, -6, 5, -3, 2, 0],
                scale: [1, 1.1, 0.95, 1.05, 0.98, 1],
              }
            : {
                y: [0, -2, 0],
              }
        }
        transition={
          isDancing
            ? { duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <svg
          className="w-12 h-12 drop-shadow-[0_4px_12px_rgba(217,119,6,0.35)] transition-all"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="jarGoldGradMain" cx="30%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="18%" stopColor="#FEF08A" />
              <stop offset="42%" stopColor="#FBBF24" />
              <stop offset="78%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </radialGradient>
            <linearGradient id="cloudRimGradMain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Jar Handles */}
          <path
            d="M22 55 C12 55, 12 75, 22 75"
            stroke="#B45309"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M98 55 C108 55, 108 75, 98 75"
            stroke="#B45309"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Jar Plump Belly */}
          <path
            d="M26 44 C20 60, 18 92, 32 108 C40 115, 80 115, 88 108 C102 92, 100 60, 94 44 Z"
            fill="url(#jarGoldGradMain)"
            stroke="#92400E"
            strokeWidth="4"
          />

          {/* Specular Highlight */}
          <path
            d="M36 50 C30 62, 30 84, 38 96 C42 102, 50 102, 44 92 C38 82, 38 64, 46 54 Z"
            fill="#FFFFFF"
            opacity="0.65"
          />

          {/* Fluffy Cloud Rim Lid */}
          <path
            d="M22 36 C22 28, 30 24, 38 28 C44 22, 54 22, 60 26 C66 22, 76 22, 82 28 C90 24, 98 28, 98 36 C98 42, 92 46, 84 44 C80 47, 72 47, 60 45 C48 47, 40 47, 36 44 C28 46, 22 42, 22 36 Z"
            fill="url(#cloudRimGradMain)"
            stroke="#92400E"
            strokeWidth="3.5"
          />

          {/* Top Gold Sphere Knob */}
          <circle cx="60" cy="18" r="7" fill="url(#jarGoldGradMain)" stroke="#92400E" strokeWidth="3" />

          {/* Dynamic Facial Expressions */}
          {mood === 'worried' && (
            <g>
              <circle cx="48" cy="74" r="3.5" fill="#78350F" />
              <circle cx="72" cy="74" r="3.5" fill="#78350F" />
              <path d="M44 68 L52 70" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M76 68 L68 70" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M83 66 C83 69, 81 71, 79 71 C77 71, 75 69, 79 64 Z" fill="#38BDF8" />
              <path
                d="M54 83 Q57 80 60 83 Q63 86 66 83"
                stroke="#78350F"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {mood === 'confident' && (
            <g>
              <path
                d="M44 74 C47 69, 52 69, 55 74"
                stroke="#78350F"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M65 74 C68 69, 73 69, 76 74"
                stroke="#78350F"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="42" cy="78" r="4" fill="#FB7185" opacity="0.6" />
              <circle cx="78" cy="78" r="4" fill="#FB7185" opacity="0.6" />
              <path d="M54 79 C54 86, 66 86, 66 79 Z" fill="#991B1B" stroke="#78350F" strokeWidth="2" />
            </g>
          )}

          {mood === 'ecstatic' && (
            <g>
              <path
                d="M49 67 L51 72 L56 73 L52 77 L53 82 L49 79 L45 82 L46 77 L42 73 L47 72 Z"
                fill="#F59E0B"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              <path
                d="M71 67 L73 72 L78 73 L74 77 L75 82 L71 79 L67 82 L68 77 L64 73 L69 72 Z"
                fill="#F59E0B"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              <circle cx="39" cy="78" r="5" fill="#F43F5E" opacity="0.65" />
              <circle cx="81" cy="78" r="5" fill="#F43F5E" opacity="0.65" />
              <path
                d="M52 80 C52 93, 68 93, 68 80 Z"
                fill="#7F1D1D"
                stroke="#78350F"
                strokeWidth="2.5"
              />
              <ellipse cx="60" cy="87" rx="4" ry="2" fill="#FB7185" />
              <path
                d="M50 58 L55 63 L60 56 L65 63 L70 58 L68 66 L52 66 Z"
                fill="#FDE047"
                stroke="#78350F"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </motion.div>

      {/* "YOUR TOKENS" Label & Token Count or 0 Tokens Reminder */}
      {playerChips <= 0 ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-600/50 shadow-xs block">
              You are out of tokens
            </span>
            <span className="text-[10px] font-bold text-amber-200/70 mt-0.5 block">
              Top up to place bets
            </span>
          </div>
          {onOpenTopUp && (
            <button
              type="button"
              onClick={onOpenTopUp}
              className="bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-110 text-[#451A03] font-black text-xs px-2.5 py-1.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>+ Top Up</span>
            </button>
          )}
        </div>
      ) : (
        <div className="text-right shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#FDE047] bg-[#B45309]/30 px-2 py-0.5 rounded-full border border-[#F59E0B]/50 shadow-xs">
            Your Tokens
          </span>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight mt-0.5 drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]">
            {playerChips.toLocaleString()} <span className="text-xs font-bold text-[#FCD34D]">tokens</span>
          </div>
        </div>
      )}
    </div>
  );
}
