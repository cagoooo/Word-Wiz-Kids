/**
 * P1-C: 聽力填空測驗模式
 * 純音訊播放，訓練「聽→辨」能力
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, ArrowLeft, Trophy, RotateCcw, Headphones, Star, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { speakWord } from '@/lib/tts';
import { useWordLibrary } from '@/hooks/useWordLibrary';
import { Word } from '@/data/words';
import { UserExpBar } from '@/components/gamification/UserExpBar';
import { sfxCorrect, sfxWrong, sfxLevelComplete } from '@/lib/soundEngine';
import { addExp } from '@/lib/gamification';
import { recordMistake } from '@/lib/mistakes';

type Phase = 'select' | 'playing' | 'results';

interface ListenQuestion {
  word: Word;
  options: Word[];
  correctIndex: number;
}

function generateListenQuestions(words: Word[], count: number): ListenQuestion[] {
  const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map(word => {
    const others = words.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...others, word].sort(() => Math.random() - 0.5);
    return { word, options, correctIndex: options.findIndex(o => o.id === word.id) };
  });
}

export default function ListenQuiz() {
  const { words: allWords, categories, loading } = useWordLibrary();
  const [phase, setPhase] = useState<Phase>('select');
  const [category, setCategory] = useState('全部');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [questions, setQuestions] = useState<ListenQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const COUNTS = { easy: 6, normal: 10, hard: 15 };
  const filteredWords = category === '全部' ? allWords : allWords.filter(w => w.category === category);
  const canStart = filteredWords.length >= 4;

  const startGame = () => {
    const qs = generateListenQuestions(filteredWords, COUNTS[difficulty]);
    setQuestions(qs);
    setCurrentIdx(0);
    setCorrectCount(0);
    setSelected(null);
    setHasPlayed(false);
    setPhase('playing');
  };

  const playCurrentWord = useCallback(() => {
    if (!questions[currentIdx]) return;
    setIsPlaying(true);
    setHasPlayed(true);
    speakWord(questions[currentIdx].word.english, 0.75);
    setTimeout(() => setIsPlaying(false), 1500);
  }, [questions, currentIdx]);

  // Auto-play when question changes
  useEffect(() => {
    if (phase === 'playing' && questions[currentIdx]) {
      setSelected(null);
      setHasPlayed(false);
      const timer = setTimeout(() => playCurrentWord(), 600);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, phase]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === questions[currentIdx].correctIndex;
    if (isCorrect) {
      sfxCorrect();
      setCorrectCount(c => c + 1);
    } else {
      sfxWrong();
      recordMistake(questions[currentIdx].word);
    }
    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        sfxLevelComplete();
        const exp = correctCount * 5 + (isCorrect ? 5 : 0);
        addExp(exp);
        setPhase('results');
      } else {
        setCurrentIdx(i => i + 1);
      }
    }, 1600);
  };

  const ANSWER_COLORS = [
    'from-red-400 to-rose-500 shadow-rose-300',
    'from-blue-400 to-indigo-500 shadow-blue-300',
    'from-yellow-400 to-amber-500 shadow-amber-300',
    'from-green-400 to-emerald-500 shadow-green-300',
  ];

  const SLOT_EMOJIS = ['🔴', '🔵', '🟡', '🟢'];

  if (loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (phase === 'select') return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 rounded-full bg-white shadow hover:scale-105 transition-transform text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Headphones className="w-6 h-6 text-blue-500" /> 聽力測驗
            </h1>
            <p className="text-sm text-muted-foreground">聽聲音，選出正確單字！</p>
          </div>
        </div>
        <UserExpBar />

        <div className="mt-6 bg-white rounded-3xl p-6 shadow-lg border border-blue-100 space-y-6">
          {/* Category */}
          <div>
            <h2 className="font-black text-lg mb-3">選擇主題</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {['全部', ...categories].map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} className={py-2 px-3 rounded-2xl font-bold text-sm border-2 transition-all }>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h2 className="font-black text-lg mb-3">選擇難度</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'normal', 'hard'] as const).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={py-3 rounded-2xl font-bold border-2 transition-all }>
                  {d === 'easy' ? '😊 簡單 (6題)' : d === 'normal' ? '🎯 正常 (10題)' : '🔥 挑戰 (15題)'}
                </button>
              ))}
            </div>
          </div>

          {!canStart && (
            <p className="text-center text-red-500 font-bold text-sm">此主題單字不足 4 個，請選擇其他主題</p>
          )}

          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            🎧 開始聽力測驗
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'results') {
    const stars = correctCount === questions.length ? 3 : correctCount >= questions.length * 0.7 ? 2 : 1;
    const expEarned = correctCount * 5 + (correctCount === questions.length ? 20 : 0);
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-cyan-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-blue-200 text-center max-w-md w-full">
          <h1 className="text-4xl font-black mb-6">🎧 聽力結算</h1>
          <div className="flex justify-center gap-3 mb-6">
            {[1,2,3].map(s => <Star key={s} className={w-16 h-16 } />)}
          </div>
          <div className="bg-blue-50 rounded-2xl p-5 mb-6 space-y-2">
            <p className="text-3xl font-black text-blue-700">答對 {correctCount} / {questions.length} 題</p>
            <p className="text-lg font-bold text-yellow-600">✨ 獲得 +{expEarned} EXP</p>
          </div>
          <div className="flex gap-3">
            <button onClick={startGame} className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" /> 再玩一次
            </button>
            <Link href="/" className="flex-1 py-4 bg-white border-2 border-border text-foreground rounded-2xl font-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" /> 回首頁
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Playing phase
  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 gap-6">
      {/* Progress */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-white/70 text-sm font-bold mb-2">
          <span>第 {currentIdx + 1} / {questions.length} 題</span>
          <span>答對 {correctCount} 題</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" animate={{ width: ${((currentIdx + 1) / questions.length) * 100}% }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* Speaker card */}
      <motion.div key={currentIdx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/10 backdrop-blur-md rounded-3xl p-10 flex flex-col items-center gap-6 border border-white/20 w-full max-w-md">
        <p className="text-white/80 font-bold text-lg">👂 聽聲音，選出正確的單字</p>

        <motion.button
          onClick={playCurrentWord}
          whileTap={{ scale: 0.9 }}
          className={w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl }
        >
          {isPlaying ? <Volume2 className="w-16 h-16 text-white" /> : <Play className="w-16 h-16 text-white" />}
        </motion.button>

        {!hasPlayed && <p className="text-white/60 text-sm animate-bounce">👆 點擊播放聲音</p>}
        {hasPlayed && selected === null && <p className="text-white/60 text-sm">選擇你的答案 ↓</p>}
      </motion.div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        <AnimatePresence>
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isCorrectOpt = idx === q.correctIndex;
            const showResult = selected !== null;
            const bgClass = showResult
              ? isCorrectOpt ? 'bg-green-500 border-green-300 scale-105' : isSelected ? 'bg-red-500 border-red-300' : 'bg-white/10 border-white/20 opacity-50'
              : g-gradient-to-br  border-transparent hover:scale-105;

            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => hasPlayed && handleAnswer(idx)}
                disabled={selected !== null || !hasPlayed}
                className={p-5 rounded-2xl border-2 text-white font-black text-lg transition-all shadow-lg disabled:cursor-not-allowed  }
              >
                <div className="text-2xl mb-1">{SLOT_EMOJIS[idx]}</div>
                <div className="text-lg leading-tight">{opt.english}</div>
                {showResult && <div className="text-sm font-normal opacity-80 mt-1">{opt.chinese}</div>}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Replay button */}
      <button onClick={playCurrentWord} className="text-white/60 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
        <Volume2 className="w-4 h-4" /> 重新播放
      </button>
    </div>
  );
}