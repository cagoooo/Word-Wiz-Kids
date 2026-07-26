export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakWord(word: string, options?: { rate?: number; pitch?: number }): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = options?.rate ?? 0.85;
  utterance.pitch = options?.pitch ?? 1.1;
  
  window.speechSynthesis.speak(utterance);
}
