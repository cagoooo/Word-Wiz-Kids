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

export const GEMINI_VISION_MODEL = 'gemini-2.5-flash-lite';

export type GeminiKeyCheck =
  | { status: 'missing'; message: string }
  | { status: 'valid'; message: string }
  | { status: 'invalid'; message: string };

export function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const localKey = localStorage.getItem('vocab-gemini-key');
  if (localKey && localKey.trim().length > 0) return localKey.trim();
  if (envKey && envKey.trim().length > 0) return envKey.trim();
  return '';
}

/**
 * Verify that the configured key can access the exact vision model used by the
 * app. The model metadata endpoint does not generate content or spend output
 * tokens, so it is safe to run automatically when the admin opens the tab.
 */
export async function validateGeminiApiKey(): Promise<GeminiKeyCheck> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      status: 'missing',
      message: '尚未設定 Gemini API Key，請先建立並儲存金鑰後再使用圖片辨識。',
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}?key=${encodeURIComponent(apiKey)}`,
      { signal: controller.signal, cache: 'no-store' },
    );

    if (response.ok) {
      return {
        status: 'valid',
        message: `API Key 驗證成功，可使用 ${GEMINI_VISION_MODEL} 視覺辨識。`,
      };
    }

    const body = await response.json().catch(() => ({})) as { error?: { status?: string } };
    const errorStatus = body.error?.status;
    const message = response.status === 429
      ? 'API Key 可以連線，但目前已達 Gemini 使用配額，請檢查 Google AI Studio 的配額設定。'
      : errorStatus === 'PERMISSION_DENIED' || response.status === 403
        ? 'API Key 無法使用 Gemini 服務，請確認金鑰限制與 Generative Language API 權限。'
        : response.status === 400
          ? 'API Key 格式無效，請重新建立或貼上正確的 Gemini API Key。'
          : `Gemini API Key 驗證失敗（${response.status}），請稍後重試或更新金鑰。`;
    return { status: 'invalid', message };
  } catch (error) {
    return {
      status: 'invalid',
      message: error instanceof DOMException && error.name === 'AbortError'
        ? 'Gemini 連線驗證逾時，請確認網路後重新檢查。'
        : '目前無法連線 Gemini 驗證服務，請確認網路後重新檢查。',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function analyzeImageForWords(
  imageBase64: string,
  mimeType: string,
): Promise<ExtractedWord[]> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('未設定 Gemini API Key。請至管理後台「設定」分頁填入您的 Gemini API Key 即可啟用辨識功能！');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${apiKey}`;

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
