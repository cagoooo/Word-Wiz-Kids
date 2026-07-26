/**
 * HeroScene — CSS star animation background
 * 
 * The original Three.js / @react-three/fiber implementation caused a
 * react-reconciler conflict with React 19 (react-reconciler uses
 * a different React dispatcher that breaks hooks in the main tree).
 * 
 * Since the Replit preview environment doesn't support WebGL anyway,
 * we use the pure-CSS fallback permanently. Three.js can be re-added
 * later in a separate environment that supports WebGL and react-reconciler
 * is upgraded for React 19 compatibility.
 */

// Stable star positions so the component doesn't rerender differently
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  size: ((i * 37 + 13) % 5) + 2,
  top: ((i * 73 + 17) % 100),
  left: ((i * 53 + 29) % 100),
  delay: ((i * 41 + 7) % 30) / 10,
  duration: ((i * 31 + 11) % 20) / 10 + 2,
}));

export function HeroScene() {
  return (
    <div className="w-full h-full absolute inset-0 -z-10 bg-gradient-to-b from-[#2e026d] via-[#1a0050] to-[#150030]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STARS.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white/25 animate-pulse"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
