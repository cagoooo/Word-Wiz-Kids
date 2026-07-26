import { motion } from 'framer-motion';
import { Triangle, Circle, Square, Diamond, LucideIcon } from 'lucide-react';

interface AnswerButtonProps {
  label: string;
  slotIndex: number;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
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
  label, slotIndex, isSelected, isCorrect, isWrong, disabled, onClick, testId,
}: AnswerButtonProps) {
  const config = slotConfig[slotIndex % 4];
  const { Icon } = config;

  let stateClasses = '';
  if (isCorrect)       stateClasses = 'ring-4 ring-white scale-[1.05] z-10 brightness-110';
  else if (isWrong)    stateClasses = 'opacity-50 grayscale';
  else if (disabled)   stateClasses = 'opacity-60';
  else                 stateClasses = 'hover:scale-[1.02] hover:brightness-110 active:scale-95';

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
        'gap-1 sm:gap-2 md:gap-6',
        'p-3 sm:p-4 md:p-8',
        'rounded-2xl sm:rounded-3xl w-full h-full',
        'min-h-[72px] sm:min-h-[100px] md:min-h-[120px]',
        'shadow-[0_6px_0_rgba(0,0,0,0.2)] transition-all duration-200',
        config.bg, config.text, stateClasses,
        disabled
          ? 'shadow-[0_2px_0_rgba(0,0,0,0.2)] translate-y-1'
          : 'hover:shadow-[0_8px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-2 active:shadow-none',
      ].join(' ')}
    >
      <div className="shrink-0 mb-0.5 sm:mb-1 md:mb-0">
        <Icon className="w-6 h-6 sm:w-9 sm:h-9 md:w-14 md:h-14 fill-current opacity-90 drop-shadow-sm" />
      </div>
      <span className="text-base sm:text-xl md:text-4xl font-black tracking-wide text-center md:text-left drop-shadow-md leading-tight break-words max-w-full">
        {label}
      </span>
    </motion.button>
  );
}
