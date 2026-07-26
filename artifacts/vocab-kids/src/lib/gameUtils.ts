import { Word } from '../data/words';

export interface Question {
  word: Word;
  options: Word[];
  correctIndex: number;
}

export function generateQuestions(words: Word[], count: number): Question[] {
  // Pick count random words
  const shuffledWords = [...words].sort(() => Math.random() - 0.5);
  const selectedWords = shuffledWords.slice(0, Math.min(count, words.length));

  return selectedWords.map((correctWord) => {
    // Pick distractors
    const otherWords = words.filter(w => w.id !== correctWord.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    
    // If pool has < 4 words, use what is available
    const numDistractors = Math.min(3, shuffledOthers.length);
    const distractors = shuffledOthers.slice(0, numDistractors);
    
    const options = [correctWord, ...distractors];
    // Shuffle options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
    const correctIndex = shuffledOptions.findIndex(w => w.id === correctWord.id);

    return {
      word: correctWord,
      options: shuffledOptions,
      correctIndex
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
