import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Users, Play, Trophy, ArrowLeft, ArrowRight, Sparkles, CheckCircle2, QrCode } from 'lucide-react';
import { Link } from 'wouter';
import { createArenaRoom, subscribeArenaRoom, updateArenaStatus, type ArenaRoom } from '@/lib/realtimeArena';
import { AVATAR_COLORS, AVATAR_INITIALS } from '@/components/student/NicknameSetup';
import { AudioButton } from '@/components/ui/AudioButton';
import { sfxLevelComplete } from '@/lib/soundEngine';

export default function ArenaHost() {
  const [pin, setPin] = useState<string | null>(null);
  const [room, setRoom] = useState<ArenaRoom | null>(null);
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    createArenaRoom('全部').then((newPin) => {
      setPin(newPin);
    });
  }, []);

  useEffect(() => {
    if (!pin) return;
    const unsub = subscribeArenaRoom(pin, (updatedRoom) => {
      setRoom(updatedRoom);
    });
    return () => unsub();
  }, [pin]);

  // Countdown timer during question phase
  useEffect(() => {
    if (!room || room.status !== 'question') return;

    setTimer(15);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          updateArenaStatus(pin!, 'leaderboard');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.status, room?.currentQuestionIndex]);

  if (!pin || !room) {
    return (
      <div className="min-h-[100dvh] pt-24 pb-16 flex flex-col items-center justify-center bg-background">
        <Sparkles className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="font-bold text-foreground">正在建立連線對戰房間...</p>
      </div>
    );
  }

  const players = Object.values(room.players || {});
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentQ = room.questions[room.currentQuestionIndex];

  const handleNext = () => {
    if (room.currentQuestionIndex + 1 < room.questions.length) {
      updateArenaStatus(pin, 'question', room.currentQuestionIndex + 1);
    } else {
      sfxLevelComplete();
      updateArenaStatus(pin, 'finished');
    }
  };

  return (
    <div className="min-h-[100dvh] pt-20 pb-16 px-4 bg-background flex flex-col items-center justify-center">
      {/* Waiting Phase */}
      {room.status === 'waiting' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl bg-card border-4 border-primary/30 rounded-3xl p-8 shadow-2xl text-center">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="p-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" /> 全班 Kahoot 即時對戰大廳
            </span>
          </div>

          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">請學生在手機/平板輸入對戰 PIN 碼</p>
          <div className="inline-block px-10 py-6 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-6xl tracking-widest shadow-xl mb-6">
            {pin}
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-bold mb-8">
            <Users className="w-4 h-4 text-emerald-500" /> 已入場學生：{players.length} 人
          </div>

          {/* Joined Players Wall */}
          <div className="bg-muted/50 border border-border rounded-2xl p-6 min-h-[160px] flex flex-wrap gap-3 items-center justify-center mb-8">
            {players.length === 0 ? (
              <p className="text-muted-foreground text-sm font-bold">等待學生輸入 PIN 碼入場中...</p>
            ) : (
              players.map((p) => {
                const avatarIdx = Math.max(0, Math.min((p.avatar || 1) - 1, 7));
                return (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={p.id} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border shadow-sm">
                    <div className={`w-7 h-7 ${AVATAR_COLORS[avatarIdx]} rounded-full flex items-center justify-center text-white text-xs font-black`}>
                      {AVATAR_INITIALS[avatarIdx]}
                    </div>
                    <span className="font-bold text-sm text-foreground">{p.nickname}</span>
                  </motion.div>
                );
              })
            )}
          </div>

          <button
            onClick={() => updateArenaStatus(pin, 'question', 0)}
            disabled={players.length === 0}
            className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-lg shadow-lg disabled:opacity-50 transition-all cursor-pointer"
          >
            🚀 開始 Kahoot 即時對戰 ({players.length} 人)
          </button>
        </motion.div>
      )}

      {/* Question Phase */}
      {room.status === 'question' && currentQ && (
        <div className="w-full max-w-4xl bg-card border-4 border-primary/30 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-muted-foreground">題目 {room.currentQuestionIndex + 1} / {room.questions.length}</span>
            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white font-black text-2xl flex items-center justify-center shadow-lg animate-pulse">
              {timer}s
            </div>
          </div>

          <div className="py-8 bg-muted/40 rounded-3xl border border-border mb-8">
            <h2 className="text-4xl font-black text-primary mb-3">{currentQ.english}</h2>
            {currentQ.phonetic && <p className="text-lg font-mono text-muted-foreground mb-4">{currentQ.phonetic}</p>}
            <AudioButton text={currentQ.english} size="lg" />
          </div>

          {/* Option Answer Color Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-rose-500 text-white font-black text-xl shadow-md flex items-center justify-center">🔴 {currentQ.options[0]?.chinese}</div>
            <div className="p-6 rounded-2xl bg-blue-500 text-white font-black text-xl shadow-md flex items-center justify-center">🔵 {currentQ.options[1]?.chinese}</div>
            <div className="p-6 rounded-2xl bg-amber-500 text-white font-black text-xl shadow-md flex items-center justify-center">🟡 {currentQ.options[2]?.chinese}</div>
            <div className="p-6 rounded-2xl bg-emerald-500 text-white font-black text-xl shadow-md flex items-center justify-center">🟢 {currentQ.options[3]?.chinese}</div>
          </div>
        </div>
      )}

      {/* Leaderboard Phase */}
      {room.status === 'leaderboard' && (
        <div className="w-full max-w-2xl bg-card border-4 border-primary/30 rounded-3xl p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-black text-foreground mb-6 flex items-center justify-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            即時對戰排行榜 (第 {room.currentQuestionIndex + 1} 題)
          </h2>

          <div className="space-y-3 mb-8">
            {sortedPlayers.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border font-bold">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-foreground">{p.nickname}</span>
                </div>
                <span className="text-primary font-black text-lg">{p.score} 分</span>
              </div>
            ))}
          </div>

          <button onClick={handleNext} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg flex items-center justify-center gap-2">
            下一題 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Finished Phase */}
      {room.status === 'finished' && (
        <div className="w-full max-w-2xl bg-card border-4 border-amber-400 rounded-3xl p-8 shadow-2xl text-center">
          <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-black text-foreground mb-2">對戰大賽圓滿結束！</h2>
          <p className="text-muted-foreground text-sm mb-8">恭喜冠軍與所有勇敢參賽的英文小英雄！</p>

          <div className="space-y-3 mb-8">
            {sortedPlayers.slice(0, 3).map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 font-black">
                <span className="text-amber-600 text-lg">第 {idx + 1} 名：{p.nickname}</span>
                <span className="text-primary text-xl">{p.score} 分</span>
              </div>
            ))}
          </div>

          <Link href="/" className="inline-block px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg">
            返回首頁
          </Link>
        </div>
      )}
    </div>
  );
}
