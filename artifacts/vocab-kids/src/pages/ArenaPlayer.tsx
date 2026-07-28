import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Gamepad2, Loader2, Sparkles, Trophy, XCircle } from 'lucide-react';
import { Link } from 'wouter';
import { joinArenaRoom, subscribeArenaRoom, subscribeArenaServerTimeOffset, submitArenaAnswer, type ArenaRoom } from '@/lib/realtimeArena';
import { getArenaTimeState } from '@/lib/arenaScoring';
import { sfxCorrect, sfxWrong, startBGM, stopBGM } from '@/lib/soundEngine';
import { speakText, speakWord } from '@/lib/tts';
import { loadStudent } from '@/hooks/useStudent';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/components/student/NicknameSetup';

const PLAYER_SESSION_KEY = 'word-wiz-arena-player';

interface SavedArenaPlayer {
  pin: string;
  playerId: string;
}

function loadSavedSession(): SavedArenaPlayer | null {
  try {
    const raw = sessionStorage.getItem(PLAYER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedArenaPlayer;
    return /^\d{4}$/.test(parsed.pin) && parsed.playerId ? parsed : null;
  } catch {
    return null;
  }
}

export default function ArenaPlayer() {
  const savedSession = useMemo(loadSavedSession, []);
  const { muted } = useSoundSettings();
  const [pin, setPin] = useState(savedSession?.pin ?? '');
  const [hero] = useState(() => loadStudent());
  const [joined, setJoined] = useState(Boolean(savedSession));
  const [playerId, setPlayerId] = useState<string | null>(savedSession?.playerId ?? null);
  const [room, setRoom] = useState<ArenaRoom | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (joined && !muted) startBGM('arena');
    return () => stopBGM();
  }, [joined, muted]);

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin) || !hero?.nickname) {
      setError('請輸入 4 位數 PIN，並先完成英雄暱稱設定');
      return;
    }
    setJoining(true);
    setError('');
    try {
      const id = await joinArenaRoom(pin, hero.nickname, hero.avatar);
      sessionStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({ pin, playerId: id }));
      setPlayerId(id);
      setJoined(true);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : '無法加入對戰');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!joined || !pin) return;
    const unsubscribe = subscribeArenaRoom(
      pin,
      (nextRoom) => {
        if (!nextRoom) {
          sessionStorage.removeItem(PLAYER_SESSION_KEY);
          setJoined(false);
          setPlayerId(null);
          setRoom(null);
          setError('找不到這個房間，請向老師確認 PIN');
          return;
        }
        setRoom(nextRoom);
      },
      () => setError('與對戰房間的連線中斷，正在等待重新連線'),
    );
    return unsubscribe;
  }, [joined, pin]);

  useEffect(() => {
    setSelectedOption(null);
    setPendingIndex(null);
    setAnswerResult(null);
    setPointsAwarded(0);
    setError('');
  }, [room?.currentQuestionIndex, room?.status]);

  useEffect(() => {
    if (!joined) return;
    return subscribeArenaServerTimeOffset(setServerTimeOffsetMs);
  }, [joined]);

  useEffect(() => {
    if (room?.status !== 'question') return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [room?.status, room?.currentQuestionIndex]);

  const currentQuestion = room?.questions[room.currentQuestionIndex];
  const currentPlayer = playerId ? room?.players?.[playerId] : undefined;
  const sortedPlayers = Object.values(room?.players ?? {}).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
  const rank = playerId ? sortedPlayers.findIndex((player) => player.id === playerId) + 1 : 0;
  const timeState = room?.status === 'question'
    ? getArenaTimeState(room.questionStartedAt, room.questionDurationMs, now + serverTimeOffsetMs)
    : { remainingMs: 0, remainingSeconds: 0, progressPercent: 0 };

  const handleAnswer = async (optionIndex: number) => {
    if (!room || selectedOption !== null || !playerId) return;
    setSelectedOption(optionIndex);
    setPendingIndex(null);
    setError('');
    const option = room.questions[room.currentQuestionIndex]?.options[optionIndex];
    if (option) void speakWord(option.english);
    try {
      const result = await submitArenaAnswer(pin, playerId, optionIndex);
      setAnswerResult(result.isCorrect);
      setPointsAwarded(result.pointsAwarded);
      if (result.isCorrect) sfxCorrect();
      else sfxWrong();
    } catch (answerError) {
      setSelectedOption(null);
      setError(answerError instanceof Error ? answerError.message : '答案送出失敗，請再試一次');
    }
  };

  const handleOptionClick = (optionIndex: number) => {
    if (!room || selectedOption !== null || timeState.remainingMs <= 0) return;
    const question = room.questions[room.currentQuestionIndex];
    const option = question?.options[optionIndex];
    if (!question || !option) return;

    const optionLabel = question.direction === 'en_to_zh' ? option.chinese : option.english;
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isDesktop) {
      setPendingIndex(null);
      void handleAnswer(optionIndex);
      return;
    }

    if (pendingIndex !== optionIndex) {
      setPendingIndex(optionIndex);
      void speakText(optionLabel);
      return;
    }

    void handleAnswer(optionIndex);
  };

  const handleOptionHover = (optionIndex: number) => {
    if (!room || selectedOption !== null || timeState.remainingMs <= 0) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const question = room.questions[room.currentQuestionIndex];
    const option = question?.options[optionIndex];
    if (!question || !option) return;
    void speakText(question.direction === 'en_to_zh' ? option.chinese : option.english);
  };

  if (!joined) {
    return (
      <div className="min-h-[100dvh] pt-24 pb-16 px-4 bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-7 sm:p-8 text-center shadow-xl">
          <div className="mb-6 flex items-center justify-between"><Link href="/" className="rounded-xl bg-muted p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Link><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">學生加入</span></div>
          <Gamepad2 className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-2xl font-black text-foreground">加入全班對戰</h1>
          <p className="mb-6 text-sm text-muted-foreground">輸入老師畫面上的 4 位數 PIN。</p>
          <form onSubmit={handleJoin} className="space-y-4">
            <div><label className="mb-1 block text-left text-xs font-bold text-muted-foreground">房間 PIN</label><input inputMode="numeric" autoComplete="one-time-code" placeholder="例如：1234" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-center font-mono text-3xl font-black tracking-[0.3em] outline-none focus:border-primary" /></div>
            {hero && <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-left"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${AVATAR_COLORS[Math.max(0, Math.min(hero.avatar - 1, 7))]}`}>{AVATAR_EMOJIS[Math.max(0, Math.min(hero.avatar - 1, 7))]}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-muted-foreground">你的英雄</p><p className="truncate text-lg font-black text-foreground">{hero.nickname}</p></div><Link href="/leaderboard" className="text-xs font-bold text-primary hover:underline">更換</Link></div>}
            {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p>}
            <button type="submit" disabled={joining || pin.length !== 4} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-black text-white shadow-lg transition active:scale-95 disabled:opacity-40">{joining ? <><Loader2 className="h-5 w-5 animate-spin" /> 連線中…</> : '🚀 加入對戰'}</button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!room) {
    return <div className="min-h-[100dvh] pt-24 flex flex-col items-center justify-center bg-background"><Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" /><p className="font-bold text-foreground">連線老師的對戰房間…</p>{error && <p className="mt-3 text-sm font-bold text-destructive">{error}</p>}</div>;
  }

  return (
    <div className="min-h-[100dvh] pt-20 pb-16 px-4 bg-background flex flex-col items-center justify-center">
      {room.status === 'waiting' && <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-lg"><Sparkles className="mx-auto mb-3 h-10 w-10 animate-bounce text-primary" /><h2 className="mb-2 text-xl font-bold text-foreground">已成功加入！</h2><p className="mb-5 text-sm text-muted-foreground">等待老師開始對戰…</p><div className="rounded-2xl bg-primary/5 p-4"><p className="text-3xl">{AVATAR_EMOJIS[Math.max(0, Math.min((currentPlayer?.avatar ?? 1) - 1, 7))]}</p><p className="font-black text-foreground">{currentPlayer?.nickname}</p><p className="mt-1 text-xs font-bold text-primary">房間 {pin} · {Object.keys(room.players ?? {}).length} 人</p></div></div>}

      {room.status === 'question' && currentQuestion && (
        <div className="w-full max-w-md text-center">
          <div className="mb-3 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground"><span>第 {room.currentQuestionIndex + 1} / {room.questions.length} 題</span><span>{currentPlayer?.score ?? 0} 分</span></div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="剩餘作答時間" aria-valuemin={0} aria-valuemax={room.questionDurationMs} aria-valuenow={Math.round(timeState.remainingMs)} data-testid="arena-time-progress">
                <motion.div
                  className={`h-full rounded-full ${timeState.progressPercent > 60 ? 'bg-emerald-500' : timeState.progressPercent > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  animate={{ width: `${timeState.progressPercent}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </div>
              <span className={`min-w-12 rounded-xl px-2 py-1 text-lg font-black text-white ${timeState.remainingSeconds <= 5 ? 'animate-pulse bg-rose-500' : 'bg-primary'}`} data-testid="arena-time-seconds">{timeState.remainingSeconds}s</span>
            </div>
            <h3 className="text-3xl font-black text-primary">{currentQuestion.direction === 'en_to_zh' ? currentQuestion.word.english : currentQuestion.word.chinese}</h3>
            <p className="mt-2 text-xs font-bold text-muted-foreground">答得越快，速度加成越高！</p>
          </div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">
            <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:inline">🔊 滑鼠移到選項即可聽發音</span>
            <span className="[@media(hover:hover)_and_(pointer:fine)]:hidden">🔊 點一下聽發音，再按一次確認答案</span>
          </p>
          <div className="grid grid-cols-2 gap-3">{currentQuestion.options.map((option, index) => { const selected = selectedOption === index; const pending = pendingIndex === index; return <button key={option.id} onClick={() => handleOptionClick(index)} onMouseEnter={() => handleOptionHover(index)} disabled={selectedOption !== null || timeState.remainingMs <= 0} data-testid={`arena-answer-${index}`} className={`relative flex min-h-28 flex-col items-center justify-center rounded-2xl p-3 text-white shadow-xl transition active:scale-95 disabled:cursor-default disabled:opacity-70 ${['bg-rose-500','bg-blue-500','bg-amber-500','bg-emerald-500'][index]} ${selected ? 'ring-4 ring-white scale-[1.03]' : ''} ${pending ? 'z-10 scale-[1.04] animate-pulse ring-4 ring-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.85)]' : ''}`}><span className="mb-1 text-3xl font-black">{['▲','◆','●','■'][index]}</span><span className="break-words text-lg font-black leading-tight">{currentQuestion.direction === 'en_to_zh' ? option.chinese : option.english}</span>{pending && <span className="absolute -top-3 right-2 rounded-full border border-yellow-400 bg-yellow-300 px-2.5 py-1 text-[10px] font-black text-black shadow-md">🔊 再按一次確認！</span>}{selected && answerResult !== null && <span className="absolute right-2 top-2">{answerResult ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}</span>}</button>; })}</div>
          {timeState.remainingMs <= 0 && selectedOption === null && <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm font-black text-rose-600">時間到！等待本題排名…</p>}
          {selectedOption !== null && answerResult === null && <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> 送出答案中…</p>}
          {answerResult !== null && <p className={`mt-4 text-lg font-black ${answerResult ? 'text-emerald-600' : 'text-rose-600'}`}>{answerResult ? `✅ 答對了！獲得 ${pointsAwarded} 分（含速度加成）` : '❌ 再接再厲！'}</p>}
          {error && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p>}
        </div>
      )}

      {room.status === 'leaderboard' && <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-lg"><Trophy className="mx-auto mb-3 h-12 w-12 text-amber-500" /><h2 className="mb-1 text-xl font-black text-foreground">本題排名</h2><p className="mb-5 text-sm font-bold text-primary">你目前第 {rank || '-'} 名 · {currentPlayer?.score ?? 0} 分</p><div className="space-y-2">{sortedPlayers.slice(0, 5).map((player, index) => <div key={player.id} className={`flex items-center justify-between rounded-xl p-3 text-sm font-bold ${player.id === playerId ? 'border-2 border-primary bg-primary/10' : 'bg-muted'}`}><span>第 {index + 1} 名 · {player.nickname}</span><span>{player.score} 分</span></div>)}</div><p className="mt-5 text-sm text-muted-foreground">等待老師進入下一題…</p></div>}

      {room.status === 'finished' && <div className="w-full max-w-sm rounded-3xl border-4 border-amber-400 bg-card p-7 text-center shadow-xl"><Trophy className="mx-auto mb-3 h-16 w-16 animate-bounce text-amber-500" /><h2 className="mb-2 text-2xl font-black text-foreground">對戰完成！</h2><div className="mb-6 rounded-2xl bg-primary/10 p-5"><p className="text-sm font-bold text-muted-foreground">你的最終排名</p><p className="my-1 text-4xl font-black text-primary">第 {rank || '-'} 名</p><p className="text-lg font-black text-foreground">{currentPlayer?.score ?? 0} 分</p></div><div className="mb-6 space-y-2">{sortedPlayers.slice(0, 3).map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-xl bg-amber-500/10 p-3 text-sm font-bold"><span>{['🥇','🥈','🥉'][index]} {player.nickname}</span><span>{player.score} 分</span></div>)}</div><Link href="/" onClick={() => sessionStorage.removeItem(PLAYER_SESSION_KEY)} className="block rounded-2xl bg-primary py-3.5 font-black text-white">回到首頁</Link></div>}
    </div>
  );
}
