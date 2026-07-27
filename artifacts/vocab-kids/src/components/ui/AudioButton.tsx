import React, { useState } from 'react';
import { Volume2, Turtle } from 'lucide-react';
import { speak, speakSlow } from '@/lib/tts';

interface AudioButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSlow?: boolean;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  className = '',
  size = 'md',
  showSlow = true,
}) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (slow: boolean = false) => {
    setSpeaking(true);
    if (slow) {
      speakSlow(text);
    } else {
      speak(text);
    }
    setTimeout(() => setSpeaking(false), 1200);
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const btnSizes = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2.5 rounded-xl',
    lg: 'p-3.5 rounded-2xl',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Normal speed speaker */}
      <button
        type="button"
        onClick={() => handleSpeak(false)}
        title="播放美式發音"
        aria-label={`Listen to ${text}`}
        className={`${btnSizes[size]} bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center`}
      >
        <Volume2 className={`${iconSizes[size]} ${speaking ? 'animate-bounce text-amber-500' : ''}`} />
      </button>

      {/* Slow speed speaker */}
      {showSlow && (
        <button
          type="button"
          onClick={() => handleSpeak(true)}
          title="慢速發音 🐢"
          aria-label={`Listen to ${text} slowly`}
          className={`${btnSizes[size]} bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center`}
        >
          <Turtle className={`${iconSizes[size]} ${speaking ? 'animate-pulse text-amber-500' : ''}`} />
        </button>
      )}
    </div>
  );
};
