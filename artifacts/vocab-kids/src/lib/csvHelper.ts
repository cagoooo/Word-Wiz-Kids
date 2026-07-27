/**
 * CSV import and export utility for Word Library management.
 */

export interface WordCSVRow {
  english: string;
  chinese: string;
  phonetic?: string;
  category?: string;
}

export function parseCSV(csvText: string): WordCSVRow[] {
  const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  
  const engIdx = headers.findIndex((h) => h.includes('english') || h.includes('單字') || h.includes('英文'));
  const chiIdx = headers.findIndex((h) => h.includes('chinese') || h.includes('中文') || h.includes('翻譯'));
  const phoIdx = headers.findIndex((h) => h.includes('phonetic') || h.includes('音標') || h.includes('kk'));
  const catIdx = headers.findIndex((h) => h.includes('category') || h.includes('詞性') || h.includes('分類'));

  const results: WordCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''));
    if (cols.length === 0) continue;

    const english = engIdx !== -1 ? cols[engIdx] : cols[0];
    const chinese = chiIdx !== -1 ? cols[chiIdx] : cols[1];
    const phonetic = phoIdx !== -1 ? cols[phoIdx] : cols[2];
    const category = catIdx !== -1 ? cols[catIdx] : cols[3];

    if (english && chinese) {
      results.push({
        english: english.trim(),
        chinese: chinese.trim(),
        phonetic: (phonetic || '').trim(),
        category: (category || 'Noun').trim(),
      });
    }
  }

  return results;
}

export function exportToCSV(words: WordCSVRow[], filename: string = '單字庫備份.csv'): void {
  const headers = ['english,chinese,phonetic,category'];
  const rows = words.map(
    (w) => `"${w.english.replace(/"/g, '""')}","${w.chinese.replace(/"/g, '""')}","${(w.phonetic || '').replace(/"/g, '""')}","${(w.category || 'Noun').replace(/"/g, '""')}"`
  );
  
  const csvContent = '\uFEFF' + [headers, ...rows].join('\n'); // Add BOM for Excel utf-8 recognition
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSampleCSV(): void {
  const sampleWords: WordCSVRow[] = [
    { english: 'Apple', chinese: '蘋果', phonetic: '/ˈæp.əl/', category: 'Noun' },
    { english: 'Run', chinese: '跑步', phonetic: '/rʌn/', category: 'Verb' },
    { english: 'Happy', chinese: '快樂的', phonetic: '/ˈhæp.i/', category: 'Adjective' },
    { english: 'Good morning', chinese: '早安', phonetic: '/ɡʊd ˈmɔː.nɪŋ/', category: 'Phrase' },
  ];
  exportToCSV(sampleWords, '國小英文單字庫匯入範本.csv');
}
