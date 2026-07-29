import { describe, expect, it } from 'vitest';
import { generateQuestions } from '@/lib/gameUtils';
import type { Word } from '@/data/words';

function word(id: string, english: string, chinese: string): Word {
  return { id, english, chinese, category: '其他', vowels: [], diphthongs: [] };
}

describe('generateQuestions', () => {
  it('never returns duplicate visible answer labels', () => {
    const words = [
      word('1', 'Ball', '球'),
      word('2', ' ball ', '圓球'),
      word('3', 'Book', '書'),
      word('4', 'Pen', '筆'),
      word('5', 'Cat', '貓'),
      word('6', 'Dog', '球'),
    ];

    for (let run = 0; run < 50; run += 1) {
      for (const question of generateQuestions(words, words.length)) {
        expect(question.options).toHaveLength(4);
        const labels = question.options.map((option) =>
          (question.direction === 'en_to_zh' ? option.chinese : option.english)
            .normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase(),
        );
        expect(new Set(labels).size).toBe(labels.length);
      }
    }
  });
});
