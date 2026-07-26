/**
 * Admin page — PIN-protected parent/teacher dashboard.
 * Three tabs after unlock:
 *   1. 儀表板    — stats overview + student progress
 *   2. 單字辨識  — Gemini Vision image upload + word extraction
 *   3. 單字庫    — full word CRUD management
 *
 * All text in Traditional Chinese. No emojis.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, KeyRound, ArrowRight,
  BarChart3, Users, Star, Target, Gamepad2, RefreshCw, AlertCircle,
  Sparkles, BookOpen,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getAllStudentProgress, type StudentProgress } from '@/lib/firestore';
import { getAllWords } from '@/lib/firestoreWords';
import { isFirebaseConfigured } from '@/lib/firebase';
import { AVATAR_COLORS, AVATAR_INITIALS } from '@/components/student/NicknameSetup';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { WordExtractResult } from '@/components/admin/WordExtractResult';
import { WordLibrary } from '@/components/admin/WordLibrary';
import { analyzeImageForWords, type ExtractedWord } from '@/lib/geminiClient';

const ADMIN_PIN = '0000';
const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-muted rounded-full mb-4">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">家長專區</h1>
        <p className="text-muted-foreground mt-2">請輸入 PIN 碼進入管理設定</p>
      </div>

      <form onSubmit={handleSubmit} className={`bg-card p-8 rounded-3xl border-2 shadow-xl transition-colors ${error ? 'border-destructive' : 'border-border'}`}>
        <div className="flex justify-center gap-4 mb-2">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              animate={error ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.3 }}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl font-bold transition-colors ${index < pin.length ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted'}`}
              data-testid={`pin-dot-${index}`}
            >
              {index < pin.length ? '*' : ''}
            </motion.div>
          ))}
        </div>
        {error && <p className="text-center text-destructive text-sm font-bold mb-4">PIN 碼錯誤，請再試一次</p>}

        <div className="grid grid-cols-3 gap-4 mb-4 mt-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} type="button" onClick={() => handleNumber(num)}
              className="h-16 rounded-2xl bg-muted hover:bg-muted/80 text-2xl font-bold text-foreground transition-transform active:scale-95"
              data-testid={`pin-pad-${num}`}>
              {num}
            </button>
          ))}
          <button type="button" onClick={handleClear}
            className="h-16 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold transition-transform active:scale-95"
            data-testid="pin-pad-clear">清除</button>
          <button type="button" onClick={() => handleNumber(0)}
            className="h-16 rounded-2xl bg-muted hover:bg-muted/80 text-2xl font-bold text-foreground transition-transform active:scale-95"
            data-testid="pin-pad-0">0</button>
          <button type="submit" disabled={pin.length < 4}
            className="h-16 rounded-2xl bg-primary text-primary-foreground font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
            data-testid="pin-pad-submit">
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

// ── Dashboard tab ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([
        getAllStudentProgress(),
        isFirebaseConfigured ? getAllWords().then((ws) => ws.length) : Promise.resolve(null),
      ]);
      setStudents(s);
      setWordCount(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalGames = students.reduce((s, p) => s + (p.gamesPlayed ?? 0), 0);
  const totalScore = students.reduce((s, p) => s + (p.totalScore ?? 0), 0);
  const avgAccuracy = students.length > 0
    ? Math.round(students.reduce((s, p) => s + (p.questionsTotal > 0 ? (p.correctTotal / p.questionsTotal) * 100 : 0), 0) / students.length)
    : 0;

  const chartData = students.slice(0, 8).map((p) => ({ name: p.nickname, 場次: p.gamesPlayed ?? 0 }));

  return (
    <div className="space-y-6">
      {!isFirebaseConfigured && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Firebase 離線模式 — 設定 <code className="bg-amber-100 px-1 rounded">VITE_FIREBASE_*</code> 環境變數後即可啟用雲端資料。</span>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard icon={<BookOpen className="w-5 h-5 text-blue-500" />} label="單字總數" value={wordCount !== null ? String(wordCount) : '—'} />
        <SummaryCard icon={<Users className="w-5 h-5 text-purple-500" />} label="學生人數" value={String(students.length)} />
        <SummaryCard icon={<Gamepad2 className="w-5 h-5 text-green-500" />} label="總遊戲場次" value={String(totalGames)} />
        <SummaryCard icon={<Target className="w-5 h-5 text-orange-500" />} label="平均正確率" value={students.length ? `${avgAccuracy}%` : '—'} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">載入中...</div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-black text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                各學生遊戲場次
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="場次" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Student table */}
          {students.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 bg-muted/50 border-b border-border grid grid-cols-5 gap-3 text-xs font-bold text-muted-foreground uppercase">
                <div className="col-span-2">學生</div>
                <div className="text-center">場次</div>
                <div className="text-center">正確率</div>
                <div className="text-right">總分</div>
              </div>
              {students.map((p, idx) => {
                const avatarIdx = Math.max(0, Math.min((p.avatar ?? 1) - 1, 7));
                const accuracy = p.questionsTotal > 0 ? Math.round((p.correctTotal / p.questionsTotal) * 100) : 0;
                return (
                  <div key={p.studentId} className="grid grid-cols-5 gap-3 items-center p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors" data-testid={`admin-student-row-${idx}`}>
                    <div className="col-span-2 flex items-center gap-3">
                      <div className={`w-8 h-8 ${AVATAR_COLORS[avatarIdx]} rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                        {AVATAR_INITIALS[avatarIdx]}
                      </div>
                      <span className="font-bold text-sm truncate">{p.nickname}</span>
                    </div>
                    <div className="text-center font-bold text-sm">{p.gamesPlayed ?? 0}</div>
                    <div className="text-center">
                      <span className={`text-sm font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{accuracy}%</span>
                    </div>
                    <div className="text-right font-black text-sm">{(p.totalScore ?? 0).toLocaleString()}</div>
                  </div>
                );
              })}
              <div className="grid grid-cols-5 gap-3 items-center p-3 bg-muted/50 border-t-2 border-border">
                <div className="col-span-2 font-bold text-sm text-foreground flex items-center gap-2"><Target className="w-4 h-4 text-primary" />全班平均</div>
                <div className="text-center font-bold text-sm">{students.length ? Math.round(totalGames / students.length) : 0}</div>
                <div className="text-center font-bold text-sm text-primary">{avgAccuracy}%</div>
                <div className="text-right font-black text-sm">{students.length ? Math.round(totalScore / students.length).toLocaleString() : 0}</div>
              </div>
            </div>
          )}

          {students.length === 0 && (
            <div className="py-12 text-center bg-card rounded-2xl border border-dashed border-border">
              <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-muted-foreground font-bold">{isFirebaseConfigured ? '還沒有學生資料' : '（離線模式）'}</p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end">
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl font-bold text-sm transition-colors" data-testid="btn-refresh-dashboard">
          <RefreshCw className="w-4 h-4" />
          重新整理
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center text-center gap-2">
      <div className="p-2 bg-muted rounded-xl">{icon}</div>
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Gemini Vision tab ─────────────────────────────────────────────────────────

function GeminiVisionTab() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleImage(base64: string, mimeType: string, preview: string) {
    setPreviewUrl(preview);
    setExtractedWords(null);
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const words = await analyzeImageForWords(base64, mimeType);
      setExtractedWords(words);
      if (words.length === 0) setError('Gemini 未偵測到英文單字。請試試包含清晰英文字詞的圖片。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '辨識失敗，請再試一次。');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPreviewUrl(null);
    setExtractedWords(null);
    setError(null);
    setSuccessMsg(null);
  }

  function handleSaved(count: number) {
    setSuccessMsg(`成功寫入 ${count} 個單字到單字庫！`);
    setExtractedWords(null);
    setPreviewUrl(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-sm">
        <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
        <div>
          <p className="font-bold text-foreground">Gemini 2.5 Flash 視覺辨識</p>
          <p className="text-muted-foreground mt-0.5">上傳包含英文單字的圖片（教科書頁面、字卡、海報等），AI 將自動辨識並提取單字。辨識結果可編輯後再儲存。</p>
        </div>
      </div>

      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 font-bold text-sm">
          {successMsg}
        </motion.div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {previewUrl && (
        <div className="rounded-2xl overflow-hidden border border-border">
          <img src={previewUrl} alt="上傳的圖片" className="w-full max-h-64 object-contain bg-muted" data-testid="image-preview" />
        </div>
      )}

      {!extractedWords ? (
        <ImageUploader onImage={handleImage} loading={loading} />
      ) : (
        <WordExtractResult words={extractedWords} onSaved={handleSaved} onReset={handleReset} />
      )}
    </div>
  );
}

// ── Tabs layout ───────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'vision' | 'library';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '儀表板', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'vision',    label: '單字辨識', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'library',   label: '單字庫', icon: <BookOpen className="w-4 h-4" /> },
];

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          管理後台
        </h1>
        <button onClick={onLock} className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl font-bold text-sm transition-colors" data-testid="btn-lock">
          鎖定
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted p-1 rounded-2xl mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            data-testid={`tab-${t.id}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'vision'    && <GeminiVisionTab />}
          {tab === 'library'   && <WordLibrary />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <AnimatePresence mode="wait">
        {unlocked
          ? <AdminDashboard key="dashboard" onLock={() => setUnlocked(false)} />
          : <PinPad key="pin" onSuccess={() => setUnlocked(true)} />
        }
      </AnimatePresence>
    </div>
  );
}
