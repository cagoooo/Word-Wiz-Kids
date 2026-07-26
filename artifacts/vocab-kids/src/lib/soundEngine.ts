/**
 * soundEngine.ts — Web Audio API synthesized BGM + SFX.
 * No external audio files — all sounds generated programmatically.
 * AudioContext is created lazily on first user interaction.
 */

let _ctx: AudioContext | null = null;
let _muted = false;

function ctx(): AudioContext {
  if (!_ctx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext;
    _ctx = new AC();
  }
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

export function setMuted(m: boolean): void { _muted = m; }
export function getMuted(): boolean { return _muted; }

// ── Primitive tone synthesizer ──────────────────────────────────────────────

function tone(
  freq: number,
  startSec: number,
  durSec: number,
  vol: number,
  type: OscillatorType,
  dest: AudioNode,
): void {
  if (!_ctx || freq <= 0) return;
  const osc = _ctx.createOscillator();
  const g = _ctx.createGain();
  const att = Math.min(0.025, durSec * 0.15);
  const rel = Math.min(0.15, durSec * 0.35);
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, startSec);
  g.gain.linearRampToValueAtTime(vol, startSec + att);
  g.gain.setValueAtTime(vol, Math.max(startSec + att + 0.001, startSec + durSec - rel));
  g.gain.linearRampToValueAtTime(0, startSec + durSec);
  osc.connect(g);
  g.connect(dest);
  osc.start(startSec);
  osc.stop(startSec + durSec + 0.01);
}

// ── BGM ─────────────────────────────────────────────────────────────────────

const BPM = 126;
const BEAT = 60 / BPM; // ~0.476s per quarter note

// [frequency_Hz, length_in_beats, volume]
type N = [number, number, number];

// 32-beat cheerful C-major pentatonic melody
const MELODY: N[] = [
  [659.25,1,.10],[783.99,1,.12],[880.00,1,.12],[783.99,1,.10],  // phrase 1a  (4)
  [659.25,2,.12],[523.25,1,.10],[587.33,1,.09],                   // phrase 1b  (4)
  [659.25,1,.10],[523.25,1,.10],[392.00,1,.08],[440.00,1,.08],   // phrase 2a  (4)
  [523.25,2,.11],[587.33,2,.11],                                   // phrase 2b  (4)
  [783.99,1,.12],[659.25,1,.10],[523.25,1,.10],[587.33,1,.09],   // phrase 3a  (4)
  [659.25,1,.11],[587.33,1,.09],[523.25,2,.12],                   // phrase 3b  (4)
  [440.00,1,.09],[523.25,1,.11],[659.25,1,.12],[783.99,1,.12],   // phrase 4a  (4)
  [880.00,2,.13],[659.25,1,.11],[523.25,1,.10],                   // phrase 4b  (4)
]; // 32 beats total ✓

// 32-beat I-vi-IV-V bass (C3-A3-F3-G3, 8 beats each)
const BASS: N[] = [
  [130.81, 8, .06],   // C3
  [220.00, 8, .055],  // A3
  [174.61, 8, .055],  // F3
  [196.00, 8, .06],   // G3
];

let _bgmGain: GainNode | null = null;
let _bgmRunning = false;
let _bgmTimer: ReturnType<typeof setTimeout> | null = null;
const _bgmVol = 0.55;

function getBgmGain(): GainNode {
  const c = ctx();
  if (!_bgmGain) {
    _bgmGain = c.createGain();
    _bgmGain.gain.value = _bgmVol;
    _bgmGain.connect(c.destination);
  }
  return _bgmGain;
}

function scheduleBGM(startAt: number): void {
  if (!_bgmRunning) return;
  const c = ctx();
  const bg = getBgmGain();

  let t = startAt;
  let totalDur = 0;
  for (const [f, b, v] of MELODY) {
    const d = b * BEAT;
    tone(f, t, d * 0.88, v, 'triangle', bg);
    t += d;
    totalDur += d;
  }
  let bt = startAt;
  for (const [f, b, v] of BASS) {
    const d = b * BEAT;
    tone(f, bt, d * 0.85, v, 'sine', bg);
    bt += d;
  }

  const waitMs = Math.max(50, (startAt + totalDur - c.currentTime - 0.4) * 1000);
  _bgmTimer = setTimeout(() => scheduleBGM(startAt + totalDur), waitMs);
}

export function startBGM(): void {
  if (_bgmRunning || _muted) return;
  _bgmRunning = true;
  scheduleBGM(ctx().currentTime + 0.05);
}

export function stopBGM(fadeMs = 700): void {
  _bgmRunning = false;
  if (_bgmTimer) { clearTimeout(_bgmTimer); _bgmTimer = null; }
  if (_bgmGain && _ctx) {
    const g = _bgmGain;
    _bgmGain = null;
    const c = _ctx;
    g.gain.setValueAtTime(g.gain.value, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + fadeMs / 1000);
    setTimeout(() => { try { g.disconnect(); } catch { /* ignore */ } }, fadeMs + 150);
  }
}

// ── Sound Effects ────────────────────────────────────────────────────────────

function sfxDest(): AudioNode { return ctx().destination; }

export function sfxCorrect(): void {
  if (_muted) return;
  const c = ctx(), t = c.currentTime, d = sfxDest();
  tone(523.25, t,        .12, .42, 'sine', d);
  tone(659.25, t + .10,  .12, .42, 'sine', d);
  tone(783.99, t + .22,  .28, .45, 'sine', d);
}

export function sfxWrong(): void {
  if (_muted) return;
  const c = ctx(), t = c.currentTime, d = sfxDest();
  tone(280, t,        .12, .30, 'sawtooth', d);
  tone(210, t + .11,  .20, .26, 'sawtooth', d);
}

export function sfxCountdownTick(): void {
  if (_muted) return;
  tone(880, ctx().currentTime, .07, .22, 'square', sfxDest());
}

export function sfxCountdownGo(): void {
  if (_muted) return;
  const c = ctx(), t = c.currentTime, d = sfxDest();
  tone(523.25,  t,        .12, .35, 'sine', d);
  tone(659.25,  t + .10,  .12, .35, 'sine', d);
  tone(783.99,  t + .20,  .12, .35, 'sine', d);
  tone(1046.50, t + .32,  .38, .48, 'sine', d);
}

export function sfxLevelComplete(): void {
  if (_muted) return;
  const c = ctx(), t = c.currentTime, d = sfxDest();
  [523.25, 659.25, 783.99, 659.25, 1046.50].forEach((f, i) =>
    tone(f, t + i * .13, .22, .40, 'sine', d));
}

export function sfxCardFlip(): void {
  if (_muted) return;
  const c = ctx(), t = c.currentTime, d = sfxDest();
  tone(900, t,        .03, .12, 'sine', d);
  tone(600, t + .03,  .05, .08, 'sine', d);
}

export function sfxButtonTap(): void {
  if (_muted) return;
  tone(650, ctx().currentTime, .05, .10, 'sine', sfxDest());
}
