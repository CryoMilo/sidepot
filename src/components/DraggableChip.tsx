import { motion, PanInfo } from 'framer-motion';
import { playSound } from '../utils/audio';

export interface DraggableChipProps {
  amount: number;
  label: string;
  subLabel?: string;
  gradientClass: string;
  textColor: string;
  disabled?: boolean;
  size?: 'normal' | 'large';
  onBet: (amount: number) => void;
}

export default function DraggableChip({
  amount,
  label,
  subLabel = 'TOKEN',
  gradientClass,
  textColor,
  disabled = false,
  size = 'normal',
  onBet,
}: DraggableChipProps) {
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
        navigator.vibrate(30);
      } catch {
        // ignore
      }
    }
    onBet(amount);
  };

  const sizeClasses = size === 'large' ? 'w-20 h-20' : 'w-16 h-16';

  return (
    <div className={`relative ${sizeClasses} shrink-0 flex items-center justify-center touch-none select-none`}>
      <motion.div
        drag={!disabled}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.6}
        dragTransition={{ bounceStiffness: 450, bounceDamping: 25 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 1.15 }}
        className={`w-full h-full rounded-full flex flex-col items-center justify-center border-2 border-white shadow-[0_6px_14px_rgba(217,119,6,0.22),inset_0_2px_4px_rgba(255,255,255,0.6)] cursor-grab active:cursor-grabbing select-none touch-none ${gradientClass} ${
          disabled ? 'opacity-35 cursor-not-allowed' : ''
        }`}
        style={{ color: textColor }}
      >
        <span className="text-[8px] font-black tracking-wider opacity-85 leading-tight">
          {subLabel}
        </span>
        <span className="text-sm font-black tracking-tight leading-tight">
          {label}
        </span>
      </motion.div>
    </div>
  );
}
