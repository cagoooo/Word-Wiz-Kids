---
name: React 19 + react-reconciler conflict
description: @react-three/fiber uses react-reconciler which conflicts with React 19 in Vite pnpm monorepo, causing "Invalid hook call" / "Cannot read properties of null (reading 'useRef')".
---

# React 19 + react-reconciler (Three.js) Conflict

## The Rule
Do NOT use `@react-three/fiber` or `@react-three/drei` alongside React 19 in this Vite pnpm monorepo. The packages use `react-reconciler` which creates a separate React dispatcher that conflicts with React 19's internal architecture, crashing the entire app.

**Why:** When `@react-three/fiber` loads (even as a CJS module excluded from Vite pre-bundling), its `react-reconciler` creates an incompatible dispatcher. Even with `dedupe: ['react', 'react-dom']`, the reconciler uses React internal APIs (`ReactSharedInternals.H`) that differ between React 18 (which three.js fiber targets) and React 19.

**Symptom:** "Invalid hook call" + "Cannot read properties of null (reading 'useRef')" in ALL components including TooltipProvider — the ENTIRE app crashes, not just the Three.js component.

**How to apply:**
- If Three.js visuals are needed, wait for @react-three/fiber to release React 19 reconciler support
- Use pure CSS animations or Canvas API for hero backgrounds instead
- The Vite screenshot/preview tool can get stuck in a stale broken browser session — verify app health with `curl http://localhost:<PORT>/` instead of relying on screenshots
- The HeroScene component now uses CSS star animation permanently (no WebGL needed)

## Also note
Vite `optimizeDeps.include` for Radix UI packages prevents mid-session "new dependencies optimized" reloads. Added: `@radix-ui/react-slot`, `@radix-ui/react-tooltip`, `@radix-ui/react-toast`.
