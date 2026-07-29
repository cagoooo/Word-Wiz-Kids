export const WORD_CATEGORIES = ['動物', '水果', '顏色', '數字', '食物', '交通', '家庭', '身體', '學校', 'Noun', 'Verb', 'Adjective', 'Adverb', 'Number', 'Phrase', '其他'] as const;

export interface WordCandidate {
  english: string;
  chinese: string;
  phonetic?: string;
  category?: string;
  example?: string;
  exampleChinese?: string;
}

export interface ExistingWordCandidate extends WordCandidate {
  id: string;
}

export type WordQualityStatus = 'new' | 'exact_duplicate' | 'conflict' | 'batch_duplicate' | 'invalid';
export type WordConflictStrategy = 'skip' | 'merge' | 'overwrite';

export interface WordQualityItem {
  index: number;
  candidate: Required<Pick<WordCandidate, 'english' | 'chinese' | 'phonetic' | 'category'>> & Pick<WordCandidate, 'example' | 'exampleChinese'>;
  status: WordQualityStatus;
  message: string;
  existing?: ExistingWordCandidate;
}

export interface WordQualityPlan {
  items: WordQualityItem[];
  summary: Record<WordQualityStatus, number>;
}

export function normalizeText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

export function canonicalEnglish(value: string): string {
  return normalizeText(value).toLowerCase();
}

export function canonicalChinese(value: string): string {
  return normalizeText(value).replace(/[，,、；;。.!！?？\s]+/g, '');
}

export function normalizeWordCandidate(candidate: WordCandidate): WordQualityItem['candidate'] {
  const category = normalizeText(candidate.category ?? '其他');
  return {
    english: normalizeText(candidate.english ?? ''),
    chinese: normalizeText(candidate.chinese ?? ''),
    phonetic: normalizeText(candidate.phonetic ?? ''),
    category: WORD_CATEGORIES.includes(category as (typeof WORD_CATEGORIES)[number]) ? category : '其他',
    example: candidate.example ? normalizeText(candidate.example) : undefined,
    exampleChinese: candidate.exampleChinese ? normalizeText(candidate.exampleChinese) : undefined,
  };
}

export function analyzeWordCandidates(
  candidates: WordCandidate[],
  existingWords: ExistingWordCandidate[] = [],
): WordQualityPlan {
  const existingByEnglish = new Map<string, ExistingWordCandidate>();
  for (const existing of existingWords) {
    const key = canonicalEnglish(existing.english);
    if (key && !existingByEnglish.has(key)) existingByEnglish.set(key, existing);
  }

  const seenBatch = new Set<string>();
  const items = candidates.map((rawCandidate, index): WordQualityItem => {
    const candidate = normalizeWordCandidate(rawCandidate);
    const key = canonicalEnglish(candidate.english);

    if (!key || !canonicalChinese(candidate.chinese)) {
      return { index, candidate, status: 'invalid', message: '英文與中文都必須填寫' };
    }
    if (seenBatch.has(key)) {
      return { index, candidate, status: 'batch_duplicate', message: '同一批資料中已有相同英文單字' };
    }
    seenBatch.add(key);

    const existing = existingByEnglish.get(key);
    if (!existing) {
      return { index, candidate, status: 'new', message: '可新增' };
    }
    if (canonicalChinese(existing.chinese) === canonicalChinese(candidate.chinese)) {
      return { index, candidate, existing, status: 'exact_duplicate', message: '單字庫已有相同中英文內容' };
    }
    return {
      index,
      candidate,
      existing,
      status: 'conflict',
      message: `英文相同，但現有中文為「${existing.chinese}」`,
    };
  });

  const summary: WordQualityPlan['summary'] = {
    new: 0,
    exact_duplicate: 0,
    conflict: 0,
    batch_duplicate: 0,
    invalid: 0,
  };
  for (const item of items) summary[item.status] += 1;
  return { items, summary };
}

export function resolveWordQualityPlan(plan: WordQualityPlan, strategy: WordConflictStrategy) {
  const toAdd: WordCandidate[] = [];
  const toUpdate: Array<{ id: string; word: WordCandidate }> = [];

  for (const item of plan.items) {
    if (item.status === 'new') {
      toAdd.push(item.candidate);
      continue;
    }
    if (item.status !== 'conflict' || !item.existing || strategy === 'skip') continue;

    const word = strategy === 'overwrite'
      ? item.candidate
      : {
          english: item.existing.english || item.candidate.english,
          chinese: item.existing.chinese || item.candidate.chinese,
          phonetic: item.existing.phonetic || item.candidate.phonetic,
          category: item.existing.category || item.candidate.category,
          example: item.existing.example || item.candidate.example,
          exampleChinese: item.existing.exampleChinese || item.candidate.exampleChinese,
        };
    toUpdate.push({ id: item.existing.id, word });
  }
  return { toAdd, toUpdate };
}

export function findExistingDuplicateGroups(words: ExistingWordCandidate[]): ExistingWordCandidate[][] {
  const groups = new Map<string, ExistingWordCandidate[]>();
  for (const word of words) {
    const key = canonicalEnglish(word.english);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(word);
    groups.set(key, group);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}
