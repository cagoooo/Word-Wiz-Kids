import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronLeft, ChevronRight, Check, X, RefreshCw, BookOpen, BrainCircuit, Loader2 } from 'lucide-react';
import { Word } from '@/data/words';
import { speakWord, isTTSSupported } from '@/lib/tts';
import { WordCard } from '@/components/learn/WordCard';
import { Button } from '@/components/ui/button';
import { PhoneticHighlight } from '@/components/learn/PhoneticHighlight';
import { useWordLibrary } from '@/hooks/useWordLibrary';

export default function Learn() {
  const { words: allWords, categories, loading } = useWordLibrary();

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

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
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
    const timer = setTimeout(() => {
      speakWord(currentBrowseWord.english);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentIndex, currentBrowseWord, mode]);

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev === 0 ? browseWords.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev === browseWords.length - 1 ? 0 : prev + 1));
  };

  const handleNextReview = (known: boolean) => {
    if (known) setKnownCount(prev => prev + 1);
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
      <div className="flex-1 flex flex-col items-center w-full mt-4">
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

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBrowseWord.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <WordCard
                  word={currentBrowseWord}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  onSpeak={() => speakWord(currentBrowseWord.english)}
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
    <div className="min-h-[100dvh] pt-24 pb-20 px-4 flex flex-col max-w-5xl mx-auto bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-primary tracking-wider mb-2">單字學習</h1>
          <p className="text-muted-foreground font-medium tracking-wide">
            每天進步一點點，成為英文小英雄！
          </p>
        </div>

        {/* Mode toggle */}
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
        ) : (
          mode === 'browse' ? renderBrowse() : renderReview()
        )}
      </div>
    </div>
  );
}
