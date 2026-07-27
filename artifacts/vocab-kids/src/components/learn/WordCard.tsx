import { Volume2, RotateCcw } from 'lucide-react';
import { Word } from '@/data/words';
import { PhoneticHighlight } from './PhoneticHighlight';
import { Button } from '@/components/ui/button';

interface WordCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: () => void;
}

export function WordCard({ word, isFlipped, onFlip, onSpeak }: WordCardProps) {
  return (
    <div
      className="relative w-full h-[380px] sm:h-[440px] mx-auto cursor-pointer"
      style={{ perspective: '1200px' }}
      data-testid="word-card"
      onClick={onFlip}
    >
      {/* Inner wrapper that flips */}
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Face — English */}
        <div
          className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border-4 border-purple-100 dark:border-purple-900/40 flex flex-col items-center justify-center p-8"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Top gradient stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 rounded-t-[2rem] bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400" />

          <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full text-center">
            <PhoneticHighlight word={word} />
            {word.phonetic && (
              <p className="text-xl text-slate-400 dark:text-slate-500 font-mono tracking-widest">
                {word.phonetic}
              </p>
            )}
            <p className="text-sm text-slate-400 font-medium mt-2">點擊卡片查看中文</p>
          </div>

          {/* Speak button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            onClick={(e) => {
              e.stopPropagation();
              onSpeak();
            }}
            data-testid="button-speak"
          >
            <Volume2 className="w-7 h-7" />
          </Button>
        </div>

        {/* Back Face — Chinese */}
        <div
          className="absolute inset-0 w-full h-full bg-amber-50 dark:bg-amber-950/40 rounded-[2rem] shadow-xl border-4 border-amber-200 dark:border-amber-900/50 flex flex-col items-center justify-center p-8"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Category badge */}
          <div className="absolute top-6 left-6 px-4 py-1.5 bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full font-bold text-sm tracking-widest shadow-sm">
            {word.category}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full text-center mt-6">
            <h2 className="text-6xl font-black text-amber-900 dark:text-amber-100 tracking-wider">
              {word.chinese}
            </h2>

            {(word.example || word.exampleChinese) && (
              <div className="space-y-3 w-full bg-white/70 dark:bg-black/20 p-5 rounded-2xl shadow-sm">
                {word.example && (
                  <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    {word.example}
                  </p>
                )}
                {word.exampleChinese && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {word.exampleChinese}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-full px-8 py-5 text-base font-bold shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onFlip();
            }}
            data-testid="button-flip"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            翻回去
          </Button>
        </div>
      </div>
    </div>
  );
}
