/**
 * WordExtractResult — editable list of Gemini-extracted words.
 * Admin can edit each field, remove unwanted words, then batch-save to Firestore.
 * All text in Traditional Chinese. No emojis.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { ExtractedWord } from '@/lib/geminiClient';
import { batchAddWords } from '@/lib/firestoreWords';
import { isFirebaseConfigured } from '@/lib/firebase';

interface EditableWord extends ExtractedWord {
  _key: number;
}

const CATEGORIES = ['動物', '水果', '顏色', '數字', '食物', '交通', '家庭', '身體', '學校', '其他'];

interface Props {
  words: ExtractedWord[];
  onSaved: (count: number) => void;
  onReset: () => void;
}

export function WordExtractResult({ words: initialWords, onSaved, onReset }: Props) {
  const [words, setWords] = useState<EditableWord[]>(() =>
    initialWords.map((w, i) => ({ ...w, _key: i })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateWord(key: number, field: keyof ExtractedWord, value: string) {
    setWords((prev) =>
      prev.map((w) => (w._key === key ? { ...w, [field]: value } : w)),
    );
  }

  function removeWord(key: number) {
    setWords((prev) => prev.filter((w) => w._key !== key));
  }

  function addBlankWord() {
    const key = Date.now();
    setWords((prev) => [
      ...prev,
      { english: '', chinese: '', phonetic: '', category: '其他', _key: key },
    ]);
  }

  async function handleSave() {
    const valid = words.filter((w) => w.english.trim() && w.chinese.trim());
    if (valid.length === 0) return;

    if (!isFirebaseConfigured) {
      setError('Firebase 未設定，無法儲存單字。請先設定 VITE_FIREBASE_* 環境變數。');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await batchAddWords(
        valid.map((w) => ({
          english: w.english.trim().toLowerCase(),
          chinese: w.chinese.trim(),
          phonetic: w.phonetic.trim() || `/${w.english}/`,
          category: w.category,
        })),
      );
      onSaved(valid.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗，請再試一次。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-xl text-foreground">
          辨識結果（{words.length} 個單字）
        </h3>
        <button
          onClick={onReset}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          data-testid="btn-reset"
        >
          重新上傳
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Word list */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        <AnimatePresence>
          {words.map((w) => (
            <motion.div
              key={w._key}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <div>
                <label className="block text-xs text-muted-foreground font-bold mb-1">英文</label>
                <input
                  type="text"
                  value={w.english}
                  onChange={(e) => updateWord(w._key, 'english', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm font-bold focus:outline-none focus:border-primary"
                  data-testid={`word-english-${w._key}`}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-bold mb-1">中文</label>
                <input
                  type="text"
                  value={w.chinese}
                  onChange={(e) => updateWord(w._key, 'chinese', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm font-bold focus:outline-none focus:border-primary"
                  data-testid={`word-chinese-${w._key}`}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-bold mb-1">音標</label>
                <input
                  type="text"
                  value={w.phonetic}
                  onChange={(e) => updateWord(w._key, 'phonetic', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:border-primary font-mono"
                  data-testid={`word-phonetic-${w._key}`}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground font-bold mb-1">分類</label>
                  <select
                    value={w.category}
                    onChange={(e) => updateWord(w._key, 'category', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:border-primary"
                    data-testid={`word-category-${w._key}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => removeWord(w._key)}
                  className="mt-5 p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex-shrink-0"
                  data-testid={`word-delete-${w._key}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <button
          onClick={addBlankWord}
          className="flex items-center gap-2 px-4 py-3 bg-muted hover:bg-muted/70 rounded-2xl font-bold text-sm text-foreground transition-colors"
          data-testid="btn-add-word"
        >
          <Plus className="w-4 h-4" />
          手動新增
        </button>
        <button
          onClick={handleSave}
          disabled={saving || words.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-lg disabled:opacity-50 transition-colors"
          data-testid="btn-save-words"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          {saving ? '儲存中...' : `確認寫入（${words.filter(w => w.english.trim()).length} 個單字）`}
        </button>
      </div>
    </div>
  );
}
