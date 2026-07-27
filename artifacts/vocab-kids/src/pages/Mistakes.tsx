import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Sparkles, Check, Trash2, Play, RefreshCw, Flame, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { getMistakes, markMistakeMastered, removeMistake, clearAllMistakes, type MistakeItem } from '@/lib/mistakes';
import { AudioButton } from '@/components/ui/AudioButton';
import { addExp } from '@/lib/gamification';
import { sfxCorrect, sfxWrong, sfxLevelComplete } from '@/lib/soundEngine';

export default function Mistakes() {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [trainingMode, setTrainingMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const load = () => {
    setMistakes(getMistakes());
  };

  useEffect(() => {
    load();
  }, []);

  const activeMistakes = mistakes.filter((m) => !m.mastered);
  const masteredMistakes = mistakes.filter((m) => m.mastered);

  // Setup options for training question
  const prepareQuestion = (index: number) => {
    if (activeMistakes.length === 0 || index >= activeMistakes.length) {
      setFinished(true);
      return;
    }

    const current = activeMistakes[index];
    const correctAns = current.chinese;

    // Generate dummy options
    const dummyPool = mistakes.map((m) => m.chinese).filter((c) => c !== correctAns);
    const shuffledDummies = [...new Set(dummyPool)].sort(() => Math.random() - 0.5).slice(0, 3);

    // Fallback dummy answers if not enough mistakes
    const defaultDummies = ['蘋果', '跑步', '美麗的', '學校', '星星', '貓咪'];
    while (shuffledDummies.length < 3) {
      const fallback = defaultDummies.find((d) => d !== correctAns && !shuffledDummies.includes(d)) || '其他';
      shuffledDummies.push(fallback);
    }

    const allOpts = [correctAns, ...shuffledDummies].sort(() => Math.random() - 0.5);
    setOptions(allOpts);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const startTraining = () => {
    if (activeMistakes.length === 0) return;
    setTrainingMode(true);
    setCurrentIndex(0);
    setFinished(false);
    prepareQuestion(0);
  };

  const handleOptionClick = (opt: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);

    const current = activeMistakes[currentIndex];
    const correct = opt === current.chinese;
    setIsCorrect(correct);

    if (correct) {
      sfxCorrect();
      markMistakeMastered(current.id);
      addExp(25); // Award EXP for clearing mistake
    } else {
      sfxWrong();
    }

    setTimeout(() => {
      const next = currentIndex + 1;
      if (next < activeMistakes.length) {
        setCurrentIndex(next);
        prepareQuestion(next);
      } else {
        sfxLevelComplete();
        setFinished(true);
        load();
      }
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] pt-24 pb-16 px-4 bg-background flex flex-col items-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
                <BookMarked className="w-7 h-7 text-rose-500" />
                錯題復仇本
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                自動收集答錯的單字，進行專屬弱點特訓並戰勝它們！
              </p>
            </div>
          </div>

          {activeMistakes.length > 0 && !trainingMode && (
            <button
              onClick={startTraining}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              開始錯題特訓 ({activeMistakes.length})
            </button>
          )}
        </div>

        {/* Training Mode View */}
        {trainingMode ? (
          <div className="bg-card border-2 border-primary/20 rounded-3xl p-6 sm:p-10 shadow-xl max-w-xl mx-auto text-center">
            {finished ? (
              <div className="py-8 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-foreground">特訓完成！魔王全數被消滅！</h3>
                <p className="text-muted-foreground text-sm">
                  你消滅了錯題，獲得了滿滿的經驗值！繼續保持！
                </p>
                <button
                  onClick={() => { setTrainingMode(false); load(); }}
                  className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
                >
                  返回錯題本
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-6">
                  <span>錯題特訓 第 {currentIndex + 1} / {activeMistakes.length} 題</span>
                  <span className="text-rose-500">❌ 錯題復仇中</span>
                </div>

                {/* Question word */}
                <div className="mb-8 p-6 rounded-2xl bg-muted/50 border border-border flex flex-col items-center gap-3">
                  <span className="text-4xl font-black text-primary">{activeMistakes[currentIndex]?.english}</span>
                  {activeMistakes[currentIndex]?.phonetic && (
                    <span className="text-sm font-mono text-muted-foreground">{activeMistakes[currentIndex]?.phonetic}</span>
                  )}
                  <AudioButton text={activeMistakes[currentIndex]?.english || ''} size="md" />
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {options.map((opt, idx) => {
                    const isSelected = selectedOption === opt;
                    const isRight = opt === activeMistakes[currentIndex]?.chinese;

                    let btnStyle = 'bg-card border-border hover:border-primary text-foreground';
                    if (selectedOption !== null) {
                      if (isRight) btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                      else if (isSelected) btnStyle = 'bg-rose-500 text-white border-rose-600 font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(opt)}
                        disabled={selectedOption !== null}
                        className={`p-4 rounded-2xl border-2 text-center text-base transition-all active:scale-95 ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal List View */
          <div className="space-y-6">
            {/* Active mistakes */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                待複習的錯題 ({activeMistakes.length})
              </h2>

              {activeMistakes.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                  <h3 className="text-lg font-bold text-foreground mb-1">太棒了！目前沒有未消滅的錯題</h3>
                  <p className="text-xs text-muted-foreground">在遊戲中答錯的單字將會自動收集在這裡</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeMistakes.map((m) => (
                    <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-rose-500/50 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-foreground">{m.english}</span>
                            <AudioButton text={m.english} size="sm" showSlow={false} />
                          </div>
                          <span className="text-sm font-bold text-primary">{m.chinese}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                          ❌ 錯 {m.wrongCount} 次
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                        <span className="text-muted-foreground">{m.lastWrongDate}</span>
                        <button
                          onClick={() => { markMistakeMastered(m.id); load(); }}
                          className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> 已掌握
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mastered mistakes */}
            {masteredMistakes.length > 0 && (
              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-md font-bold text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    已克服的單字 ({masteredMistakes.length})
                  </h2>
                  <button
                    onClick={() => { clearAllMistakes(); load(); }}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> 清空紀錄
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-60">
                  {masteredMistakes.map((m) => (
                    <div key={m.id} className="bg-muted/50 border border-border rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-foreground line-through">{m.english}</p>
                        <p className="text-xs text-muted-foreground">{m.chinese}</p>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold">已克服</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
