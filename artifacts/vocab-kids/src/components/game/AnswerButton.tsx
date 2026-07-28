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
  /** 桌機 hover 時自動朗讀選項的回呼 */
  onHoverSpeak?: () => void;
  testId: string;
}

const slotConfig: { bg: string; text: string; Icon: LucideIcon }[] = [
  { bg: 'bg-red-500',    text: 'text-white', Icon: Triangle },
  { bg: 'bg-blue-500',   text: 'text-white', Icon: Diamond  },
  { bg: 'bg-yellow-400', text: 'text-black', Icon: Circle   },
  { bg: 'bg-green-500',  text: 'text-white', Icon: Square   },
];

export function AnswerButton({
  label, slotIndex, isSelected, isCorrect, isWrong, isPendingConfirm, disabled, onClick, onHoverSpeak, testId,
}: AnswerButtonProps) {
  const config = slotConfig[slotIndex % 4];
  const { Icon } = config;

  let stateClasses = '';
  if (isCorrect)             stateClasses = 'ring-4 ring-white scale-[1.05] z-10 brightness-110';
  else if (isWrong)          stateClasses = 'opacity-50 grayscale';
  else if (isPendingConfirm) stateClasses = 'ring-4 ring-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.9)] scale-[1.04] z-20 brightness-115 animate-pulse';
  else if (disabled)         stateClasses = 'opacity-60';
  else                       stateClasses = 'hover:scale-[1.02] hover:brightness-110 active:scale-95';

  const shakeAnimation = isWrong && isSelected ? { x: [-12, 12, -12, 12, 0] } : {};

  const handleMouseEnter = () => {
    // 只在支援 hover 的裝置（桌機/筆電）上觸發，手機/平板不觸發
    if (!disabled && onHoverSpeak && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      onHoverSpeak();
    }
  };

  return (
    <motion.button
      animate={shakeAnimation}
      transition={{ duration: 0.4 }}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      data-testid={testId}
      className={[
        'game-answer-button relative flex flex-row items-center justify-start',
        'gap-2.5 sm:gap-3 md:gap-5',
        'p-2.5 sm:p-3 md:px-6 md:py-4',
        'rounded-xl sm:rounded-2xl md:rounded-3xl w-full h-full',
        'min-h-[56px] sm:min-h-[72px] md:min-h-[96px]',
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

      <div className="game-answer-icon shrink-0">
        <Icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 fill-current opacity-90 drop-shadow-sm" />
      </div>
      <span className="game-answer-label min-w-0 flex-1 text-lg sm:text-xl md:text-3xl font-black tracking-wide text-left drop-shadow-md leading-tight break-words max-w-full">
        {label}
      </span>
    </motion.button>
  );
}
