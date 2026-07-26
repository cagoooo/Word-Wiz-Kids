/**
 * Client-side helper for calling the api-server Gemini proxy.
 * The api-server is served at /api (same Replit proxy, different path).
 */

export interface ExtractedWord {
  english: string;
  chinese: string;
  phonetic: string;
  category: string;
}

export async function analyzeImageForWords(
  imageBase64: string,
  mimeType: string,
): Promise<ExtractedWord[]> {
  const response = await fetch('/api/admin/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `API error ${response.status}`);
  }

  const data = (await response.json()) as { words: ExtractedWord[] };
  return data.words ?? [];
}

/** Convert a File to base64 string (without the data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:image/xxx;base64," prefix
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
