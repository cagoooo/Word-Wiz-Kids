import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Gamepad2, Loader2, Sparkles, Trophy, Users, WifiOff } from 'lucide-react';
import { Link } from 'wouter';
import {
  createArenaRoom,
  ARENA_HOST_SESSION_KEY,
  getArenaErrorMessage,
  subscribeArenaServerTimeOffset,
  startArenaQuestion,
  subscribeArenaRoom,
  updateArenaStatus,
  type ArenaRoom,
} from '@/lib/realtimeArena';
import { AVATAR_EMOJIS } from '@/components/student/NicknameSetup';
import { AudioButton } from '@/components/ui/AudioButton';
import { sfxLevelComplete, startBGM, stopBGM } from '@/lib/soundEngine';
import { useWordLibrary } from '@/hooks/useWordLibrary';
import { useSoundSettings } from '@/hooks/useSoundSettings';

export default function ArenaHost() {
  const { words, categories, loading, error: wordError } = useWordLibrary();
  const { muted } = useSoundSettings();
  const [category, setCategory] = useState('全部');
  const [questionCount, setQuestionCount] = useState(5);
  const [pin, setPin] = useState<string | null>(() => sessionStorage.getItem(ARENA_HOST_SESSION_KEY));
  const [room, setRoom] = useState<ArenaRoom | null>(null);
  const [timer, setTimer] = useState(15);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const timerTransitionedRef = useRef(false);

  useEffect(() => {
    if (pin && !muted) startBGM('arena');
    return () => stopBGM();
  }, [pin, muted]);

  const categoryWords = useMemo(
    () => category === '全部' ? words : words.filter((word) => word.category === category),
    [category, words],
  );
  const canCreate = categoryWords.length >= 4 && !loading && !creating;

  useEffect(() => {
    if (!pin) return;
    return subscribeArenaServerTimeOffset(setServerTimeOffsetMs);
  }, [pin]);

  useEffect(() => {
    if (!pin) return;
    const unsubscribe = subscribeArenaRoom(
      pin,
      (updatedRoom) => {
        if (!updatedRoom) {
          sessionStorage.removeItem(ARENA_HOST_SESSION_KEY);
          setPin(null);
          setRoom(null);
          setError('原本的對戰房間已不存在，請重新建立');
          return;
        }
        setRoom(updatedRoom);
      },
      () => setError('無法連線即時對戰服務，請檢查網路後重試'),
    );
    return unsubscribe;
  }, [pin]);

  const players = Object.values(room?.players ?? {});
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
  const currentQuestion = room?.questions[room.currentQuestionIndex];
  const answeredCount = room
    ? players.filter((player) => player.answerQuestionIndex === room.currentQuestionIndex).length
    : 0;

  useEffect(() => {
    if (!pin || !room || room.status !== 'question') return;
    timerTransitionedRef.current = false;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((room.questionStartedAt + room.questionDurationMs - (Date.now() + serverTimeOffsetMs)) / 1000),
      );
      setTimer(remaining);
      if (remaining === 0 && !timerTransitionedRef.current) {
        timerTransitionedRef.current = true;
        void updateArenaStatus(pin, 'leaderboard').catch(() => {
          timerTransitionedRef.current = false;
          setError('無法結束本題，請再試一次');
        });
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [pin, room?.status, room?.currentQuestionIndex, room?.questionStartedAt, room?.questionDurationMs, serverTimeOffsetMs]);

  useEffect(() => {
    if (
      !pin
      || !room
      || room.status !== 'question'
      || players.length === 0
      || answeredCount < players.length
      || timerTransitionedRef.current
    ) return;

    timerTransitionedRef.current = true;
    void updateArenaStatus(pin, 'leaderboard').catch(() => {
      timerTransitionedRef.current = false;
      setError('全班都已作答，但無法結束本題，請再試一次');
    });
  }, [pin, room?.status, room?.currentQuestionIndex, answeredCount, players.length]);

  const handleCreateRoom = async () => {
    setCreating(true);
    setError('');
    try {
      const newPin = await createArenaRoom(category, words, questionCount);
      sessionStorage.setItem(ARENA_HOST_SESSION_KEY, newPin);
      setPin(newPin);
    } catch (createError) {
      setError(getArenaErrorMessage(createError, '建立房間失敗'));
    } finally {
      setCreating(false);
    }
  };

  const handleNext = async () => {
    if (!room || !pin) return;
    setError('');
    try {
      if (room.currentQuestionIndex + 1 < room.questions.length) {
        await startArenaQuestion(pin, room.currentQuestionIndex + 1);
      } else {
        sfxLevelComplete();
        await updateArenaStatus(pin, 'finished');
      }
    } catch {
      setError('無法切換題目，請檢查網路後重試');
    }
  };

  if (!pin) {
    return (
      <div className="min-h-[100dvh] pt-24 pb-16 px-4 bg-background flex items-center justify-center">
        <div className="w-full max-w-2xl rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="rounded-xl bg-muted p-2.5 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Link>
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-black text-primary">老師控制台</span>
          </div>
          <Gamepad2 className="mx-auto mb-3 h-14 w-14 text-primary" />
          <h1 className="mb-2 text-center text-3xl font-black text-foreground">建立全班對戰</h1>
          <p className="mb-8 text-center text-sm font-medium text-muted-foreground">選好題庫後產生 PIN，學生就能用手機加入同一場即時競賽。</p>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12 font-bold text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /> 載入單字庫…</div>
          ) : wordError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive"><WifiOff className="mx-auto mb-2 h-8 w-8" /><p className="font-bold">無法讀取單字庫，請重新整理後再試</p></div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-black text-foreground">1. 選擇主題</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <button key={item} onClick={() => setCategory(item)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${category === item ? 'bg-primary text-white shadow-md' : 'border border-border bg-muted text-muted-foreground'}`}>{item}</button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold text-muted-foreground">可用單字：{categoryWords.length} 個</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-foreground">2. 選擇題數</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((count) => (
                    <button key={count} onClick={() => setQuestionCount(count)} disabled={categoryWords.length < count} className={`rounded-xl py-3 font-black transition disabled:opacity-40 ${questionCount === count ? 'bg-emerald-500 text-white shadow-md' : 'border border-border bg-muted text-muted-foreground'}`}>{count} 題</button>
                  ))}
                </div>
              </div>
              {categoryWords.length > 0 && categoryWords.length < 4 && <p className="rounded-xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-700">這個主題至少需要 4 個單字才能產生四個選項。</p>}
              {error && <p className="rounded-xl bg-destructive/10 p-3 text-center text-sm font-bold text-destructive">{error}</p>}
              <button onClick={handleCreateRoom} disabled={!canCreate} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-4 text-xl font-black text-white shadow-lg disabled:opacity-40">
                {creating ? <><Loader2 className="h-5 w-5 animate-spin" /> 建立房間中…</> : <><Sparkles className="h-5 w-5" /> 產生對戰 PIN</>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!room) {
    return <div className="min-h-[100dvh] pt-24 flex flex-col items-center justify-center bg-background"><Sparkles className="mb-3 h-10 w-10 animate-spin text-primary" /><p className="font-bold text-foreground">連線對戰房間中…</p></div>;
  }

  return (
    <div className="min-h-[100dvh] pt-20 pb-16 px-4 bg-background flex flex-col items-center justify-center">
      {error && <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white shadow-lg">{error}</div>}

      {room.status === 'waiting' && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl rounded-3xl border-4 border-primary/30 bg-card p-6 sm:p-8 text-center shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><Link href="/" className="rounded-2xl bg-muted p-2.5 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Link><span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-black text-primary"><Gamepad2 className="h-4 w-4" /> 全班即時對戰</span></div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">請學生進入「全班對戰」並輸入 PIN</p>
          <div className="mb-4 inline-block rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 px-8 py-5 text-5xl sm:text-6xl font-black tracking-[0.18em] text-white shadow-xl">{pin}</div>
          <div className="mb-6 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground"><Users className="h-4 w-4 text-emerald-500" /> 已加入 {players.length} 人 · {room.questions.length} 題</div>
          <div className="mb-7 flex min-h-[150px] flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-muted/50 p-5">
            {players.length === 0 ? <p className="text-sm font-bold text-muted-foreground">等待學生輸入 PIN 加入…</p> : players.map((player) => <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={player.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm"><span className="text-2xl">{AVATAR_EMOJIS[Math.max(0, Math.min(player.avatar - 1, 7))]}</span><span className="font-bold text-foreground">{player.nickname}</span></motion.div>)}
          </div>
          <button onClick={() => startArenaQuestion(pin, 0).catch(() => setError('無法開始對戰，請檢查網路'))} disabled={players.length === 0} className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-lg font-black text-white shadow-lg disabled:opacity-40">▶ 開始對戰（{players.length} 人）</button>
        </motion.div>
      )}

      {room.status === 'question' && currentQuestion && (
        <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border-4 border-primary/30 bg-card p-5 sm:p-8 text-center shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><span className="font-bold text-muted-foreground">第 {room.currentQuestionIndex + 1} / {room.questions.length} 題</span><span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary">已作答 {answeredCount} / {players.length}</span><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-2xl font-black text-white shadow-lg">{timer}s</div></div>
          <div className="mb-6 rounded-3xl border border-border bg-muted/40 py-7"><p className="mb-2 text-xs font-black tracking-widest text-muted-foreground">{currentQuestion.direction === 'en_to_zh' ? '看英文，選中文' : '看中文，選英文'}</p><h2 className="mb-3 text-4xl sm:text-5xl font-black text-primary">{currentQuestion.direction === 'en_to_zh' ? currentQuestion.word.english : currentQuestion.word.chinese}</h2>{currentQuestion.word.phonetic && currentQuestion.direction === 'en_to_zh' && <p className="mb-3 font-mono text-muted-foreground">{currentQuestion.word.phonetic}</p>}<AudioButton text={currentQuestion.word.english} size="lg" /></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">{currentQuestion.options.map((option, index) => <div key={option.id} className={`flex min-h-24 items-center justify-center rounded-2xl p-4 text-xl sm:text-2xl font-black text-white shadow-md ${['bg-rose-500','bg-blue-500','bg-amber-500','bg-emerald-500'][index]}`}>{['▲','◆','●','■'][index]}<span className="ml-3">{currentQuestion.direction === 'en_to_zh' ? option.chinese : option.english}</span></div>)}</div>
        </div>
      )}

      {room.status === 'leaderboard' && (
        <div className="w-full max-w-2xl rounded-3xl border-4 border-primary/30 bg-card p-6 sm:p-8 text-center shadow-2xl"><h2 className="mb-6 flex items-center justify-center gap-2 text-2xl font-black text-foreground"><Trophy className="h-7 w-7 text-amber-500" /> 第 {room.currentQuestionIndex + 1} 題排名</h2><div className="mb-7 space-y-3">{sortedPlayers.map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 p-4 font-bold"><div className="flex items-center gap-3"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-muted-foreground'}`}>{index + 1}</span><span>{player.nickname}</span>{player.answerQuestionIndex === room.currentQuestionIndex && <span>{player.isCorrect ? '✅' : '❌'}</span>}</div><span className="text-lg font-black text-primary">{player.score} 分</span></div>)}</div><button onClick={handleNext} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg">{room.currentQuestionIndex + 1 < room.questions.length ? '下一題' : '查看最終排名'} <ArrowRight className="h-5 w-5" /></button></div>
      )}

      {room.status === 'finished' && (
        <div className="w-full max-w-2xl rounded-3xl border-4 border-amber-400 bg-card p-6 sm:p-8 text-center shadow-2xl"><Trophy className="mx-auto mb-4 h-20 w-20 animate-bounce text-amber-500" /><h2 className="mb-2 text-3xl font-black text-foreground">全班對戰完成！</h2><p className="mb-7 text-sm text-muted-foreground">恭喜所有完成挑戰的單字英雄！</p><div className="mb-8 space-y-3">{sortedPlayers.slice(0, 5).map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 font-black"><span className="text-lg text-amber-700">第 {index + 1} 名 · {player.nickname}</span><span className="text-xl text-primary">{player.score} 分</span></div>)}</div><div className="grid grid-cols-2 gap-3"><Link href="/" className="rounded-2xl bg-muted px-4 py-3.5 font-bold text-foreground">回到首頁</Link><button onClick={() => { sessionStorage.removeItem(ARENA_HOST_SESSION_KEY); setPin(null); setRoom(null); }} className="rounded-2xl bg-primary px-4 py-3.5 font-bold text-white">建立新對戰</button></div></div>
      )}
    </div>
  );
}
