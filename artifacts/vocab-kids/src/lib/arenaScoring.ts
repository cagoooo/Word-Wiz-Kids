export const ARENA_BASE_POINTS = 100;
export const ARENA_MAX_SPEED_BONUS = 150;
export const ARENA_BONUS_PER_SECOND = 10;

export interface ArenaTimeState {
  remainingMs: number;
  remainingSeconds: number;
  progressPercent: number;
}

export function getArenaTimeState(startedAt: number, durationMs: number, now: number): ArenaTimeState {
  const safeDuration = Math.max(1, durationMs);
  const remainingMs = Math.max(0, Math.min(safeDuration, startedAt + safeDuration - now));
  return {
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    progressPercent: (remainingMs / safeDuration) * 100,
  };
}

/**
 * Keep this formula synchronized with database.rules.json:
 * arena_rooms/$pin/players/$playerId score validation.
 */
export function calculateArenaAnswerPoints(startedAt: number, durationMs: number, answeredAt: number): number {
  const { remainingSeconds } = getArenaTimeState(startedAt, durationMs, answeredAt);
  const speedBonus = Math.min(ARENA_MAX_SPEED_BONUS, remainingSeconds * ARENA_BONUS_PER_SECOND);
  return ARENA_BASE_POINTS + speedBonus;
}
