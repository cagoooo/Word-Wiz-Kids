/**
 * Browser audio engine for scene-based BGM and responsive game SFX.
 *
 * BGM and the completion stinger are teacher-owned, audited Suno Pro assets.
 * Short interaction sounds use licensed local assets, with synthesized tones
 * as a fallback when a browser cannot decode or play a file.
 */

export type BgmScene = 'learn' | 'game' | 'arena';

const AUDIO_ROOT = `${import.meta.env.BASE_URL}assets/audio/`;

const BGM_TRACKS: Record<BgmScene, { file: string; volume: number }> = {
  learn: { file: 'bgm-learn.mp3', volume: 0.13 },
  game: { file: 'bgm-game.mp3', volume: 0.16 },
  arena: { file: 'bgm-arena.mp3', volume: 0.17 },
};

type FileSfx = 'correct' | 'wrong' | 'card-flip' | 'button-tap' | 'complete';

const SFX_FILES: Record<FileSfx, { file: string; volume: number }> = {
  correct: { file: 'sfx-correct.mp3', volume: 0.55 },
  wrong: { file: 'sfx-wrong.mp3', volume: 0.45 },
  'card-flip': { file: 'sfx-card-flip.mp3', volume: 0.45 },
  'button-tap': { file: 'sfx-button-tap.mp3', volume: 0.38 },
  complete: { file: 'sfx-complete.mp3', volume: 0.42 },
};

let _ctx: AudioContext | null = null;
let _muted = false;
let _bgmScene: BgmScene = 'game';
let _bgmAudio: HTMLAudioElement | null = null;
let _bgmRunning = false;
let _bgmFadeTimer: number | null = null;

function ctx(): AudioContext {
  if (!_ctx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext;
    _ctx = new AC();
  }
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

export function setMuted(muted: boolean): void {
  _muted = muted;
  if (muted) stopBGM(250);
}

export function getMuted(): boolean {
  return _muted;
}

function clearBgmFade(): void {
  if (_bgmFadeTimer !== null) {
    window.clearInterval(_bgmFadeTimer);
    _bgmFadeTimer = null;
  }
}

function fadeIn(audio: HTMLAudioElement, target: number, durationMs = 900): void {
  clearBgmFade();
  const startedAt = Date.now();
  audio.volume = 0;
  _bgmFadeTimer = window.setInterval(() => {
    if (audio !== _bgmAudio) {
      clearBgmFade();
      return;
    }
    const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
    audio.volume = target * progress;
    if (progress >= 1) clearBgmFade();
  }, 50);
}

function fadeOut(audio: HTMLAudioElement, durationMs: number): void {
  const initialVolume = audio.volume;
  const startedAt = Date.now();
  const timer = window.setInterval(() => {
    const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
    audio.volume = initialVolume * (1 - progress);
    if (progress >= 1) {
      window.clearInterval(timer);
      audio.pause();
      audio.currentTime = 0;
    }
  }, 50);
}

export function startBGM(scene: BgmScene = _bgmScene): void {
  _bgmScene = scene;
  if (_muted) return;

  const track = BGM_TRACKS[scene];
  if (_bgmAudio?.dataset.scene === scene) {
    _bgmRunning = true;
    const playAttempt = _bgmAudio.play();
    if (playAttempt) void playAttempt.catch(() => { _bgmRunning = false; });
    fadeIn(_bgmAudio, track.volume, 500);
    return;
  }

  const outgoing = _bgmAudio;
  const audio = new Audio(`${AUDIO_ROOT}${track.file}`);
  audio.dataset.scene = scene;
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  _bgmAudio = audio;
  _bgmRunning = true;

  if (outgoing) fadeOut(outgoing, 500);
  const playAttempt = audio.play();
  if (playAttempt) {
    void playAttempt
      .then(() => fadeIn(audio, track.volume))
      .catch(() => { _bgmRunning = false; });
  } else {
    fadeIn(audio, track.volume);
  }
}

export function stopBGM(fadeMs = 700): void {
  _bgmRunning = false;
  clearBgmFade();
  const audio = _bgmAudio;
  _bgmAudio = null;
  if (audio) fadeOut(audio, Math.max(100, fadeMs));
}

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
  const gain = _ctx.createGain();
  const attack = Math.min(0.025, durSec * 0.15);
  const release = Math.min(0.15, durSec * 0.35);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startSec);
  gain.gain.linearRampToValueAtTime(vol, startSec + attack);
  gain.gain.setValueAtTime(vol, Math.max(startSec + attack + 0.001, startSec + durSec - release));
  gain.gain.linearRampToValueAtTime(0, startSec + durSec);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(startSec);
  osc.stop(startSec + durSec + 0.01);
}

const sfxPool: Partial<Record<FileSfx, HTMLAudioElement[]>> = {};
const SFX_POOL_SIZE = 3;

function getSfxAudio(kind: FileSfx): HTMLAudioElement {
  const definition = SFX_FILES[kind];
  const pool = sfxPool[kind] ?? (sfxPool[kind] = []);
  let audio = pool.find((candidate) => candidate.paused || candidate.ended);
  if (!audio && pool.length < SFX_POOL_SIZE) {
    audio = new Audio(`${AUDIO_ROOT}${definition.file}`);
    audio.preload = 'auto';
    pool.push(audio);
  }
  audio ??= pool[0];
  audio.pause();
  audio.currentTime = 0;
  audio.volume = definition.volume;
  return audio;
}

function playFileSfx(kind: FileSfx, fallback: () => void): void {
  if (_muted) return;
  const audio = getSfxAudio(kind);
  const playAttempt = audio.play();
  if (playAttempt) void playAttempt.catch(fallback);
}

function synthCorrect(): void {
  const context = ctx(), start = context.currentTime, destination = context.destination;
  tone(523.25, start, .12, .35, 'sine', destination);
  tone(659.25, start + .10, .12, .35, 'sine', destination);
  tone(783.99, start + .22, .28, .38, 'sine', destination);
}

function synthWrong(): void {
  const context = ctx(), start = context.currentTime, destination = context.destination;
  tone(280, start, .12, .25, 'sawtooth', destination);
  tone(210, start + .11, .20, .22, 'sawtooth', destination);
}

export function sfxCorrect(): void {
  playFileSfx('correct', synthCorrect);
}

export function sfxWrong(): void {
  playFileSfx('wrong', synthWrong);
}

export function sfxCountdownTick(): void {
  if (_muted) return;
  tone(880, ctx().currentTime, .07, .22, 'square', ctx().destination);
}

export function sfxCountdownGo(): void {
  if (_muted) return;
  const context = ctx(), start = context.currentTime, destination = context.destination;
  tone(523.25, start, .12, .35, 'sine', destination);
  tone(659.25, start + .10, .12, .35, 'sine', destination);
  tone(783.99, start + .20, .12, .35, 'sine', destination);
  tone(1046.50, start + .32, .38, .48, 'sine', destination);
}

export function sfxLevelComplete(): void {
  const bgm = _bgmAudio;
  const previousVolume = bgm?.volume ?? 0;
  if (bgm) bgm.volume = previousVolume * 0.25;

  const restoreBgm = () => {
    if (bgm && bgm === _bgmAudio && _bgmRunning) {
      fadeIn(bgm, BGM_TRACKS[_bgmScene].volume, 700);
    }
  };

  if (_muted) return;
  const audio = getSfxAudio('complete');
  audio.onended = restoreBgm;
  audio.onerror = restoreBgm;
  const playAttempt = audio.play();
  if (playAttempt) {
    void playAttempt.catch(() => {
      synthCorrect();
      restoreBgm();
    });
  }
}

export function sfxCardFlip(): void {
  playFileSfx('card-flip', () => {
    const context = ctx(), start = context.currentTime, destination = context.destination;
    tone(900, start, .03, .12, 'sine', destination);
    tone(600, start + .03, .05, .08, 'sine', destination);
  });
}

export function sfxButtonTap(): void {
  playFileSfx('button-tap', () => {
    tone(650, ctx().currentTime, .05, .10, 'sine', ctx().destination);
  });
}
