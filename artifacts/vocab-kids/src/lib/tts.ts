/**
 * Web Speech API Text-to-Speech (TTS) helper.
 * Provides American & British English voice selection with normal and slow rate support.
 */

let voices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const available = window.speechSynthesis.getVoices();
    if (available.length > 0) {
      voices = available;
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
    };
  });
}

// Initial prefetch
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

export interface SpeakOptions {
  rate?: number; // 1.0 normal, 0.7 slow
  pitch?: number; // 1.0 default
  lang?: string; // 'en-US' | 'zh-TW' | string
}

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  if (voices.length === 0) {
    await loadVoices();
  }

  // Detect language if not explicitly provided
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  const targetLang = options.lang || (isChinese ? 'zh-TW' : 'en-US');
  const { rate = 1.0, pitch = 1.0 } = options;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = targetLang;

  let preferredVoice: SpeechSynthesisVoice | undefined;

  if (isChinese || targetLang.startsWith('zh')) {
    preferredVoice = voices.find(
      (v) => v.lang.startsWith('zh') && (v.name.includes('Google') || v.name.includes('HsiaoChen') || v.name.includes('Mei-Jia') || v.name.includes('HanHan') || v.name.includes('Natural'))
    ) || voices.find((v) => v.lang.startsWith('zh'));
  } else {
    preferredVoice = voices.find(
      (v) => v.lang.startsWith(targetLang) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen'))
    ) || voices.find((v) => v.lang.startsWith('en'));
  }

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function speakSlow(text: string): Promise<void> {
  return speak(text, { rate: 0.65 });
}

// Backward compatibility & convenience exports
export const speakWord = (text: string, lang?: string): Promise<void> => speak(text, { lang });
export const speakText = (text: string, lang?: string): Promise<void> => speak(text, { lang });
export const isTTSSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

