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
  { bg: 'bg-red-500', text: 'text-white', Icon: Triangle },
  { bg: 'bg-blue-500', text: 'text-white', Icon: Diamond },
  { bg: 'bg-yellow-400', text: 'text-black', Icon: Circle },
  { bg: 'bg-green-500', text: 'text-white', Icon: Square },
];

export function AnswerButton({
  label,
  slotIndex,
  isSelected,
  isCorrect,
  isWrong,
  disabled,
  onClick,
  testId
}: AnswerButtonProps) {
  const config = slotConfig[slotIndex % 4];
  const { Icon } = config;

  let stateClasses = "";
  if (isCorrect) {
    stateClasses = "ring-4 ring-white scale-[1.05] z-10 brightness-110";
  } else if (isWrong) {
    stateClasses = "opacity-50 grayscale";
  } else if (disabled && !isCorrect && !isWrong) {
    stateClasses = "opacity-60";
  } else if (!disabled) {
    stateClasses = "hover:scale-[1.02] hover:brightness-110 active:scale-95";
  }

  const shakeAnimation = isWrong && isSelected ? { x: [-15, 15, -15, 15, 0] } : {};

  return (
    <motion.button
      animate={shakeAnimation}
      transition={{ duration: 0.4 }}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={`relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-6 p-4 md:p-8 rounded-3xl w-full h-full min-h-[120px] shadow-[0_8px_0_rgba(0,0,0,0.2)] transition-all duration-200 ${config.bg} ${config.text} ${stateClasses} ${disabled ? 'shadow-[0_2px_0_rgba(0,0,0,0.2)] translate-y-1.5' : 'hover:shadow-[0_10px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-2 active:shadow-none'}`}
    >
      <div className="shrink-0 mb-2 md:mb-0">
        <Icon className="w-10 h-10 md:w-16 md:h-16 fill-current opacity-90 drop-shadow-sm" />
      </div>
      <span className="text-2xl md:text-5xl font-black tracking-widest text-center md:text-left drop-shadow-md leading-tight">
        {label}
      </span>
    </motion.button>
  );
}
