/**
 * Admin routes — Gemini Vision image analysis for word extraction.
 * POST /api/admin/analyze-image
 *   Body: { imageBase64: string; mimeType: string }
 *   Returns: { words: ExtractedWord[] }
 */
import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

export interface ExtractedWord {
  english: string;
  chinese: string;
  phonetic: string;
  category: string;
}

const router: IRouter = Router();

const EXTRACT_PROMPT = `You are a vocabulary extraction assistant for a children's English learning app (ages 5-10, Taiwan).

Analyze this image and extract all visible English vocabulary words.
For each word, provide:
- english: the English word (lowercase)
- chinese: the Traditional Chinese (繁體中文) translation
- phonetic: IPA phonetic notation in /slashes/
- category: one of 動物, 水果, 顏色, 數字, 食物, 交通, 家庭, 身體, 學校, 其他

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "words": [
    { "english": "cat", "chinese": "貓咪", "phonetic": "/kæt/", "category": "動物" }
  ]
}

If no English words are visible, return: { "words": [] }`;

router.post("/analyze-image", async (req, res) => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "imageBase64 and mimeType are required" });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType as string,
                data: imageBase64,
              },
            },
            { text: EXTRACT_PROMPT },
          ],
        },
      ],
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "{}";

    // Parse JSON response
    let parsed: { words: ExtractedWord[] };
    try {
      parsed = JSON.parse(text) as { words: ExtractedWord[] };
    } catch {
      // Try to extract JSON from the response text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]) as { words: ExtractedWord[] };
      } else {
        parsed = { words: [] };
      }
    }

    // Sanitize and validate words
    const words: ExtractedWord[] = (parsed.words ?? [])
      .filter(
        (w) =>
          typeof w.english === "string" &&
          w.english.trim().length > 0 &&
          typeof w.chinese === "string",
      )
      .map((w) => ({
        english: w.english.trim().toLowerCase(),
        chinese: (w.chinese ?? "").trim(),
        phonetic: (w.phonetic ?? `/${w.english}/`).trim(),
        category: (w.category ?? "其他").trim(),
      }));

    res.json({ words });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini API error";
    res.status(500).json({ error: message });
  }
});

export default router;
