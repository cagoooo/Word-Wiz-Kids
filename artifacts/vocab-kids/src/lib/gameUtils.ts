import type { Word } from '../data/words';

export type QuestionDirection = 'en_to_zh' | 'zh_to_en';

export interface Question {
  word: Word;
  options: Word[];
  correctIndex: number;
  /** en_to_zh: show English prompt, select Chinese answer.
   *  zh_to_en: show Chinese prompt, select English answer. */
  direction: QuestionDirection;
}

export type QuestionOrderMode = 'random' | 'newest' | 'oldest';

function normalizeOptionLabel(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function getOptionLabel(word: Word, direction: QuestionDirection): string {
  return direction === 'en_to_zh' ? word.chinese : word.english;
}

function getDistinctDistractors(
  words: Word[],
  correctWord: Word,
  direction: QuestionDirection,
): Word[] {
  const usedLabels = new Set([normalizeOptionLabel(getOptionLabel(correctWord, direction))]);

  return [...words]
    .sort(() => Math.random() - 0.5)
    .filter((word) => {
      if (word.id === correctWord.id) return false;

      const label = normalizeOptionLabel(getOptionLabel(word, direction));
      if (!label || usedLabels.has(label)) return false;

      usedLabels.add(label);
      return true;
    })
    .slice(0, 3);
}

export function generateQuestions(
  words: Word[],
  count: number,
  orderMode: QuestionOrderMode = 'random'
): Question[] {
  let selectedWords: Word[] = [];

  if (orderMode === 'newest') {
    // Newest first (reverse array order, or latest added)
    selectedWords = [...words].reverse().slice(0, Math.min(count, words.length));
  } else if (orderMode === 'oldest') {
    // Oldest first (original array order)
    selectedWords = [...words].slice(0, Math.min(count, words.length));
  } else {
    // Random shuffle
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    selectedWords = shuffledWords.slice(0, Math.min(count, words.length));
  }

  return selectedWords.map((correctWord) => {
    // Choose a direction first so duplicate visible labels (even with different IDs)
    // can never appear as separate answers, e.g. "Ball" / "ball" or two "球" entries.
    let direction: QuestionDirection = Math.random() < 0.5 ? 'en_to_zh' : 'zh_to_en';
    let distractors = getDistinctDistractors(words, correctWord, direction);

    // Prefer the other direction when it can provide a complete four-choice set.
    if (distractors.length < 3) {
      const alternateDirection: QuestionDirection = direction === 'en_to_zh' ? 'zh_to_en' : 'en_to_zh';
      const alternateDistractors = getDistinctDistractors(words, correctWord, alternateDirection);
      if (alternateDistractors.length > distractors.length) {
        direction = alternateDirection;
        distractors = alternateDistractors;
      }
    }

    const options = [correctWord, ...distractors];
    // Shuffle options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
    const correctIndex = shuffledOptions.findIndex(w => w.id === correctWord.id);

    return {
      word: correctWord,
      options: shuffledOptions,
      correctIndex,
      direction,
    };
  });
}

export function calcScore(timeLeftMs: number, totalTimeMs: number, combo: number): number {
  if (timeLeftMs <= 0) return 0;
  
  const baseScore = Math.round(1000 * (timeLeftMs / totalTimeMs));
  let multiplier = 1.0;
  if (combo >= 4) {
    multiplier = 2.0;
  } else if (combo >= 2) {
    multiplier = 1.5;
  }
  
  const finalScore = Math.round(baseScore * multiplier);
  return Math.max(100, finalScore);
}

export function getStarRating(correct: number, total: number): 1 | 2 | 3 {
  if (total === 0) return 1;
  const ratio = correct / total;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}
