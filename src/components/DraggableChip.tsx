import { motion, PanInfo } from 'framer-motion';
import { playSound } from '../utils/audio';

export interface DraggableChipProps {
  amount: number;
  label: string;
  gradientClass: string;
  textColor: string;
  disabled?: boolean;
  onBet: (amount: number) => void;
}

export default function DraggableChip({
  amount,
  label,
  gradientClass,
  textColor,
  disabled = false,
  onBet,
}: DraggableChipProps) {
  const handleDragStart = () => {
    if (disabled) return;
    playSound('pop');
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    // Trigger bet if dragged/flicked upward by more than 80px or fast velocity
    if (info.offset.y < -80 || info.velocity.y < -300) {
      playSound('clink');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {
          // ignore
        }
      }
      onBet(amount);
    }
  };

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <motion.div
        drag={!disabled}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.65}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 1.12 }}
        className={`w-18 h-18 rounded-full flex flex-col items-center justify-center border-2 border-white shadow-[0_8px_16px_rgba(217,119,6,0.25),inset_0_2px_4px_rgba(255,255,255,0.6)] cursor-grab active:cursor-grabbing select-none ${gradientClass} ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        style={{ color: textColor }}
      >
        <span className="text-[9px] font-black tracking-wider opacity-85">TOKEN</span>
        <span className="text-base font-black tracking-tight">{label}</span>
      </motion.div>
    </div>
  );
}
