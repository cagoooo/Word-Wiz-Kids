export const ARENA_OFFLINE_GRACE_MS = 10_000;

export interface ArenaPresencePlayer {
  id: string;
  online?: boolean;
  lastSeenAt?: number;
  answerQuestionIndex?: number;
  excludedQuestionIndex?: number;
}

export function isArenaPlayerActive(
  player: ArenaPresencePlayer,
  now = Date.now(),
  graceMs = ARENA_OFFLINE_GRACE_MS,
): boolean {
  // Rooms created before presence support have no online field; keep them eligible.
  if (player.online !== false) return true;
  return typeof player.lastSeenAt === 'number' && now - player.lastSeenAt < graceMs;
}

export function getArenaQuestionRoster(
  players: ArenaPresencePlayer[],
  questionIndex: number,
  now = Date.now(),
  graceMs = ARENA_OFFLINE_GRACE_MS,
) {
  const disconnectedPlayers = players.filter((player) => player.online === false);
  const eligiblePlayers = players.filter(
    (player) => player.excludedQuestionIndex !== questionIndex && isArenaPlayerActive(player, now, graceMs),
  );
  const answeredPlayers = eligiblePlayers.filter((player) => player.answerQuestionIndex === questionIndex);
  return {
    disconnectedPlayers,
    eligiblePlayers,
    answeredPlayers,
    allAnswered: eligiblePlayers.length > 0 && answeredPlayers.length === eligiblePlayers.length,
  };
}
