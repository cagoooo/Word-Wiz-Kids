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
}

export function useWordLibrary(): WordLibrary {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeWords(
      (fetched) => {
        setWords(
          fetched.map((fw) => ({
            id: fw.id,
            english: fw.english,
            chinese: fw.chinese,
            phonetic: fw.phonetic,
            category: fw.category,
            example: fw.example ?? `I see a ${fw.english}.`,
            exampleChinese: fw.exampleChinese ?? `我看到一個${fw.chinese}。`,
            vowels: fw.vowels ?? [],
            diphthongs: fw.diphthongs ?? [],
          })),
        );
        setLoading(false);
      },
      () => {
        setWords([]);
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

  return { words, categories, loading };
}
