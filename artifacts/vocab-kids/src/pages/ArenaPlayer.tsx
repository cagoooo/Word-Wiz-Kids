import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft, CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { joinArenaRoom, subscribeArenaRoom, submitArenaAnswer, type ArenaRoom } from '@/lib/realtimeArena';
import { sfxCorrect, sfxWrong } from '@/lib/soundEngine';

export default function ArenaPlayer() {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<ArenaRoom | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [err, setErr] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || !nickname.trim()) {
      setErr('請輸入 PIN 碼與暱稱！');
      return;
    }

    try {
      const pid = await joinArenaRoom(pin.trim(), nickname.trim());
      setPlayerId(pid);
      setJoined(true);
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '加入失敗');
    }
  };

  useEffect(() => {
    if (!joined || !pin) return;
    const unsub = subscribeArenaRoom(pin, (r) => {
      setRoom(r);
    });
    return () => unsub();
  }, [joined, pin]);

  // Reset selected option when question index changes
  useEffect(() => {
    setSelectedOpt(null);
  }, [room?.currentQuestionIndex, room?.status]);

  const handleAnswer = (optIdx: number) => {
    if (!room || selectedOpt !== null || !playerId) return;
    setSelectedOpt(optIdx);

    const currentQ = room.questions[room.currentQuestionIndex];
    const isCorrect = optIdx === currentQ.correctIndex;

    if (isCorrect) sfxCorrect(); else sfxWrong();

    submitArenaAnswer(pin, playerId, optIdx, isCorrect, isCorrect ? 100 : 0);
  };

  if (!joined) {
    return (
      <div className="min-h-[100dvh] pt-24 pb-16 px-4 bg-background flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-xl text-center">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="p-2 rounded-xl bg-muted text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">對戰搶答端</span>
          </div>

          <Gamepad2 className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-black text-foreground mb-6">加入 Kahoot 即時搶答</h1>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-left text-xs font-bold text-muted-foreground mb-1">對戰 PIN 碼 (4 位數)</label>
              <input
                type="text"
                placeholder="例如: 1234"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-muted text-center font-mono text-2xl font-bold tracking-widest focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-left text-xs font-bold text-muted-foreground mb-1">您的遊戲暱稱</label>
              <input
                type="text"
                placeholder="輸入你的名字"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-muted text-center text-lg font-bold focus:outline-none focus:border-primary"
              />
            </div>

            {err && <p className="text-destructive text-xs font-bold">{err}</p>}

            <button type="submit" className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all">
              ⚡ 入場對戰
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const currentQ = room?.questions[room?.currentQuestionIndex || 0];

  return (
    <div className="min-h-[100dvh] pt-20 pb-16 px-4 bg-background flex flex-col items-center justify-center">
      {/* Waiting state */}
      {room?.status === 'waiting' && (
        <div className="text-center p-8 bg-card border border-border rounded-3xl max-w-sm w-full">
          <Sparkles className="w-10 h-10 animate-bounce text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">已成功進入房間！</h2>
          <p className="text-sm text-muted-foreground">等待老師按下【開始對戰】...</p>
        </div>
      )}

      {/* Question answering buttons state */}
      {room?.status === 'question' && currentQ && (
        <div className="w-full max-w-md text-center">
          <div className="mb-6 p-4 rounded-2xl bg-card border border-border shadow-sm">
            <p className="text-xs text-muted-foreground font-bold mb-1">題目 {room.currentQuestionIndex + 1}</p>
            <h3 className="text-3xl font-black text-primary">{currentQ.english}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAnswer(0)} disabled={selectedOpt !== null} className={`p-8 rounded-3xl font-black text-2xl shadow-xl transition-transform active:scale-95 text-white bg-rose-500 ${selectedOpt === 0 ? 'ring-4 ring-white scale-105' : ''}`}>🔴</button>
            <button onClick={() => handleAnswer(1)} disabled={selectedOpt !== null} className={`p-8 rounded-3xl font-black text-2xl shadow-xl transition-transform active:scale-95 text-white bg-blue-500 ${selectedOpt === 1 ? 'ring-4 ring-white scale-105' : ''}`}>🔵</button>
            <button onClick={() => handleAnswer(2)} disabled={selectedOpt !== null} className={`p-8 rounded-3xl font-black text-2xl shadow-xl transition-transform active:scale-95 text-white bg-amber-500 ${selectedOpt === 2 ? 'ring-4 ring-white scale-105' : ''}`}>🟡</button>
            <button onClick={() => handleAnswer(3)} disabled={selectedOpt !== null} className={`p-8 rounded-3xl font-black text-2xl shadow-xl transition-transform active:scale-95 text-white bg-emerald-500 ${selectedOpt === 3 ? 'ring-4 ring-white scale-105' : ''}`}>🟢</button>
          </div>
        </div>
      )}

      {/* Leaderboard or finished */}
      {(room?.status === 'leaderboard' || room?.status === 'finished') && (
        <div className="text-center p-8 bg-card border border-border rounded-3xl max-w-sm w-full">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-1">請觀看大螢幕即時排名！</h2>
          <p className="text-sm text-muted-foreground">加油！下一題馬上開始！</p>
        </div>
      )}
    </div>
  );
}
