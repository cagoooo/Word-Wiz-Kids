/**
 * Leaderboard page — real-time top-10 + personal progress dashboard.
 * Falls back gracefully when Firebase is not configured.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, Flame, Target, Gamepad2, AlertCircle } from 'lucide-react';
import { useLeaderboard, useStudentProgress } from '@/hooks/useLeaderboard';
import { useStudent, getOrCreateStudentId } from '@/hooks/useStudent';
import { NicknameSetup, AVATAR_COLORS, AVATAR_INITIALS } from '@/components/student/NicknameSetup';
import { isFirebaseConfigured } from '@/lib/firebase';

function AvatarBadge({ avatar, nickname, size = 'md' }: { avatar: number; nickname: string; size?: 'sm' | 'md' | 'lg' }) {
  const idx = Math.max(0, Math.min(avatar - 1, 7));
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-base' : size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-14 h-14 text-xl';
  return (
    <div className={`${sizeClass} ${AVATAR_COLORS[idx]} rounded-full flex items-center justify-center font-black text-white shadow-sm flex-shrink-0`}>
      {AVATAR_INITIALS[idx]}
    </div>
  );
}

export default function Leaderboard() {
  const { entries, loading } = useLeaderboard();
  const { student, setStudent } = useStudent();
  const [studentId] = useState(() => getOrCreateStudentId());
  const { progress } = useStudentProgress(student?.id ?? null);
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);

  // Show nickname setup if student has no nickname
  useEffect(() => {
    const loaded = student;
    if (!loaded || !loaded.nickname) {
      setShowNicknameSetup(true);
    }
  }, []);  // only on mount

  const myRank = entries.findIndex((e) => e.studentId === student?.id) + 1;

  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative overflow-hidden bg-background">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <NicknameSetup
        open={showNicknameSetup}
        studentId={studentId}
        onSave={(s) => {
          setStudent(s);
          setShowNicknameSetup(false);
        }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="inline-block p-4 bg-accent/20 rounded-full mb-4"
          >
            <Trophy className="w-12 h-12 text-yellow-500" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">單字英雄榜</h1>
          <p className="text-xl text-foreground/70">最勇敢的單字小英雄就在這裡！</p>
        </div>

        {/* Firebase offline notice */}
        {!isFirebaseConfigured && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">離線模式</p>
              <p className="text-sm mt-0.5">
                Firebase 尚未設定，排行榜顯示的是範例資料。設定 <code className="bg-amber-100 px-1 rounded">VITE_FIREBASE_*</code> 環境變數後即可啟用即時排行榜。
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden">
              <div className="p-5 bg-primary/5 border-b border-border flex justify-between items-center font-bold text-sm text-foreground/70 uppercase tracking-wide">
                <div className="w-14 text-center">排名</div>
                <div className="flex-1 px-4">英雄</div>
                <div className="w-28 text-right">總分</div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-muted-foreground">載入中...</div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {(isFirebaseConfigured ? entries : DEMO_ENTRIES).map((entry, index) => (
                    <motion.div
                      key={entry.studentId}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.06 }}
                      className={`flex items-center p-4 border-b border-border last:border-0 transition-colors ${
                        entry.studentId === student?.id ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : 'hover:bg-muted/40'
                      }`}
                      data-testid={`leaderboard-row-${index}`}
                    >
                      <div className="w-14 flex justify-center items-center">
                        {entry.rank === 1 && <Medal className="w-8 h-8 text-yellow-500" />}
                        {entry.rank === 2 && <Medal className="w-8 h-8 text-gray-400" />}
                        {entry.rank === 3 && <Medal className="w-8 h-8 text-amber-600" />}
                        {entry.rank > 3 && (
                          <span className="text-xl font-bold text-foreground/40">#{entry.rank}</span>
                        )}
                      </div>

                      <div className="flex-1 px-4 flex items-center gap-3 min-w-0">
                        <AvatarBadge avatar={entry.avatar} nickname={entry.nickname} size="sm" />
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{entry.nickname}</p>
                          <p className="text-xs text-muted-foreground">{entry.gamesPlayed} 場遊戲</p>
                        </div>
                        {entry.studentId === student?.id && (
                          <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">我</span>
                        )}
                      </div>

                      <div className="w-28 flex justify-end items-center gap-1">
                        <span className="text-xl font-black text-foreground">{entry.totalScore.toLocaleString()}</span>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {!loading && isFirebaseConfigured && entries.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">還沒有人上榜</p>
                  <p className="text-sm mt-1">先去玩遊戲，成為第一名英雄！</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal progress sidebar */}
          <div className="space-y-4">
            {/* My profile card */}
            {student?.nickname ? (
              <div className="bg-card rounded-3xl border-2 border-border shadow-xl p-6">
                <div className="flex items-center gap-4 mb-5">
                  <AvatarBadge avatar={student.avatar} nickname={student.nickname} size="lg" />
                  <div>
                    <p className="text-xl font-black text-foreground">{student.nickname}</p>
                    {myRank > 0 && isFirebaseConfigured && (
                      <p className="text-sm text-primary font-bold">第 {myRank} 名</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <StatRow icon={<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />} label="總分" value={(progress?.totalScore ?? 0).toLocaleString()} />
                  <StatRow icon={<Gamepad2 className="w-4 h-4 text-primary" />} label="遊戲場次" value={String(progress?.gamesPlayed ?? 0)} />
                  <StatRow
                    icon={<Target className="w-4 h-4 text-green-500" />}
                    label="答題正確率"
                    value={
                      progress && progress.questionsTotal > 0
                        ? `${Math.round((progress.correctTotal / progress.questionsTotal) * 100)}%`
                        : '—'
                    }
                  />
                </div>

                <button
                  onClick={() => setShowNicknameSetup(true)}
                  className="mt-5 w-full py-2 text-sm font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors"
                  data-testid="btn-change-nickname"
                >
                  更改暱稱
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-3xl border-2 border-dashed border-border p-6 text-center">
                <Flame className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-bold text-muted-foreground">還沒有英雄檔案</p>
                <button
                  onClick={() => setShowNicknameSetup(true)}
                  className="mt-3 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                  data-testid="btn-create-profile"
                >
                  建立檔案
                </button>
              </div>
            )}

            {/* Progress stats */}
            {progress && (
              <div className="bg-card rounded-3xl border-2 border-border shadow-xl p-6">
                <h3 className="font-black text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  學習成就
                </h3>
                <div className="space-y-3">
                  <ProgressBar
                    label="整體正確率"
                    value={progress.questionsTotal > 0 ? Math.round((progress.correctTotal / progress.questionsTotal) * 100) : 0}
                    color="bg-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}

// Demo data shown when Firebase is not configured
const DEMO_ENTRIES = [
  { studentId: 'demo1', nickname: '小明', avatar: 1, totalScore: 2540, gamesPlayed: 8, rank: 1 },
  { studentId: 'demo2', nickname: '小美', avatar: 3, totalScore: 2120, gamesPlayed: 6, rank: 2 },
  { studentId: 'demo3', nickname: '阿豪', avatar: 7, totalScore: 1890, gamesPlayed: 5, rank: 3 },
  { studentId: 'demo4', nickname: '小芸', avatar: 4, totalScore: 1450, gamesPlayed: 4, rank: 4 },
  { studentId: 'demo5', nickname: '小傑', avatar: 5, totalScore: 1200, gamesPlayed: 3, rank: 5 },
];
