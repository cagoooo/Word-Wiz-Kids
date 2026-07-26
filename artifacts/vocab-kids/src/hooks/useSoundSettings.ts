/**
 * useSoundSettings — persists mute preference to localStorage.
 * Keeps the sound engine in sync via setMuted / startBGM / stopBGM.
 */
import { useState, useCallback } from 'react';
import { setMuted, startBGM, stopBGM } from '@/lib/soundEngine';

const STORAGE_KEY = 'vocab-kids-sound-muted';

function readMuted(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
}

export function useSoundSettings() {
  const [muted, setMutedState] = useState<boolean>(readMuted);

  const toggleMute = useCallback(() => {
    setMutedState(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
      setMuted(next);
      if (next) stopBGM(300);
      else startBGM();
      return next;
    });
  }, []);

  return { muted, toggleMute };
}
