import { describe, expect, it } from 'vitest';
import { analyzeWordCandidates, findExistingDuplicateGroups, normalizeWordCandidate, resolveWordQualityPlan } from '@/lib/wordQuality';

describe('word quality gate', () => {
  const existing = [{ id: 'ball-1', english: 'Ball', chinese: '球', phonetic: '/bɔl/', category: '其他' }];

  it('normalizes full-width text, whitespace and unknown categories', () => {
    expect(normalizeWordCandidate({ english: '  Ｂａｌｌ  ', chinese: '  球 ', category: 'Unknown' })).toMatchObject({
      english: 'Ball', chinese: '球', category: '其他',
    });
  });

  it('classifies exact duplicates, conflicts, batch duplicates and invalid rows', () => {
    const plan = analyzeWordCandidates([
      { english: ' ball ', chinese: '球' },
      { english: 'BALL', chinese: '舞會' },
      { english: 'Book', chinese: '書' },
      { english: 'book', chinese: '書本' },
      { english: '', chinese: '缺字' },
    ], existing);
    expect(plan.items.map((item) => item.status)).toEqual([
      'exact_duplicate', 'batch_duplicate', 'new', 'batch_duplicate', 'invalid',
    ]);
  });

  it('can skip, merge or overwrite conflicts without adding a duplicate document', () => {
    const plan = analyzeWordCandidates([{ english: 'Ball', chinese: '舞會', phonetic: '/bɔːl/' }], existing);
    expect(resolveWordQualityPlan(plan, 'skip')).toMatchObject({ toAdd: [], toUpdate: [] });
    expect(resolveWordQualityPlan(plan, 'merge').toUpdate[0].word.chinese).toBe('球');
    expect(resolveWordQualityPlan(plan, 'overwrite').toUpdate[0].word.chinese).toBe('舞會');
  });

  it('finds duplicate groups already stored in the library', () => {
    expect(findExistingDuplicateGroups([...existing, { ...existing[0], id: 'ball-2', english: ' ＢＡＬＬ ' }])).toHaveLength(1);
  });
});
