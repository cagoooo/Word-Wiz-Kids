import { Word } from '@/data/words';

export function PhoneticHighlight({ word }: { word: Word }) {
  const letters = word.english.split('');
  
  return (
    <div className="flex justify-center" data-testid="phonetic-highlight">
      {letters.map((char, index) => {
        const inDiphthong = word.diphthongs.some(
          d => index >= d.start && index < d.start + d.length
        );
        const isVowel = word.vowels.includes(index);
        
        let className = "text-slate-700 dark:text-slate-200 font-medium";
        if (inDiphthong) {
          className = "text-emerald-600 dark:text-emerald-400 underline decoration-2 underline-offset-8 font-bold";
        } else if (isVowel) {
          className = "text-rose-500 dark:text-rose-400 font-bold";
        }
        
        return (
          <span key={index} className={`text-5xl md:text-6xl tracking-widest ${className}`}>
            {char}
          </span>
        );
      })}
    </div>
  );
}
