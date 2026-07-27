/**
 * Direct browser Gemini 2.5 Flash Lite client for image word extraction.
 * Uses gemini-2.5-flash-lite with Vision + JSON output.
 */

export interface ExtractedWord {
  english: string;
  chinese: string;
  phonetic: string;
  category: string;
}

export function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const localKey = localStorage.getItem('vocab-gemini-key');
  if (envKey && envKey.trim().length > 0) return envKey.trim();
  if (localKey && localKey.trim().length > 0) return localKey.trim();
  return '';
}

export async function analyzeImageForWords(
  imageBase64: string,
  mimeType: string,
): Promise<ExtractedWord[]> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('未設定 Gemini API Key。請至管理後台「設定」分頁填入您的 Gemini API Key 即可啟用辨識功能！');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const promptText = `你是一個專業的國小兒童英文單字提取助手。請分析這張圖片，提取圖片中所有出現的英文單字。
請以純 JSON 格式回傳一個 JSON Array，每一個元素需包含以下欄位：
- "english": 英文單字 (例如 "Apple")
- "chinese": 繁體中文翻譯 (例如 "蘋果")
- "phonetic": KK音標或IPA音標 (例如 "/ˈæp.əl/")
- "category": 單字詞性種類 (例如 "Noun", "Verb", "Adjective", "Phrase", "Other")

請直接輸出 JSON 陣列即可，勿包含 markdown 程式碼引號。`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson.error?.message || `Gemini API 請求失敗 (${response.status})`;
    throw new Error(message);
  }

  const resultData = await response.json();
  const rawContent = resultData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawContent) {
    return [];
  }

  try {
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const words = JSON.parse(cleanJson) as ExtractedWord[];
    return Array.isArray(words) ? words : [];
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawContent, err);
    throw new Error('Gemini 回傳格式解析失敗，請重試。');
  }
}

/** Convert a File to base64 string (without the data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
