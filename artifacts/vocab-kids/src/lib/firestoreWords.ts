/**
 * Firestore CRUD for the `words` collection.
 * Words here augment (and can override) the static MOCK_WORDS.
 * All operations check isFirebaseConfigured — no-ops when offline.
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { Word } from '@/data/words';
import {
  analyzeWordCandidates,
  normalizeWordCandidate,
  resolveWordQualityPlan,
  type WordCandidate,
  type WordConflictStrategy,
  type WordQualityPlan,
} from './wordQuality';

export interface FirestoreWord extends Omit<Word, 'vowels' | 'diphthongs'> {
  id: string;
  vowels: number[];
  diphthongs: { start: number; length: number }[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Auto-compute vowel positions for a word. */
function computeVowels(english: string): number[] {
  const vowelChars = new Set(['a', 'e', 'i', 'o', 'u']);
  return english
    .toLowerCase()
    .split('')
    .map((ch, i) => (vowelChars.has(ch) ? i : -1))
    .filter((i) => i >= 0);
}

/** Auto-compute common English diphthong positions. */
function computeDiphthongs(english: string): { start: number; length: number }[] {
  const diphthongPatterns = ['ai', 'ay', 'ee', 'ea', 'ie', 'oa', 'oo', 'ou', 'ow', 'oi', 'oy', 'au', 'aw', 'ew', 'ue', 'ui'];
  const lower = english.toLowerCase();
  const result: { start: number; length: number }[] = [];
  const covered = new Set<number>();

  for (const pattern of diphthongPatterns) {
    let idx = lower.indexOf(pattern);
    while (idx >= 0) {
      if (!covered.has(idx)) {
        result.push({ start: idx, length: pattern.length });
        covered.add(idx);
        covered.add(idx + 1);
      }
      idx = lower.indexOf(pattern, idx + 1);
    }
  }
  return result.sort((a, b) => a.start - b.start);
}

/** Convert a partial word spec to a full FirestoreWord. */
export function buildWordRecord(params: WordCandidate): Omit<FirestoreWord, 'id' | 'createdAt' | 'updatedAt'> {
  const normalized = normalizeWordCandidate(params);
  return {
    english: normalized.english,
    chinese: normalized.chinese,
    phonetic: normalized.phonetic,
    category: normalized.category,
    example: normalized.example ?? `I see a ${normalized.english}.`,
    exampleChinese: normalized.exampleChinese ?? `我看到一個${normalized.chinese}。`,
    vowels: computeVowels(normalized.english),
    diphthongs: computeDiphthongs(normalized.english),
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getAllWords(): Promise<FirestoreWord[]> {
  if (!isFirebaseConfigured || !db) return [];
  // Single-field orderBy only — composite indexes require manual Firestore setup.
  // Secondary sort (by english within category) is done client-side.
  const q = query(collection(db, 'words'), orderBy('english'));
  const snap = await getDocs(q);
  const words = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreWord));
  // Client-side sort: group by category, then by english within each group
  return words.sort((a, b) =>
    a.category.localeCompare(b.category) || a.english.localeCompare(b.english),
  );
}

/**
 * Subscribe to real-time updates for the words collection.
 * Calls `onUpdate` whenever a word is added, modified, or deleted.
 * Returns an unsubscribe function — call it on cleanup.
 */
export function subscribeWords(
  onUpdate: (words: FirestoreWord[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    // No-op: immediately return a no-op unsubscribe
    return () => {};
  }
  const q = query(collection(db, 'words'), orderBy('english'));
  return onSnapshot(
    q,
    (snap) => {
      const words = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreWord))
        .sort((a, b) => a.category.localeCompare(b.category) || a.english.localeCompare(b.english));
      onUpdate(words);
    },
    (err) => {
      onError?.(err);
    },
  );
}

/** Wraps any Firestore promise with a 15-second timeout that surfaces a clear rules error. */
function withFirestoreTimeout<T>(promise: Promise<T>): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            'PERMISSION_DENIED：Firestore 安全規則拒絕寫入。\n請至 Firebase Console → Firestore Database → 規則，確認允許寫入（測試模式）。',
          ),
        ),
      15000,
    ),
  );
  return Promise.race([promise, timeout]);
}

export async function addWord(
  params: Parameters<typeof buildWordRecord>[0],
): Promise<FirestoreWord> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定');
  }
  const quality = analyzeWordCandidates([params], await getAllWords());
  const item = quality.items[0];
  if (item.status !== 'new') throw new Error(`無法新增：${item.message}`);
  const record = buildWordRecord(params);
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'words'), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return { id: ref.id, ...record };
}

export async function updateWord(
  id: string,
  params: Partial<Parameters<typeof buildWordRecord>[0]>,
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  if (params.english !== undefined || params.chinese !== undefined) {
    const words = await getAllWords();
    const current = words.find((word) => word.id === id);
    if (current) {
      const quality = analyzeWordCandidates(
        [{ ...current, ...params }],
        words.filter((word) => word.id !== id),
      );
      const item = quality.items[0];
      if (item.status !== 'new') throw new Error(`無法更新：${item.message}`);
    }
  }
  const ref = doc(db, 'words', id);
  const update: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (params.english !== undefined) {
    update.english = params.english;
    update.vowels = computeVowels(params.english);
    update.diphthongs = computeDiphthongs(params.english);
  }
  if (params.chinese !== undefined) update.chinese = params.chinese;
  if (params.phonetic !== undefined) update.phonetic = params.phonetic;
  if (params.category !== undefined) update.category = params.category;
  if (params.example !== undefined) update.example = params.example;
  if (params.exampleChinese !== undefined) update.exampleChinese = params.exampleChinese;
  await withFirestoreTimeout(updateDoc(ref, update));
}

export async function deleteWord(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await withFirestoreTimeout(deleteDoc(doc(db, 'words', id)));
}

/** Batch-add multiple words (from Gemini recognition results). */
export async function batchAddWords(
  words: Parameters<typeof buildWordRecord>[0][],
): Promise<FirestoreWord[]> {
  const result = await importWordsWithQuality(words, 'skip');
  return result.addedWords;
}

export interface WordImportResult {
  plan: WordQualityPlan;
  addedWords: FirestoreWord[];
  updatedCount: number;
}

/**
 * Quality-gated import shared by CSV and Gemini flows.
 * Duplicate English labels are never silently inserted.
 */
export async function importWordsWithQuality(
  words: WordCandidate[],
  strategy: WordConflictStrategy = 'skip',
): Promise<WordImportResult> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定');
  }
  const existing = await getAllWords();
  const plan = analyzeWordCandidates(words, existing);
  const { toAdd, toUpdate } = resolveWordQualityPlan(plan, strategy);
  const batch = writeBatch(db);
  const refs: { id: string; record: ReturnType<typeof buildWordRecord> }[] = [];

  for (const params of toAdd) {
    const record = buildWordRecord(params);
    const ref = doc(collection(db, 'words'));
    batch.set(ref, {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    refs.push({ id: ref.id, record });
  }

  for (const { id, word } of toUpdate) {
    batch.update(doc(db, 'words', id), {
      ...buildWordRecord(word),
      updatedAt: serverTimestamp(),
    });
  }

  // Timeout after 15s — Firestore hangs silently when security rules block writes
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            'PERMISSION_DENIED：Firestore 安全規則拒絕寫入。\n請至 Firebase Console → Firestore Database → 規則，確認允許寫入（測試模式：allow read, write: if true）。',
          ),
        ),
      15000,
    ),
  );

  if (refs.length > 0 || toUpdate.length > 0) await Promise.race([batch.commit(), timeout]);
  return {
    plan,
    addedWords: refs.map(({ id, record }) => ({ id, ...record })),
    updatedCount: toUpdate.length,
  };
}
