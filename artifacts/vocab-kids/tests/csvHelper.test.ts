import { describe, expect, it } from 'vitest';
import { parseCSV, parseCSVLine } from '@/lib/csvHelper';

describe('CSV parser', () => {
  it('supports quoted commas and escaped quotes', () => {
    expect(parseCSVLine('"Good, morning","早安","/gʊd/","Phrase"')).toEqual(['Good, morning', '早安', '/gʊd/', 'Phrase']);
    expect(parseCSVLine('"Say ""hi""","打招呼"')).toEqual(['Say "hi"', '打招呼']);
  });

  it('keeps invalid rows so the quality preview can report them', () => {
    const rows = parseCSV('english,chinese,phonetic,category\nBall,球,/bɔl/,其他\nMissing,,/x/,其他');
    expect(rows).toHaveLength(2);
    expect(rows[1].chinese).toBe('');
  });
});
