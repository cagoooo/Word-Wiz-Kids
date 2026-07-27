import { motion } from 'framer-motion';
import { Triangle, Circle, Square, Diamond, LucideIcon } from 'lucide-react';

interface AnswerButtonProps {
  label: string;
  slotIndex: number;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isPendingConfirm?: boolean;
  disabled: boolean;
  onClick: () => void;
  testId: string;
}

const slotConfig: { bg: string; text: string; Icon: LucideIcon }[] = [
  { bg: 'bg-red-500',    text: 'text-white', Icon: Triangle },
  { bg: 'bg-blue-500',   text: 'text-white', Icon: Diamond  },
  { bg: 'bg-yellow-400', text: 'text-black', Icon: Circle   },
  { bg: 'bg-green-500',  text: 'text-white', Icon: Square   },
];

export function AnswerButton({
  label, slotIndex, isSelected, isCorrect, isWrong, isPendingConfirm, disabled, onClick, testId,
}: AnswerButtonProps) {
  const config = slotConfig[slotIndex % 4];
  const { Icon } = config;

  let stateClasses = '';
  if (isCorrect)            stateClasses = 'ring-4 ring-white scale-[1.05] z-10 brightness-110';
  else if (isWrong)         stateClasses = 'opacity-50 grayscale';
  else if (isPendingConfirm) stateClasses = 'ring-4 ring-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.9)] scale-[1.04] z-20 brightness-115 animate-pulse';
  else if (disabled)        stateClasses = 'opacity-60';
  else                      stateClasses = 'hover:scale-[1.02] hover:brightness-110 active:scale-95';

  const shakeAnimation = isWrong && isSelected ? { x: [-12, 12, -12, 12, 0] } : {};

  return (
    <motion.button
      animate={shakeAnimation}
      transition={{ duration: 0.4 }}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={[
        'relative flex flex-col md:flex-row items-center justify-center md:justify-start',
        'gap-1 md:gap-6',
        /* ↓ 縮小手機/iPad 的 padding，保留桌機的大版型 */
        'p-2 sm:p-3 md:p-8',
        'rounded-2xl sm:rounded-3xl w-full h-full',
        /* ↓ 手機60px / iPad 80px / 桌機120px */
        'min-h-[60px] sm:min-h-[80px] md:min-h-[120px]',
        'shadow-[0_6px_0_rgba(0,0,0,0.2)] transition-all duration-200',
        config.bg, config.text, stateClasses,
        disabled
          ? 'shadow-[0_2px_0_rgba(0,0,0,0.2)] translate-y-1'
          : 'hover:shadow-[0_8px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-2 active:shadow-none',
      ].join(' ')}
    >
      {/* 待確認輔助浮籤 */}
      {isPendingConfirm && (
        <span className="absolute -top-3 right-3 bg-yellow-300 text-black text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-md border border-yellow-400 flex items-center gap-1 z-30 animate-bounce">
          🔊 再按一次確認！
        </span>
      )}

      <div className="shrink-0">
        {/* ↓ 手機小圖示，桌機大圖示 */}
        <Icon className="w-4 h-4 sm:w-6 sm:h-6 md:w-14 md:h-14 fill-current opacity-90 drop-shadow-sm" />
      </div>
      <span className="text-sm sm:text-base md:text-4xl font-black tracking-wide text-center md:text-left drop-shadow-md leading-tight break-words max-w-full">
        {label}
      </span>
    </motion.button>
  );
}

