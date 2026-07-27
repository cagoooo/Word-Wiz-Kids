/**
 * Admin page — PIN-protected parent/teacher dashboard.
 * Three tabs after unlock:
 *   1. 儀表板    — stats overview + student progress
 *   2. 單字辨識  — Gemini Vision image upload + word extraction
 *   3. 單字庫    — full word CRUD management
 *
 * All text in Traditional Chinese. No emojis.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Shield, KeyRound, ArrowRight,
  BarChart3, Users, Star, Target, Gamepad2, RefreshCw, AlertCircle,
  Sparkles, BookOpen, Settings, Save, Check,
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

const PIN_STORAGE_KEY = 'vocab-admin-pin';
const DEFAULT_PIN = '0220';

function getStoredPin(): string {
  return localStorage.getItem(PIN_STORAGE_KEY) ?? DEFAULT_PIN;
}

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
    if (pin === getStoredPin()) {
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
        <div className="text-center text-sm text-muted-foreground">
          請輸入您的管理員 PIN 碼
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
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleImage(base64: string, mimeType: string, preview: string) {
    setPreviewUrl(preview);
    setExtractedWords(null);
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const words = await analyzeImageForWords(base64, mimeType);
      setExtractedWords(words);
      if (words.length === 0) {
        setError('Gemini 未偵測到英文單字。請試試包含清晰英文字詞的圖片。');
      } else {
        // 辨識完成後自動捲動到結果區塊
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
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
        <div ref={resultsRef}>
          <WordExtractResult words={extractedWords} onSaved={handleSaved} onReset={handleReset} />
        </div>
      )}
    </div>
  );
}

// ── Tabs layout ───────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'vision' | 'library' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '儀表板',  icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'vision',    label: '單字辨識', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'library',   label: '單字庫',  icon: <BookOpen className="w-4 h-4" /> },
  { id: 'settings',  label: '設定',    icon: <Settings className="w-4 h-4" /> },
];

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [activeField, setActiveField] = useState<'new' | 'confirm'>('new');
  const [err, setErr] = useState('');

  const appendDigit = (n: number) => {
    if (activeField === 'new' && newPin.length < 4) setNewPin(p => p + n);
    if (activeField === 'confirm' && confirmPin.length < 4) setConfirmPin(p => p + n);
  };
  const clearActive = () => {
    if (activeField === 'new') setNewPin('');
    else setConfirmPin('');
    setErr('');
  };

  const handleSave = () => {
    if (newPin.length < 4 || confirmPin.length < 4) { setErr('請輸入完整的 4 位數 PIN 碼'); return; }
    if (newPin !== confirmPin) { setErr('兩次輸入的 PIN 碼不一致，請重新輸入'); setConfirmPin(''); setActiveField('confirm'); return; }
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    setStep('done');
    setErr('');
  };

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">PIN 碼已更新</h2>
          <p className="text-muted-foreground">下次進入後台請使用新的 PIN 碼</p>
        </div>
        <button onClick={() => { setStep('idle'); setNewPin(''); setConfirmPin(''); setActiveField('new'); }} className="px-6 py-2 rounded-xl bg-muted font-bold text-sm hover:bg-muted/80">
          繼續設定
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto py-6">
      <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-primary" />
        修改管理員 PIN 碼
      </h2>

      {/* Field selector */}
      <div className="flex gap-3 mb-6">
        {(['new', 'confirm'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveField(f)}
            className={`flex-1 p-4 rounded-2xl border-2 text-center transition-all ${activeField === f ? 'border-primary bg-primary/5' : 'border-border bg-muted/40'}`}
          >
            <p className="text-xs text-muted-foreground font-bold mb-2 tracking-wider">
              {f === 'new' ? '新 PIN 碼' : '確認 PIN 碼'}
            </p>
            <div className="flex justify-center gap-2">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${i < (f === 'new' ? newPin : confirmPin).length ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted'}`}>
                  {i < (f === 'new' ? newPin : confirmPin).length ? '*' : ''}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {err && <p className="text-center text-destructive text-sm font-bold mb-4">{err}</p>}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} type="button" onClick={() => appendDigit(n)}
            className="h-14 rounded-2xl bg-muted hover:bg-muted/80 text-xl font-bold transition-transform active:scale-95">
            {n}
          </button>
        ))}
        <button type="button" onClick={clearActive}
          className="h-14 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold transition-transform active:scale-95">清除</button>
        <button type="button" onClick={() => appendDigit(0)}
          className="h-14 rounded-2xl bg-muted hover:bg-muted/80 text-xl font-bold transition-transform active:scale-95">0</button>
        <button type="button" onClick={handleSave}
          className="h-14 rounded-2xl bg-primary text-primary-foreground font-bold transition-transform active:scale-95 flex items-center justify-center">
          <Save className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center mb-8">
        設定新的 4 位數 PIN 碼，儲存後立即生效
      </p>

      {/* Gemini API Key Configuration */}
      <div className="pt-6 border-t border-border space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Gemini 2.5 Flash Lite 金鑰設定
        </h3>
        <p className="text-xs text-muted-foreground">
          提供英文單字圖片 AI 辨識功能。已支援 <code className="bg-purple-100 text-purple-800 px-1 rounded">gemini-2.5-flash-lite</code> 視覺辨識模型。
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="貼上您的 Gemini API Key (AIzaSy...)"
            defaultValue={localStorage.getItem('vocab-gemini-key') || ''}
            id="gemini-key-input"
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => {
              const val = (document.getElementById('gemini-key-input') as HTMLInputElement)?.value.trim();
              if (val) {
                localStorage.setItem('vocab-gemini-key', val);
                alert('Gemini API Key 已儲存！');
              } else {
                localStorage.removeItem('vocab-gemini-key');
                alert('已清除自訂 Gemini API Key！');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            儲存金鑰
          </button>
        </div>
      </div>
    </div>
  );
}

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
          {tab === 'settings'  && <SettingsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [, navigate] = useLocation();

  function handleLock() {
    setUnlocked(false);
    navigate('/');
  }

  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <AnimatePresence mode="wait">
        {unlocked
          ? <AdminDashboard key="dashboard" onLock={handleLock} />
          : <PinPad key="pin" onSuccess={() => setUnlocked(true)} />
        }
      </AnimatePresence>
    </div>
  );
}
