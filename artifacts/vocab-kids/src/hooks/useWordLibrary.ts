/**
 * useWordLibrary — loads words from Firestore (when Firebase is configured)
 * and merges them with MOCK_WORDS (static fallback).
 * Firestore words take priority when IDs collide.
 */
import { useState, useEffect } from 'react';
import { MOCK_WORDS, CATEGORIES } from '@/data/words';
import type { Word } from '@/data/words';
import { subscribeWords } from '@/lib/firestoreWords';
import { isFirebaseConfigured } from '@/lib/firebase';

export interface WordLibrary {
  words: Word[];
  categories: string[];
  loading: boolean;
}

export function useWordLibrary(): WordLibrary {
  const [firestoreWords, setFirestoreWords] = useState<Word[] | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeWords(
      (fetched) => {
        setFirestoreWords(
          fetched.map((fw) => ({
            id: fw.id,
            english: fw.english,
            chinese: fw.chinese,
            phonetic: fw.phonetic,
            category: fw.category,
            example: fw.example,
            exampleChinese: fw.exampleChinese,
            vowels: fw.vowels ?? [],
            diphthongs: fw.diphthongs ?? [],
          }))
        );
        setLoading(false);
      },
      () => {
        // Network / permission error — fall back silently to MOCK_WORDS
        setFirestoreWords([]);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Merge: Firestore words override MOCK_WORDS by id, new ones are appended.
  const words: Word[] = (() => {
    if (!firestoreWords || firestoreWords.length === 0) return MOCK_WORDS;

    const firestoreMap = new Map(firestoreWords.map((w) => [w.id, w]));
    const merged: Word[] = MOCK_WORDS.map((w) => firestoreMap.get(w.id) ?? w);
    const mockIds = new Set(MOCK_WORDS.map((w) => w.id));

    for (const fw of firestoreWords) {
      if (!mockIds.has(fw.id)) merged.push(fw);
    }
    return merged;
  })();

  // Derive categories: keep the static order, then append any new Firestore categories.
  const categories: string[] = (() => {
    const extra = words
      .map((w) => w.category)
      .filter((cat) => !CATEGORIES.includes(cat));
    const unique = Array.from(new Set(extra));
    return unique.length > 0 ? [...CATEGORIES, ...unique] : CATEGORIES;
  })();

  return { words, categories, loading };
}
