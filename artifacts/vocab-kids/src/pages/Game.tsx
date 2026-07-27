import { useReducer, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, ArrowLeft, Trophy, Loader2, Volume2, VolumeX, WifiOff, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { speakWord } from '@/lib/tts';
import { useWordLibrary } from '@/hooks/useWordLibrary';
import { Confetti } from '@/components/game/Confetti';
import { AnswerButton } from '@/components/game/AnswerButton';
import { generateQuestions, calcScore, getStarRating, Question } from '@/lib/gameUtils';
import { submitScore } from '@/lib/firestore';
import { loadStudent, getOrCreateStudentId } from '@/hooks/useStudent';
import {
  startBGM, stopBGM,
  sfxCorrect, sfxWrong,
  sfxCountdownTick, sfxCountdownGo, sfxLevelComplete,
} from '@/lib/soundEngine';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { UserExpBar } from '@/components/gamification/UserExpBar';
import { AudioButton } from '@/components/ui/AudioButton';
import { addExp, getUserStats, saveUserStats } from '@/lib/gamification';

type GamePhase = 'select' | 'countdown' | 'question' | 'results';

interface GameState {
  phase: GamePhase;
  category: string;
  difficulty: 'easy' | 'normal' | 'hard';
  questions: Question[];
  currentQuestionIndex: number;
  selectedOptionIndex: number | null;
  score: number;
  combo: number;
  correctCount: number;
  lastScoreGain: number;
}

type GameAction =
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_DIFFICULTY'; payload: 'easy' | 'normal' | 'hard' }
  | { type: 'START_COUNTDOWN' }
  | { type: 'START_GAME'; payload: Question[] }
  | { type: 'ANSWER'; payload: { selectedIndex: number; isCorrect: boolean; scoreGain: number } }
  | { type: 'TIME_UP' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESTART' }
  | { type: 'CHANGE_TOPIC' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CATEGORY':
      return { ...state, category: action.payload };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'START_COUNTDOWN':
      return { ...state, phase: 'countdown' };
    case 'START_GAME':
      return {
        ...state,
        phase: 'question',
        questions: action.payload,
        currentQuestionIndex: 0,
        selectedOptionIndex: null,
        score: 0,
        combo: 0,
        correctCount: 0,
        lastScoreGain: 0,
      };
    case 'ANSWER':
      return {
        ...state,
        selectedOptionIndex: action.payload.selectedIndex,
        score: state.score + action.payload.scoreGain,
        combo: action.payload.isCorrect ? state.combo + 1 : 0,
        correctCount: action.payload.isCorrect ? state.correctCount + 1 : state.correctCount,
        lastScoreGain: action.payload.scoreGain,
      };
    case 'TIME_UP':
      return {
        ...state,
        selectedOptionIndex: -1,
        combo: 0,
        lastScoreGain: 0,
      };
    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex + 1 >= state.questions.length) {
        return { ...state, phase: 'results', selectedOptionIndex: null };
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        selectedOptionIndex: null,
        lastScoreGain: 0,
      };
    case 'RESTART':
      return {
        ...state,
        phase: 'countdown',
      };
    case 'CHANGE_TOPIC':
      return {
        ...state,
        phase: 'select',
      };
    default:
      return state;
  }
}

const DIFFICULTY_COUNTS = {
  easy: 6,
  normal: 10,
  hard: 15,
};

const DIFFICULTY_LABELS = {
  easy: '簡單',
  normal: '正常',
  hard: '挑戰',
};

export default function Game() {
  const { words: allWords, categories, loading, error: wordError } = useWordLibrary();
  const { muted, toggleMute } = useSoundSettings();

  // Keep a stable ref to allWords so the countdown useEffect can read the
  // latest value without being re-triggered every time allWords changes.
  const allWordsRef = useRef(allWords);
  useEffect(() => { allWordsRef.current = allWords; }, [allWords]);

  // BGM lifecycle — play while this page is open, stop on unmount or mute
  useEffect(() => {
    if (!muted) startBGM();
    return () => stopBGM();
  }, [muted]);

  const [state, dispatch] = useReducer(gameReducer, {
    phase: 'select',
    category: '全部',
    difficulty: 'normal',
    questions: [],
    currentQuestionIndex: 0,
    selectedOptionIndex: null,
    score: 0,
    combo: 0,
    correctCount: 0,
    lastScoreGain: 0,
  });

  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerWidth, setTimerWidth] = useState('100%');
  const timerStartRef = useRef<number>(0);
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll refs for the 3-step select screen
  const difficultyRef = useRef<HTMLDivElement>(null);
  const startBtnRef = useRef<HTMLButtonElement>(null);

  function scrollToNext(ref: React.RefObject<HTMLElement | null>) {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }

  const QUESTION_TIME_MS = 10000;

  useEffect(() => {
    return () => {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (state.phase === 'countdown') {
      sfxCountdownTick();
      setCountdown(3);
      const timer3 = setTimeout(() => { setCountdown(2); sfxCountdownTick(); }, 1000);
      const timer2 = setTimeout(() => { setCountdown(1); sfxCountdownTick(); }, 2000);
      const timer1 = setTimeout(() => { setCountdown(0); sfxCountdownGo(); }, 3000);
      const timerStart = setTimeout(() => {
        const words = state.category === '全部'
          ? allWordsRef.current
          : allWordsRef.current.filter(w => w.category === state.category);
        const q = generateQuestions(words, DIFFICULTY_COUNTS[state.difficulty]);
        dispatch({ type: 'START_GAME', payload: q });
      }, 4000);

      return () => {
        clearTimeout(timer3);
        clearTimeout(timer2);
        clearTimeout(timer1);
        clearTimeout(timerStart);
      };
    }
    return undefined;
  }, [state.phase, state.category, state.difficulty]);

  useEffect(() => {
    if (state.phase === 'question' && state.selectedOptionIndex === null) {
      const q = state.questions[state.currentQuestionIndex];
      // Only auto-speak when prompt is English (en_to_zh); for zh_to_en the user reads Chinese
      if (q.direction === 'en_to_zh') speakWord(q.word.english);

      setTimerWidth('100%');
      const transitionTimer = setTimeout(() => {
        setTimerWidth('0%');
      }, 50);

      timerStartRef.current = Date.now();
      timerTimeoutRef.current = setTimeout(() => {
        setTimerWidth('0%');
        dispatch({ type: 'TIME_UP' });
        setTimeout(() => {
          dispatch({ type: 'NEXT_QUESTION' });
        }, 2000);
      }, QUESTION_TIME_MS);

      return () => {
        clearTimeout(transitionTimer);
        if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
      };
    }
    return undefined;
  }, [state.phase, state.currentQuestionIndex, state.selectedOptionIndex, state.questions]);

  // Submit score to Firestore when game ends + play completion SFX
  useEffect(() => {
    if (state.phase !== 'results' || state.questions.length === 0) return undefined;
    sfxLevelComplete();
    const student = loadStudent();
    const studentId = getOrCreateStudentId();
    const nickname = student?.nickname || '無名英雄';
    const avatar = student?.avatar ?? 1;
    submitScore({
      studentId,
      nickname,
      avatar,
      score: state.score,
      category: state.category,
      difficulty: state.difficulty,
      correctCount: state.correctCount,
      totalQuestions: state.questions.length,
    }).catch(() => {
      // Firebase not configured or network error — silent fallback
    });
    return undefined;
  }, [state.phase]); // Only trigger when phase changes to 'results'

  const handleAnswer = (index: number) => {
    if (state.selectedOptionIndex !== null) return;
    
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    const timeElapsed = Date.now() - timerStartRef.current;
    const timeLeft = Math.max(0, QUESTION_TIME_MS - timeElapsed);
    
    const percentage = (timeLeft / QUESTION_TIME_MS) * 100;
    setTimerWidth(`${percentage}%`);

    const q = state.questions[state.currentQuestionIndex];
    const isCorrect = index === q.correctIndex;
    if (isCorrect) sfxCorrect(); else sfxWrong();

    // Always speak the English word to reinforce pronunciation regardless of direction
    speakWord(q.options[index].english);

    const scoreGain = isCorrect ? calcScore(timeLeft, QUESTION_TIME_MS, state.combo) : 0;
    
    dispatch({ type: 'ANSWER', payload: { selectedIndex: index, isCorrect, scoreGain } });

    setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' });
    }, 1500);
  };

  // P0-D: 計算各分類可用單字數
  const categoryWordCount = (cat: string) =>
    cat === '全部' ? allWords.length : allWords.filter(w => w.category === cat).length;

  const selectedWordCount = categoryWordCount(state.category);
  // 四選一題型最少需要 4 個單字
  const canStart = !loading && !wordError && selectedWordCount >= 4;

  const renderSelect = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 w-full max-w-4xl bg-card/95 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] border-4 border-white/40 shadow-2xl p-5 sm:p-8 md:p-14 text-center mt-4 sm:mt-8 mx-3 sm:mx-4"
    >
      <UserExpBar />

      {/* 返回按鈕 */}
      <Link href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 text-muted-foreground hover:text-foreground transition-colors bg-muted p-3 sm:p-4 rounded-full shadow-sm hover:scale-105 active:scale-95">
        <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8" />
      </Link>

      {/* 靜音按鈕 */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted-foreground hover:text-foreground transition-colors bg-muted p-3 sm:p-4 rounded-full shadow-sm hover:scale-105 active:scale-95"
        aria-label={muted ? '開啟音效' : '關閉音效'}
      >
        {muted ? <VolumeX className="w-6 h-6 sm:w-8 sm:h-8" /> : <Volume2 className="w-6 h-6 sm:w-8 sm:h-8" />}
      </button>

      <div className="flex justify-center mb-4 sm:mb-6 mt-4">
        <div className="bg-primary/10 p-4 sm:p-6 rounded-full text-primary">
          <Trophy className="w-14 h-14 sm:w-20 sm:h-20" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-primary mb-5 sm:mb-10 tracking-widest drop-shadow-sm">
        單字大挑戰
      </h1>

      {/* P0-C：Firestore 連線失敗提示 */}
      {wordError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold">
          <WifiOff className="w-5 h-5 shrink-0" />
          <span>無法連線到單字庫，請確認網路連線後重新整理</span>
          <button onClick={() => window.location.reload()} className="ml-auto flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
            <RefreshCw className="w-4 h-4" /> 重試
          </button>
        </div>
      )}

      {/* P0-C：單字庫完全空白提示 */}
      {!loading && !wordError && allWords.length === 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-bold">
          <span>目前單字庫沒有單字，請管理員至後台新增單字後再試</span>
        </div>
      )}

      {/* 步驟 1：選擇主題 */}
      <div className="mb-5 sm:mb-10 text-left">
        <h2 className="text-lg sm:text-2xl font-black text-foreground mb-3 sm:mb-5 flex items-center gap-2 sm:gap-3">
          <span className="bg-secondary text-white w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-sm sm:text-lg shrink-0">1</span>
          選擇主題
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {categories.map(cat => {
            const count = categoryWordCount(cat);
            const tooFew = count < 4;
            return (
              <button
                key={cat}
                data-testid={`category-btn-${cat}`}
                onClick={() => {
                  dispatch({ type: 'SET_CATEGORY', payload: cat });
                  scrollToNext(difficultyRef);
                }}
                className={`p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl font-black text-sm sm:text-xl border-4 transition-all flex flex-col items-center gap-0.5 ${state.category === cat ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-xl -translate-y-1' : 'bg-card text-foreground border-border hover:bg-muted shadow-[0_4px_0_rgba(0,0,0,0.1)] hover:-translate-y-0.5'}`}
              >
                <span>{cat}</span>
                {/* P0-D：顯示該分類單字數 */}
                <span className={`text-[10px] sm:text-xs font-bold opacity-70 ${tooFew && state.category === cat ? 'text-destructive opacity-100' : ''}`}>
                  {count} 字
                </span>
              </button>
            );
          })}
        </div>
        {/* P0-D：選中的分類不足 4 字時提示 */}
        {!loading && !wordError && selectedWordCount < 4 && selectedWordCount > 0 && (
          <p className="mt-3 text-sm text-destructive font-bold flex items-center gap-2">
            ＊此主題只有 {selectedWordCount} 個單字，至少需要 4 個才能開始遊戲
          </p>
        )}
      </div>

      {/* 步驟 2：選擇難度 */}
      <div ref={difficultyRef} className="mb-5 sm:mb-10 text-left scroll-mt-8">
        <h2 className="text-lg sm:text-2xl font-black text-foreground mb-3 sm:mb-5 flex items-center gap-2 sm:gap-3">
          <span className="bg-secondary text-white w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-sm sm:text-lg shrink-0">2</span>
          選擇難度
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(['easy', 'normal', 'hard'] as const).map(diff => (
            <button
              key={diff}
              data-testid={`difficulty-${diff}`}
              onClick={() => {
                dispatch({ type: 'SET_DIFFICULTY', payload: diff });
                scrollToNext(startBtnRef);
              }}
              className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl font-black text-sm sm:text-xl border-4 transition-all flex flex-col items-center justify-center gap-1 ${state.difficulty === diff ? 'bg-secondary text-secondary-foreground border-secondary scale-105 shadow-xl -translate-y-1' : 'bg-card text-foreground border-border hover:bg-muted shadow-[0_4px_0_rgba(0,0,0,0.1)] hover:-translate-y-0.5'}`}
            >
              <span>{DIFFICULTY_LABELS[diff]}</span>
              <span className="text-xs sm:text-sm opacity-80 font-bold">{DIFFICULTY_COUNTS[diff]} 題</span>
            </button>
          ))}
        </div>
      </div>

      {/* 開始遊戲按鈕 */}
      <button
        ref={startBtnRef}
        data-testid="start-game"
        disabled={!canStart}
        onClick={() => dispatch({ type: 'START_COUNTDOWN' })}
        className="w-full py-5 sm:py-7 bg-green-500 hover:bg-green-600 active:scale-95 active:translate-y-1 text-white rounded-[2rem] sm:rounded-[3rem] text-2xl sm:text-4xl font-black shadow-[0_8px_0_rgba(21,128,61,1)] sm:shadow-[0_10px_0_rgba(21,128,61,1)] transition-all flex items-center justify-center gap-4 sm:gap-6 group hover:-translate-y-1 hover:shadow-[0_12px_0_rgba(21,128,61,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
            載入單字庫…
          </>
        ) : wordError ? (
          <>
            <WifiOff className="w-8 h-8 sm:w-10 sm:h-10" />
            連線失敗
          </>
        ) : !canStart && allWords.length > 0 ? (
          <>單字不足，無法開始</>
        ) : (
          <>
            開始遊戲！
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white group-hover:scale-125 transition-transform" />
          </>
        )}
      </button>
    </motion.div>
  );

  const renderCountdown = () => (
    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[12rem] md:text-[18rem] font-black text-white drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)] tracking-tighter"
        >
          {countdown === 0 ? '開始！' : countdown}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const renderQuestion = () => {
    const q = state.questions[state.currentQuestionIndex];
    if (!q) return null;

    return (
      <div className="relative z-10 w-full max-w-6xl flex flex-col h-[100dvh] pt-3 pb-3 px-3 sm:pt-5 sm:pb-5 sm:px-4 md:px-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-3 sm:mb-5 bg-card/95 backdrop-blur-md rounded-full p-2 pl-4 sm:pl-8 pr-2 sm:pr-4 shadow-lg border-2 sm:border-4 border-white/20">
          <div className="text-sm sm:text-2xl font-black text-muted-foreground tracking-wider whitespace-nowrap">
            {state.currentQuestionIndex + 1} / {state.questions.length} 題
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <AnimatePresence>
              {state.combo >= 2 && (
                <motion.div
                  initial={{ scale: 0, x: 20 }}
                  animate={{ scale: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="bg-orange-500 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full font-black text-sm sm:text-xl shadow-lg border-2 border-orange-300 whitespace-nowrap"
                >
                  x{state.combo >= 4 ? '2.0' : '1.5'} 連擊！
                </motion.div>
              )}
            </AnimatePresence>
            <div className="bg-primary text-primary-foreground px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xl sm:text-3xl font-black shadow-inner border-2 border-primary-foreground/20 whitespace-nowrap">
              {state.score} 分
            </div>
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors bg-white/15 hover:bg-white/25 p-2 sm:p-2.5 rounded-full"
              aria-label={muted ? '開啟音效' : '關閉音效'}
            >
              {muted
                ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Word Display */}
        <div className="flex-1 flex flex-col items-center justify-center mb-6 relative">
          {/* Direction badge */}
          <div className={`mb-2 sm:mb-3 px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-black tracking-widest shadow-sm border-2 ${q.direction === 'en_to_zh' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
            {q.direction === 'en_to_zh' ? '看英文，選中文' : '看中文，選英文'}
          </div>

          <div className="text-center bg-card rounded-[1.5rem] sm:rounded-[3rem] shadow-2xl border-4 sm:border-8 border-white w-full py-5 sm:py-14 md:py-24 relative overflow-hidden flex flex-col items-center justify-center min-h-[100px] sm:min-h-[180px]">
            <AnimatePresence mode="wait">
              <motion.h2
                key={q.word.id + q.direction}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="font-black text-foreground drop-shadow-sm px-3 break-words w-full"
                style={{ fontSize: 'clamp(1.8rem, 13vw, 9rem)', letterSpacing: '0.02em' }}
              >
                {q.direction === 'en_to_zh' ? q.word.english : q.word.chinese}
              </motion.h2>
            </AnimatePresence>

            <AnimatePresence>
              {state.selectedOptionIndex !== null && state.selectedOptionIndex === q.correctIndex && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-1 right-2 sm:top-1/4 sm:right-1/4 md:right-32 text-3xl sm:text-6xl md:text-8xl font-black text-green-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)] rotate-12"
                >
                  +{state.lastScoreGain}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Timer bar */}
          <div className="w-full h-3 sm:h-5 bg-card/40 backdrop-blur-sm rounded-full mt-3 sm:mt-5 overflow-hidden shadow-inner border-2 sm:border-4 border-white/30 p-0.5">
            <div
              className={`h-full rounded-full ${state.selectedOptionIndex !== null ? (state.selectedOptionIndex === q.correctIndex ? 'bg-green-400' : 'bg-red-400') : 'bg-primary'}`}
              style={{
                width: timerWidth,
                transitionDuration: state.selectedOptionIndex !== null ? '0ms' : `${QUESTION_TIME_MS}ms`,
                transitionTimingFunction: 'linear',
              }}
            />
          </div>
        </div>

        {/* Answers Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-5 w-full shrink-0">
          {q.options.map((opt, i) => {
            const isSelected = state.selectedOptionIndex === i;
            const isCorrectAnswer = i === q.correctIndex;
            const isCorrect = state.selectedOptionIndex !== null && isCorrectAnswer;
            const isWrong = state.selectedOptionIndex !== null && isSelected && !isCorrectAnswer;
            const disabled = state.selectedOptionIndex !== null;
            // en_to_zh: prompt is English, answers are Chinese
            // zh_to_en: prompt is Chinese, answers are English
            const optionLabel = q.direction === 'en_to_zh' ? opt.chinese : opt.english;

            return (
              <AnswerButton
                key={opt.id}
                label={optionLabel}
                slotIndex={i}
                isSelected={isSelected}
                isCorrect={isCorrect}
                isWrong={isWrong}
                disabled={disabled}
                onClick={() => handleAnswer(i)}
                testId={`answer-btn-${i}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const stars = getStarRating(state.correctCount, state.questions.length);
    const messages = {
      1: '繼續加油！',
      2: '表現不錯！',
      3: '太棒了！'
    };

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-3xl bg-card rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white p-12 md:p-16 text-center mx-4"
      >
        {stars === 3 && <Confetti />}
        
        <h1 className="text-6xl font-black text-foreground mb-12 tracking-widest">本關結算！</h1>
        
        <div className="flex justify-center gap-6 mb-12">
          {[1, 2, 3].map((star) => (
            <motion.div
              key={star}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: star * 0.3, type: 'spring', damping: 12 }}
            >
              <Star 
                className={`w-32 h-32 md:w-40 md:h-40 ${star <= stars ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_10px_10px_rgba(250,204,21,0.4)]' : 'text-muted stroke-[3px] fill-transparent'}`}
              />
            </motion.div>
          ))}
        </div>

        <div className="space-y-6 mb-16 bg-muted/60 p-10 rounded-[3rem] border-4 border-white/50">
          <div className="text-4xl font-bold text-foreground">
            總分：<span className="text-primary font-black text-6xl mx-2">{state.score}</span> 分
          </div>
          <div className="text-2xl font-bold text-muted-foreground mt-4">
            答對 {state.correctCount} / {state.questions.length} 題
          </div>
          <div className="text-5xl font-black text-secondary mt-8 drop-shadow-sm">
            {messages[stars]}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            data-testid="btn-replay"
            onClick={() => dispatch({ type: 'RESTART' })}
            className="flex-1 py-6 bg-primary hover:bg-primary/90 text-white rounded-[2rem] text-3xl font-black shadow-[0_8px_0_rgba(147,51,234,1)] active:translate-y-2 active:shadow-none transition-all"
          >
            再玩一次
          </button>
          <button
            data-testid="btn-change-topic"
            onClick={() => dispatch({ type: 'CHANGE_TOPIC' })}
            className="flex-1 py-6 bg-card border-4 border-border hover:bg-muted text-foreground rounded-[2rem] text-3xl font-black shadow-[0_8px_0_rgba(0,0,0,0.1)] active:translate-y-2 active:shadow-none transition-all"
          >
            換個主題
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center relative bg-background ${
      state.phase === 'question' || state.phase === 'countdown'
        ? 'justify-center overflow-hidden'
        : 'justify-start md:justify-center overflow-y-auto py-4 sm:py-6 md:py-0'
    }`}>
      <style>{`
        @keyframes bg-pan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div 
        className="absolute inset-0 bg-[linear-gradient(-45deg,#3b82f6,#8b5cf6,#ec4899,#f43f5e,#eab308)] bg-[length:400%_400%] opacity-15 pointer-events-none"
        style={{ animation: 'bg-pan 20s ease-in-out infinite' }}
      />
      
      {state.phase === 'select' && renderSelect()}
      {state.phase === 'countdown' && renderCountdown()}
      {state.phase === 'question' && renderQuestion()}
      {state.phase === 'results' && renderResults()}
    </div>
  );
}
