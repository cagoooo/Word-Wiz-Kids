export interface Word {
  id: string;
  english: string;
  chinese: string;
  phonetic?: string;          // 可選：注音/音標
  category: string;
  example?: string;           // 可選：英文例句
  exampleChinese?: string;    // 可選：中文例句翻譯
  vowels: number[];
  diphthongs: { start: number; length: number }[];
}

export const CATEGORIES = ["全部"];

/**
 * 預設單字庫（離線 fallback）。
 * 單字現在由 Firebase / Firestore 管理，此陣列已清空。
 * 若 Firebase 未設定，學習和遊戲頁面會顯示「尚無單字」提示。
 */
export const MOCK_WORDS: Word[] = [];
