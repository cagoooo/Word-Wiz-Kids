import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Check, X, RefreshCw, BookOpen, BrainCircuit, Loader2, WifiOff } from 'lucide-react';
import { startBGM, stopBGM, sfxCorrect, sfxWrong, sfxCardFlip } from '@/lib/soundEngine';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { Word } from '@/data/words';
import { speakWord, isTTSSupported } from '@/lib/tts';
import { WordCard } from '@/components/learn/WordCard';
import { Button } from '@/components/ui/button';
import { PhoneticHighlight } from '@/components/learn/PhoneticHighlight';
import { useWordLibrary } from '@/hooks/useWordLibrary';
import { UserExpBar } from '@/components/gamification/UserExpBar';
import { AudioButton } from '@/components/ui/AudioButton';
import { recordWordLearned } from '@/lib/gamification';

export default function Learn() {
  const { words: allWords, categories, loading, error: wordError } = useWordLibrary();
  const { muted, toggleMute } = useSoundSettings();

  // BGM lifecycle — play while on this page, stop on unmount or mute
  useEffect(() => {
    if (!muted) startBGM('learn');
    return () => stopBGM();
  }, [muted]);

  const [mode, setMode] = useState<"browse" | "review">("browse");
  const [category, setCategory] = useState<string>("全部");
  const cardsRef = useRef<HTMLDivElement>(null);

  function scrollToCards() {
    setTimeout(() => {
      cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  // Browse state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // Review state
  const [reviewState, setReviewState] = useState<"question" | "answer" | "summary">("question");
  const [reviewWords, setReviewWords] = useState<Word[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  // Direction per card: 'zh_to_en' = show Chinese → guess English; 'en_to_zh' = show English → guess Chinese
  const [reviewDirections, setReviewDirections] = useState<Array<'zh_to_en' | 'en_to_zh'>>([]);

  const browseWords = category === "全部"
    ? allWords
    : allWords.filter(w => w.category === category);

  const currentBrowseWord = browseWords[currentIndex];

  const startReview = () => {
    const words = category === "全部"
      ? allWords
      : allWords.filter(w => w.category === category);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    // Randomly assign direction for each card
    const directions = shuffled.map((): 'zh_to_en' | 'en_to_zh' =>
      Math.random() < 0.5 ? 'zh_to_en' : 'en_to_zh'
    );
    setReviewWords(shuffled);
    setReviewDirections(directions);
    setReviewIndex(0);
    setKnownCount(0);
    setReviewState("question");
  };

  // P0-E: Restore last learning progress from localStorage on first load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('learn-progress');
      if (saved) {
        const { index, category: savedCat } = JSON.parse(saved);
        if (savedCat) setCategory(savedCat);
        if (typeof index === 'number' && index >= 0) setCurrentIndex(index);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset index when category changes (skip on first render - handled above)
  const categoryChangedRef = { current: false };
  useEffect(() => {
    if (!categoryChangedRef.current) { categoryChangedRef.current = true; return; }
    setCurrentIndex(0);
    setIsFlipped(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Start review when mode switches to review
  useEffect(() => {
    if (mode === 'review') {
      startReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Track seen words and auto-speak in browse mode
  useEffect(() => {
    if (!(mode === 'browse' && currentBrowseWord)) return;
    setSeenIds(prev => new Set(prev).add(currentBrowseWord.id));
    recordWordLearned(currentBrowseWord.id);
    const timer = setTimeout(() => {
      speakWord(currentBrowseWord.english);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentIndex, currentBrowseWord, mode]);

  const handlePrev = () => {
    sfxCardFlip();
    setIsFlipped(false);
    const newIdx = currentIndex === 0 ? browseWords.length - 1 : currentIndex - 1;
    setCurrentIndex(newIdx);
    localStorage.setItem('learn-progress', JSON.stringify({ index: newIdx, category }));
  };

  const handleNext = () => {
    sfxCardFlip();
    setIsFlipped(false);
    const newIdx = currentIndex === browseWords.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIdx);
    localStorage.setItem('learn-progress', JSON.stringify({ index: newIdx, category }));
  };

  const handleNextReview = (known: boolean) => {
    if (known) {
      sfxCorrect();
      setKnownCount(prev => prev + 1);
      const reviewedWord = reviewWords[reviewIndex];
      if (reviewedWord) recordWordLearned(reviewedWord.id);
    }
    else sfxWrong();
    if (reviewIndex === reviewWords.length - 1) {
      setReviewState('summary');
    } else {
      setReviewIndex(prev => prev + 1);
      setReviewState('question');
    }
  };

  const renderBrowse = () => {
    if (!currentBrowseWord) return null;
    return (
      <div className="w-full flex flex-col items-center mt-4">
        <div className="w-full flex items-center justify-between max-w-md mb-6 px-4">
          <span className="text-sm font-bold text-muted-foreground bg-muted px-4 py-1.5 rounded-full shadow-sm">
            已學習 {seenIds.size} 個
          </span>
          <span className="text-sm font-bold text-muted-foreground">
            第 {currentIndex + 1} / {browseWords.length} 個單字
          </span>
        </div>

        <div className="relative w-full flex items-center justify-center gap-4 md:gap-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            className="hidden md:flex shrink-0 w-14 h-14 rounded-full"
            data-testid="button-prev"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>

          <div className="w-full max-w-md shrink-0 flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBrowseWord.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center"
              >
                <WordCard
                  word={currentBrowseWord}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  onSpeak={() => speakWord(currentBrowseWord.english)}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="hidden md:flex shrink-0 w-14 h-14 rounded-full"
            data-testid="button-next"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>

        <div className="flex md:hidden gap-6 mt-8">
          <Button variant="outline" size="icon" onClick={handlePrev} className="rounded-full w-14 h-14 shadow-sm" data-testid="button-prev-mobile">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext} className="rounded-full w-14 h-14 shadow-sm" data-testid="button-next-mobile">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  };

  const renderReview = () => {
    if (reviewWords.length === 0) return null;

    if (reviewState === 'summary') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-12"
          data-testid="review-summary"
        >
          <div className="w-32 h-32 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-inner">
            <Check className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4 tracking-wider">
            本次複習完成！
          </h2>
          <p className="text-lg text-muted-foreground font-medium mb-12">
            認識了 <span className="text-2xl text-primary font-bold mx-2">{knownCount} / {reviewWords.length}</span> 個單字
          </p>
          <Button
            onClick={startReview}
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-bold w-full shadow-md"
            data-testid="button-restart-review"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            再複習一次
          </Button>
        </motion.div>
      );
    }

    const word = reviewWords[reviewIndex];
    const direction = reviewDirections[reviewIndex] ?? 'zh_to_en';
    const progress = Math.round((reviewIndex / reviewWords.length) * 100);

    // What the user sees as the prompt vs. the revealed answer
    const promptText    = direction === 'zh_to_en' ? word.chinese  : word.english;
    const promptHint    = direction === 'zh_to_en' ? '這個單字的英文是什麼呢？' : '這個單字的中文是什麼呢？';
    const answerHeading = direction === 'zh_to_en' ? word.english  : word.chinese;
    const directionBadge = direction === 'zh_to_en'
      ? { label: '中 → 英', bg: 'bg-rose-100 text-rose-700' }
      : { label: '英 → 中', bg: 'bg-blue-100 text-blue-700' };

    return (
      <div className="flex-1 flex flex-col items-center w-full max-w-md mx-auto mt-4">
        <div className="w-full mb-8 space-y-2 px-4">
          <div className="flex justify-between text-sm font-bold text-muted-foreground">
            <span>複習進度</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={word.id + reviewState + direction}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {reviewState === 'question' ? (
                <div
                  className="w-full aspect-[3/4] bg-card rounded-[2rem] shadow-xl border-2 border-border flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
                  data-testid="review-question"
                >
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <span className="px-4 py-1.5 bg-muted text-muted-foreground rounded-full font-bold text-sm tracking-widest">
                      {word.category}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full font-black text-sm ${directionBadge.bg}`}>
                      {directionBadge.label}
                    </span>
                  </div>
                  <h2 className="text-6xl font-black text-foreground tracking-wider mb-8">
                    {promptText}
                  </h2>
                  <p className="text-lg text-muted-foreground font-medium mb-12">
                    {promptHint}
                  </p>
                  <Button
                    size="lg"
                    onClick={() => {
                      sfxCardFlip();
                      setReviewState('answer');
                      speakWord(word.english);
                    }}
                    className="rounded-full px-12 py-8 text-2xl font-bold absolute bottom-12 w-[80%] shadow-lg"
                    data-testid="button-reveal"
                  >
                    看答案
                  </Button>
                </div>
              ) : (
                <div
                  className="w-full aspect-[3/4] bg-card rounded-[2rem] shadow-xl border-2 border-border flex flex-col items-center justify-center p-8 relative"
                  data-testid="review-answer"
                >
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full text-center">
                    {/* Always show both Chinese and English in the answer */}
                    <div className="text-4xl font-black text-muted-foreground">{word.chinese}</div>
                    <div className="flex flex-col items-center gap-3">
                      <PhoneticHighlight word={word} />
                      <p className="text-2xl text-muted-foreground font-mono tracking-wider">{word.phonetic}</p>
                    </div>
                    <div className="text-3xl font-black text-foreground">{answerHeading}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-14 h-14 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-500"
                      onClick={() => speakWord(word.english)}
                      data-testid="button-speak-review"
                    >
                      <Volume2 className="w-8 h-8" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full absolute bottom-8 px-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleNextReview(false)}
                      className="rounded-full py-8 text-lg font-bold border-rose-200 text-rose-500 hover:bg-rose-50 shadow-sm"
                      data-testid="button-unknown"
                    >
                      <X className="w-6 h-6 mr-2" />
                      再看一次
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => handleNextReview(true)}
                      className="rounded-full py-8 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
                      data-testid="button-known"
                    >
                      <Check className="w-6 h-6 mr-2" />
                      知道了
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] pt-24 pb-16 px-4 bg-background flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <UserExpBar />
      </div>

      {/* Main Header & Mode Selector */}
      <div className="w-full max-w-2xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-primary tracking-wider mb-2">單字學習</h1>
          <p className="text-muted-foreground font-medium tracking-wide">
            每天進步一點點，成為英文小英雄！
          </p>
        </div>

        {/* Mute toggle + Mode toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors hover:scale-105 active:scale-95"
            aria-label={muted ? '開啟音效' : '關閉音效'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        <div className="flex bg-muted p-1.5 rounded-full">
          <button
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all ${mode === 'browse' ? 'bg-card shadow-sm text-primary scale-105' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setMode('browse'); scrollToCards(); }}
            data-testid="tab-browse"
          >
            <BookOpen className="w-5 h-5" />
            瀏覽模式
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all ${mode === 'review' ? 'bg-card shadow-sm text-primary scale-105' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setMode('review'); scrollToCards(); }}
            data-testid="tab-review"
          >
            <BrainCircuit className="w-5 h-5" />
            開始學習
          </button>
        </div>
        </div>{/* end flex items-center gap-3 */}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); scrollToCards(); }}
            className={`px-5 py-2.5 rounded-xl font-bold tracking-widest transition-all ${category === cat ? 'bg-primary text-primary-foreground shadow-md scale-105' : 'bg-card text-muted-foreground hover:bg-muted border border-border'}`}
            data-testid={`category-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* TTS notice */}
      {!isTTSSupported() && (
        <div className="bg-amber-50 text-amber-600 text-sm font-medium py-3 px-6 rounded-xl mb-6 text-center max-w-md mx-auto border border-amber-200">
          您的瀏覽器似乎不支援語音功能，無法自動播放發音。
        </div>
      )}

      {/* Word cards area — scroll target */}
      <div ref={cardsRef}>
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-bold tracking-wide">載入單字庫中…</p>
          </div>
        ) : wordError ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-destructive" />
            </div>
            <p className="font-bold text-foreground text-lg">無法連線到單字庫</p>
            <p className="text-muted-foreground text-sm max-w-xs">請確認網路連線是否正常，或稍後再試</p>
            <button onClick={() => window.location.reload()} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all">
              重新整理
            </button>
          </div>
        ) : allWords.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground text-lg">單字庫目前沒有單字</p>
            <p className="text-muted-foreground text-sm max-w-xs">請管理員至後台新增單字，孩子才能開始學習</p>
          </div>
        ) : (
          mode === 'browse' ? renderBrowse() : renderReview()
        )}
      </div>
    </div>
  );
}
