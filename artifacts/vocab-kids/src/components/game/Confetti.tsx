import { useEffect, useState } from 'react';

export function Confetti() {
  const [pieces, setPieces] = useState<{ id: number; left: number; delay: number; duration: number; color: string }[]>([]);

  useEffect(() => {
    const colors = ['#f43f5e', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#f97316'];
    const newPieces = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-6 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            top: '-10%',
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
