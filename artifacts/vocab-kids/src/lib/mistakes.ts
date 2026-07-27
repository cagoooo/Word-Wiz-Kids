/**
 * Smart Wrong Word Notebook (錯題本) Helper.
 * Tracks user wrong answers across games and review sessions.
 */

export interface MistakeItem {
  id: string;
  english: string;
  chinese: string;
  phonetic?: string;
  category?: string;
  wrongCount: number;
  lastWrongDate: string;
  mastered: boolean;
}

const STORAGE_KEY = 'vocab-mistakes-list';

export function getMistakes(): MistakeItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const list: MistakeItem[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to parse mistakes:', e);
    return [];
  }
}

export function saveMistakes(list: MistakeItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function recordMistake(word: { id?: string; english: string; chinese: string; category?: string; phonetic?: string }): void {
  const mistakes = getMistakes();
  const targetId = word.id || word.english.toLowerCase();
  const existingIdx = mistakes.findIndex((m) => m.id === targetId || m.english.toLowerCase() === word.english.toLowerCase());

  const today = new Date().toISOString().split('T')[0];

  if (existingIdx !== -1) {
    mistakes[existingIdx].wrongCount += 1;
    mistakes[existingIdx].lastWrongDate = today;
    mistakes[existingIdx].mastered = false; // Mark un-mastered
  } else {
    mistakes.unshift({
      id: targetId,
      english: word.english,
      chinese: word.chinese,
      phonetic: word.phonetic || '',
      category: word.category || '其他',
      wrongCount: 1,
      lastWrongDate: today,
      mastered: false,
    });
  }

  saveMistakes(mistakes);
}

export function markMistakeMastered(idOrEnglish: string): void {
  const mistakes = getMistakes();
  const updated = mistakes.map((m) => {
    if (m.id === idOrEnglish || m.english.toLowerCase() === idOrEnglish.toLowerCase()) {
      return { ...m, mastered: true };
    }
    return m;
  });
  saveMistakes(updated);
}

export function removeMistake(idOrEnglish: string): void {
  const mistakes = getMistakes();
  const filtered = mistakes.filter((m) => m.id !== idOrEnglish && m.english.toLowerCase() !== idOrEnglish.toLowerCase());
  saveMistakes(filtered);
}

export function clearAllMistakes(): void {
  saveMistakes([]);
}
