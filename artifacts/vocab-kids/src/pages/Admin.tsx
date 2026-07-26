/**
 * Admin page — PIN-protected parent/teacher dashboard.
 * After PIN verification shows student progress report.
 * All text in Traditional Chinese. No emojis.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, KeyRound, ArrowRight, BarChart3, Users, Star, Target, Gamepad2, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getAllStudentProgress, type StudentProgress } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { AVATAR_COLORS, AVATAR_INITIALS } from '@/components/student/NicknameSetup';

const ADMIN_PIN = '0000';

// ── PIN pad ───────────────────────────────────────────────────────────────────

function PinPad({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumber = (n: number) => {
    if (pin.length < 4) setPin((p) => p + n);
  };
  const handleClear = () => { setPin(''); setError(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-muted rounded-full mb-4">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">家長專區</h1>
        <p className="text-muted-foreground mt-2">請輸入 PIN 碼進入管理設定</p>
      </div>

      <form onSubmit={handleSubmit} className={`bg-card p-8 rounded-3xl border-2 shadow-xl transition-colors ${error ? 'border-destructive' : 'border-border'}`}>
        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-2">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              animate={error ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.3 }}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
                index < pin.length ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted'
              }`}
              data-testid={`pin-dot-${index}`}
            >
              {index < pin.length ? '*' : ''}
            </motion.div>
          ))}
        </div>

        {error && (
          <p className="text-center text-destructive text-sm font-bold mb-4">PIN 碼錯誤，請再試一次</p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-4 mb-4 mt-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumber(num)}
              className="h-16 rounded-2xl bg-muted hover:bg-muted/80 text-2xl font-bold text-foreground transition-transform active:scale-95"
              data-testid={`pin-pad-${num}`}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold transition-transform active:scale-95"
            data-testid="pin-pad-clear"
          >
            清除
          </button>
          <button
            type="button"
            onClick={() => handleNumber(0)}
            className="h-16 rounded-2xl bg-muted hover:bg-muted/80 text-2xl font-bold text-foreground transition-transform active:scale-95"
            data-testid="pin-pad-0"
          >
            0
          </button>
          <button
            type="submit"
            disabled={pin.length < 4}
            className="h-16 rounded-2xl bg-primary text-primary-foreground font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
            data-testid="pin-pad-submit"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <KeyRound className="w-4 h-4" />
          預設 PIN 碼為 0000
        </div>
      </form>
    </motion.div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

function Dashboard({ onLock }: { onLock: () => void }) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllStudentProgress();
      setStudents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalGames = students.reduce((s, p) => s + (p.gamesPlayed ?? 0), 0);
  const totalScore = students.reduce((s, p) => s + (p.totalScore ?? 0), 0);
  const avgAccuracy =
    students.length > 0
      ? Math.round(
          students.reduce(
            (s, p) => s + (p.questionsTotal > 0 ? (p.correctTotal / p.questionsTotal) * 100 : 0),
            0,
          ) / students.length,
        )
      : 0;

  const chartData = students.slice(0, 10).map((p) => ({
    name: p.nickname,
    遊戲場次: p.gamesPlayed ?? 0,
    總分: Math.round((p.totalScore ?? 0) / 100),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            學生進度報告
          </h1>
          <p className="text-muted-foreground mt-1">追蹤所有小英雄的學習狀況</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold transition-colors"
            data-testid="btn-refresh"
          >
            <RefreshCw className="w-4 h-4" />
            重新整理
          </button>
          <button
            onClick={onLock}
            className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl font-bold transition-colors"
            data-testid="btn-lock"
          >
            鎖定
          </button>
        </div>
      </div>

      {!isFirebaseConfigured && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">Firebase 離線模式</p>
            <p className="text-sm mt-0.5">
              設定 <code className="bg-amber-100 px-1 rounded">VITE_FIREBASE_*</code> 環境變數後，即可查看所有學生的真實進度資料。
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard icon={<Users className="w-6 h-6 text-blue-500" />} label="學生人數" value={String(students.length)} />
        <SummaryCard icon={<Gamepad2 className="w-6 h-6 text-purple-500" />} label="總遊戲場次" value={String(totalGames)} />
        <SummaryCard icon={<Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />} label="總累積分數" value={totalScore.toLocaleString()} />
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">載入中...</div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-3xl border-2 border-dashed border-border">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-bold text-muted-foreground">
            {isFirebaseConfigured ? '還沒有學生資料' : '（離線模式 — 無範例資料）'}
          </p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          {chartData.length > 0 && (
            <div className="bg-card rounded-3xl border-2 border-border shadow-xl p-6 mb-6">
              <h2 className="font-black text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                遊戲場次比較（前 10 名）
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === '總分' ? [`${value * 100} 分`, '總分'] : [value, name]
                    }
                  />
                  <Bar dataKey="遊戲場次" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Student table */}
          <div className="bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden">
            <div className="p-5 bg-muted/50 border-b border-border grid grid-cols-5 gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">
              <div className="col-span-2">學生</div>
              <div className="text-center">場次</div>
              <div className="text-center">正確率</div>
              <div className="text-right">總分</div>
            </div>
            {students.map((p, idx) => {
              const avatarIdx = Math.max(0, Math.min((p.avatar ?? 1) - 1, 7));
              const accuracy = p.questionsTotal > 0
                ? Math.round((p.correctTotal / p.questionsTotal) * 100)
                : 0;
              return (
                <div
                  key={p.studentId}
                  className="grid grid-cols-5 gap-4 items-center p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  data-testid={`admin-student-row-${idx}`}
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <div className={`w-9 h-9 ${AVATAR_COLORS[avatarIdx]} rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>
                      {AVATAR_INITIALS[avatarIdx]}
                    </div>
                    <span className="font-bold text-foreground truncate">{p.nickname}</span>
                  </div>
                  <div className="text-center font-bold text-foreground">{p.gamesPlayed ?? 0}</div>
                  <div className="text-center">
                    <span className={`font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {accuracy}%
                    </span>
                  </div>
                  <div className="text-right font-black text-foreground">{(p.totalScore ?? 0).toLocaleString()}</div>
                </div>
              );
            })}

            {/* Average row */}
            {students.length > 0 && (
              <div className="grid grid-cols-5 gap-4 items-center p-4 bg-muted/50 border-t-2 border-border">
                <div className="col-span-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">全班平均</span>
                </div>
                <div className="text-center font-bold text-foreground">{Math.round(totalGames / students.length)}</div>
                <div className="text-center font-bold text-primary">{avgAccuracy}%</div>
                <div className="text-right font-black text-foreground">{Math.round(totalScore / students.length).toLocaleString()}</div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl border-2 border-border shadow p-5 flex flex-col items-center text-center gap-2">
      <div className="p-2 bg-muted rounded-xl">{icon}</div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {unlocked ? (
          <Dashboard key="dashboard" onLock={() => setUnlocked(false)} />
        ) : (
          <PinPad key="pin" onSuccess={() => setUnlocked(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}
