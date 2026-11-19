import { motion, PanInfo } from 'framer-motion';
import { playSound } from '../utils/audio';

export interface CasinoChipProps {
  amount: number;
  label: string;
  subLabel?: string;
  clayColor: string;
  stripeColor: string;
  inlayBg?: string;
  textColor: string;
  accentRing?: string;
  disabled?: boolean;
  size?: 'normal' | 'large';
  onBet: (amount: number) => void;
}

export default function DraggableChip({
  amount,
  label,
  subLabel = 'TOKEN',
  clayColor,
  stripeColor,
  inlayBg = '#FFFDF7',
  textColor,
  accentRing = '#F59E0B',
  disabled = false,
  size = 'normal',
  onBet,
}: CasinoChipProps) {
  const handleDragStart = () => {
    if (disabled) return;
    playSound('pop');
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    // Trigger bet if dragged/flicked upward by more than 50px or flicked with negative velocity
    if (info.offset.y < -50 || info.velocity.y < -200) {
      triggerSuccessBet();
    }
  };

  const handleClick = () => {
    if (disabled) return;
    triggerSuccessBet();
  };

  const triggerSuccessBet = () => {
    playSound('clink');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // ignore
      }
    }
    onBet(amount);
  };

  const sizeClasses = size === 'large' ? 'w-24 h-24' : 'w-[76px] h-[76px] sm:w-[84px] sm:h-[84px]';
  const edgeAngles = [0, 60, 120, 180, 240, 300];

  return (
    <div
      className={`relative ${sizeClasses} shrink-0 flex items-center justify-center select-none`}
      style={{ touchAction: 'pan-x' }}
    >
      <motion.div
        drag={!disabled ? 'y' : false}
        dragDirectionLock
        dragConstraints={{ top: -220, bottom: 0 }}
        dragElastic={0.4}
        dragTransition={{ bounceStiffness: 450, bounceDamping: 25 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        whileHover={{ scale: disabled ? 1 : 1.06 }}
        whileTap={{ scale: disabled ? 1 : 1.12 }}
        className={`w-full h-full cursor-grab active:cursor-grabbing select-none ${
          disabled ? 'opacity-35 cursor-not-allowed' : ''
        }`}
        style={{ touchAction: 'pan-x' }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_6px_12px_rgba(0,0,0,0.24)] filter"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Rim 3D Bevel Gradient */}
            <radialGradient id={`clayShade-${label}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <stop offset="45%" stopColor={clayColor} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
            </radialGradient>

            {/* Inlay Recessed Shadow */}
            <radialGradient id={`inlayShade-${label}`} cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="85%" stopColor={inlayBg} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </radialGradient>

            {/* Specular Rim Light */}
            <linearGradient id={`specular-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </linearGradient>

            {/* Mask to ensure edge stripe inserts stay within chip outer boundary */}
            <clipPath id={`chipClip-${label}`}>
              <circle cx="50" cy="50" r="48" />
            </clipPath>
          </defs>

          {/* Base Clay Body */}
          <circle cx="50" cy="50" r="48" fill={clayColor} />

          {/* 6 Authentic Casino Edge Stripe Inserts */}
          <g clipPath={`url(#chipClip-${label})`}>
            {edgeAngles.map(angle => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                {/* Main Edge Spot Insert */}
                <rect
                  x="43.5"
                  y="1"
                  width="13"
                  height="12"
                  rx="1.5"
                  fill={stripeColor}
                />
                {/* Dual Stripe Notch Detail for Real Clay Look */}
                <line
                  x1="50"
                  y1="1"
                  x2="50"
                  y2="13"
                  stroke={clayColor}
                  strokeWidth="1.5"
                  strokeOpacity="0.65"
                />
              </g>
            ))}
          </g>

          {/* 3D Cylindrical Shading on Clay Rim */}
          <circle cx="50" cy="50" r="48" fill={`url(#clayShade-${label})`} />
          <circle
            cx="50"
            cy="50"
            r="47.5"
            stroke={`url(#specular-${label})`}
            strokeWidth="1.5"
            fill="none"
          />

          {/* Clay Mould Groove Ring (Classic Casino Dice/Stitch Ring) */}
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1.5"
            strokeDasharray="3.5 2.5"
          />
          <circle
            cx="50"
            cy="50"
            r="36.8"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1"
            strokeDasharray="3.5 2.5"
          />

          {/* Recessed Center Inlay Medallion */}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill={`url(#inlayShade-${label})`}
            stroke={accentRing}
            strokeWidth="2.5"
          />

          {/* Concentric Decorative Inlay Line */}
          <circle
            cx="50"
            cy="50"
            r="24"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />

          {/* Subtle Casino Brand Branding */}
          <text
            x="50"
            y="35"
            textAnchor="middle"
            fill="#78350F"
            fontSize="5.5"
            fontWeight="900"
            letterSpacing="1"
            opacity="0.75"
          >
            SIDEPOT
          </text>

          {/* Main Casino Denomination Value */}
          <text
            x="50"
            y={label === 'ALL IN' ? '53' : '55'}
            textAnchor="middle"
            fill={textColor}
            fontSize={label === 'ALL IN' ? '9.5' : label.length > 2 ? '13' : '16'}
            fontWeight="900"
            letterSpacing="-0.5"
          >
            {label}
          </text>

          {/* Token Sub-label */}
          <text
            x="50"
            y="65"
            textAnchor="middle"
            fill="#92400E"
            fontSize="5"
            fontWeight="900"
            letterSpacing="0.8"
            opacity="0.8"
          >
            {subLabel}
          </text>

          {/* Inlay Top Gloss Highlight Arc */}
          <path
            d="M 28 42 A 22 22 0 0 1 72 42 A 22 17 0 0 0 28 42 Z"
            fill="#FFFFFF"
            opacity="0.32"
          />
        </svg>
      </motion.div>
    </div>
  );
}
