/**
 * WordLibrary — searchable, filterable word CRUD management.
 * Lists all Firestore words, allows inline edit and delete.
 * All text in Traditional Chinese. No emojis.
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Edit3, Save, X, Plus, BookOpen, AlertCircle, RefreshCw, Upload, Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { getAllWords, updateWord, deleteWord, addWord, importWordsWithQuality, type FirestoreWord } from '@/lib/firestoreWords';
import { isFirebaseConfigured } from '@/lib/firebase';
import { MOCK_WORDS } from '@/data/words';
import { AudioButton } from '@/components/ui/AudioButton';
import { parseCSV, exportToCSV, downloadSampleCSV, type WordCSVRow } from '@/lib/csvHelper';
import { analyzeWordCandidates, findExistingDuplicateGroups, WORD_CATEGORIES, type WordConflictStrategy, type WordQualityPlan } from '@/lib/wordQuality';

const CATEGORIES = ['全部', ...WORD_CATEGORIES];

interface EditState {
  english: string;
  chinese: string;
  phonetic: string;
  category: string;
}

export function WordLibrary() {
  const [words, setWords] = useState<FirestoreWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addState, setAddState] = useState<EditState>({ english: '', chinese: '', phonetic: '', category: '其他' });
  const [saving, setSaving] = useState(false);
  const [importPreview, setImportPreview] = useState<{ fileName: string; rows: WordCSVRow[]; plan: WordQualityPlan } | null>(null);
  const [importStrategy, setImportStrategy] = useState<WordConflictStrategy>('skip');
  const [showQualityScan, setShowQualityScan] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await getAllWords();
      setWords(fetched);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displayWords = isFirebaseConfigured ? words : MOCK_WORDS.map((w) => ({ ...w })) as unknown as FirestoreWord[];
  const duplicateGroups = useMemo(() => findExistingDuplicateGroups(displayWords), [displayWords]);

  const filtered = displayWords.filter((w) => {
    const matchSearch = !search || w.english.includes(search.toLowerCase()) || w.chinese.includes(search);
    const matchCat = categoryFilter === '全部' || w.category === categoryFilter;
    return matchSearch && matchCat;
  });

  async function handleDelete(id: string) {
    if (!isFirebaseConfigured) return;
    if (!confirm('確定要刪除這個單字嗎？')) return;
    try {
      await deleteWord(id);
      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '刪除失敗');
    }
  }

  function startEdit(w: FirestoreWord) {
    setEditingId(w.id);
    setEditState({ english: w.english, chinese: w.chinese, phonetic: w.phonetic ?? '', category: w.category });
  }

  async function handleUpdate(id: string) {
    if (!editState || !isFirebaseConfigured) return;
    setSaving(true);
    try {
      await updateWord(id, editState);
      setWords((prev) => prev.map((w) => w.id === id ? { ...w, ...editState } : w));
      setEditingId(null);
      setEditState(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失敗');
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    if (!addState.english.trim() || !addState.chinese.trim() || !isFirebaseConfigured) return;
    setSaving(true);
    try {
      const newWord = await addWord(addState);
      setWords((prev) => [...prev, newWord]);
      setAddState({ english: '', chinese: '', phonetic: '', category: '其他' });
      setShowAddForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '新增失敗');
    } finally {
      setSaving(false);
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      alert('未偵測到有效的單字資料。請檢查 CSV 檔案格式。');
      return;
    }
    setImportPreview({ fileName: file.name, rows: parsed, plan: analyzeWordCandidates(parsed, displayWords) });
    e.target.value = '';
  };

  const handleConfirmCSVImport = async () => {
    if (!importPreview || !isFirebaseConfigured) return;
    setSaving(true);
    try {
      const result = await importWordsWithQuality(importPreview.rows, importStrategy);
      await load();
      setImportPreview(null);
      alert(`匯入完成：新增 ${result.addedWords.length} 個、更新 ${result.updatedCount} 個，其他重複或無效資料已略過。`);
    } catch (err) {
      alert('匯入失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Offline notice */}
      {!isFirebaseConfigured && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>離線模式 — 顯示的是內建範例單字（24 個）。設定 Firebase 後即可管理自訂單字庫。</span>
        </div>
      )}

      {/* Header + toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜尋英文或中文..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-muted text-sm focus:outline-none focus:border-primary"
            data-testid="word-search"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs cursor-pointer transition-colors shrink-0">
            <Upload className="w-4 h-4" />
            匯入 CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>

          <button
            onClick={() => exportToCSV(displayWords, 'WordWizKids_單字庫備份.csv')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs transition-colors shrink-0"
            title="導出目前單字庫為 CSV 檔"
          >
            <Download className="w-4 h-4" />
            導出 CSV
          </button>

          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs transition-colors shrink-0"
            title="下載標準 CSV 匯入範本"
          >
            <FileSpreadsheet className="w-4 h-4" />
            下載範本
          </button>

          <button
            onClick={() => setShowQualityScan((value) => !value)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs transition-colors shrink-0"
            title="掃描現有單字庫中的重複英文"
          >
            <ShieldCheck className="w-4 h-4" />
            品質掃描
          </button>

          <button
            onClick={load}
            className="p-3 bg-muted hover:bg-muted/70 rounded-2xl transition-colors"
            title="重新整理"
            data-testid="btn-refresh-words"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isFirebaseConfigured && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors"
              data-testid="btn-add-word-library"
            >
              <Plus className="w-4 h-4" />
              新增單字
            </button>
          )}
        </div>
      </div>

      {importPreview && (
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 space-y-4" data-testid="csv-import-preview">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-foreground">CSV 匯入預覽：{importPreview.fileName}</h3>
              <p className="text-sm text-muted-foreground">
                新增 {importPreview.plan.summary.new} · 完全重複 {importPreview.plan.summary.exact_duplicate} · 衝突 {importPreview.plan.summary.conflict} · 批內重複 {importPreview.plan.summary.batch_duplicate} · 無效 {importPreview.plan.summary.invalid}
              </p>
            </div>
            <select value={importStrategy} onChange={(event) => setImportStrategy(event.target.value as WordConflictStrategy)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold">
              <option value="skip">衝突時略過</option>
              <option value="merge">衝突時合併缺少欄位</option>
              <option value="overwrite">衝突時以匯入資料覆蓋</option>
            </select>
          </div>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border">
            {importPreview.plan.items.map((item) => (
              <div key={`${item.index}-${item.candidate.english}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 p-2 text-xs">
                <span className="font-bold">{item.candidate.english || '（缺少英文）'}</span>
                <span>{item.candidate.chinese || '（缺少中文）'}</span>
                <span className={item.status === 'new' ? 'text-emerald-600' : item.status === 'invalid' ? 'text-destructive' : 'text-amber-600'}>{item.message}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setImportPreview(null)} className="flex-1 rounded-xl bg-muted px-4 py-3 font-bold">取消</button>
            <button type="button" onClick={handleConfirmCSVImport} disabled={saving || importPreview.plan.summary.new + importPreview.plan.summary.conflict === 0} className="flex-[2] rounded-xl bg-primary px-4 py-3 font-black text-white disabled:opacity-40">
              {saving ? '寫入中…' : '確認套用品質閘門並匯入'}
            </button>
          </div>
        </div>
      )}

      {showQualityScan && (
        <div className={`rounded-2xl border p-4 ${duplicateGroups.length === 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`} data-testid="word-quality-scan">
          <p className="font-black">{duplicateGroups.length === 0 ? '品質掃描通過：目前沒有重複英文單字。' : `找到 ${duplicateGroups.length} 組重複英文，請保留正確項目並刪除其餘資料。`}</p>
          {duplicateGroups.map((group) => <p key={group[0].id} className="mt-2 text-sm">{group[0].english}：{group.map((word) => word.chinese).join('／')}</p>)}
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              categoryFilter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/60'
            }`}
            data-testid={`filter-cat-${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Add word form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {(['english', 'chinese', 'phonetic'] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {field === 'english' ? '英文' : field === 'chinese' ? '中文' : '音標'}
                </label>
                <input
                  type="text"
                  value={addState[field]}
                  onChange={(e) => setAddState((s) => ({ ...s, [field]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary"
                  data-testid={`add-${field}`}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-muted-foreground mb-1">分類</label>
                <select
                  value={addState.category}
                  onChange={(e) => setAddState((s) => ({ ...s, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary"
                  data-testid="add-category"
                >
                  {CATEGORIES.filter(c => c !== '全部').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1 mt-5">
                <button
                  onClick={handleAdd}
                  disabled={saving || !addState.english.trim() || !addState.chinese.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 transition-colors"
                  data-testid="btn-confirm-add"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 bg-muted rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word count */}
      <p className="text-sm text-muted-foreground">
        共 {filtered.length} 個單字{categoryFilter !== '全部' ? `（${categoryFilter}）` : ''}
      </p>

      {/* Word table */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">載入中...</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-4 gap-3 p-4 bg-muted/50 border-b border-border text-xs font-bold text-muted-foreground uppercase">
            <div>英文</div>
            <div>中文</div>
            <div>分類</div>
            <div className="text-right">操作</div>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>沒有符合的單字</p>
              </div>
            ) : (
              filtered.map((w, idx) => (
                <div key={w.id ?? idx} className="grid grid-cols-4 gap-3 p-3 items-center hover:bg-muted/30 transition-colors" data-testid={`library-word-${idx}`}>
                  {editingId === w.id && editState ? (
                    <>
                      <input value={editState.english} onChange={(e) => setEditState(s => s ? { ...s, english: e.target.value } : s)}
                        className="px-2 py-1 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:border-primary col-span-1" />
                      <input value={editState.chinese} onChange={(e) => setEditState(s => s ? { ...s, chinese: e.target.value } : s)}
                        className="px-2 py-1 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:border-primary" />
                      <select value={editState.category} onChange={(e) => setEditState(s => s ? { ...s, category: e.target.value } : s)}
                        className="px-2 py-1 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:border-primary">
                        {CATEGORIES.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleUpdate(w.id)} disabled={saving}
                          className="p-1.5 bg-primary text-white rounded-lg disabled:opacity-50">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingId(null); setEditState(null); }}
                          className="p-1.5 bg-muted rounded-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        <span>{w.english}</span>
                        <AudioButton text={w.english} size="sm" showSlow={false} />
                      </div>
                      <span className="text-sm text-muted-foreground">{w.chinese}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full w-fit">{w.category}</span>
                      <div className="flex justify-end gap-1">
                        {isFirebaseConfigured && (
                          <>
                            <button onClick={() => startEdit(w)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" data-testid={`btn-edit-word-${idx}`}>
                              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDelete(w.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-destructive" data-testid={`btn-delete-word-${idx}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
