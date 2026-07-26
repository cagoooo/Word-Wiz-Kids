/**
 * useWordLibrary — loads words from Firestore in real-time.
 * MOCK_WORDS fallback has been removed; all words come from Firestore.
 * When Firebase is not configured, returns an empty list with loading=false.
 */
import { useState, useEffect } from 'react';
import type { Word } from '@/data/words';
import { subscribeWords } from '@/lib/firestoreWords';
import { isFirebaseConfigured } from '@/lib/firebase';

export interface WordLibrary {
  words: Word[];
  categories: string[];
  loading: boolean;
  error: boolean;        // true 表示 Firestore 連線失敗
}

export function useWordLibrary(): WordLibrary {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeWords(
      (fetched) => {
        setError(false);
        setWords(
          fetched.map((fw) => ({
            id: fw.id,
            english: fw.english,
            chinese: fw.chinese,
            phonetic: fw.phonetic || undefined,
            category: fw.category,
            example: fw.example || undefined,
            exampleChinese: fw.exampleChinese || undefined,
            vowels: fw.vowels ?? [],
            diphthongs: fw.diphthongs ?? [],
          })),
        );
        setLoading(false);
      },
      () => {
        setWords([]);
        setError(true);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Derive categories: "全部" always first, then unique categories from words
  const categories: string[] = (() => {
    const unique = Array.from(new Set(words.map((w) => w.category)));
    return ['全部', ...unique.sort((a, b) => a.localeCompare(b, 'zh-Hant'))];
  })();

  return { words, categories, loading, error };
}
