import { describe, expect, it } from 'vitest';
import { calculateArenaAnswerPoints, getArenaTimeState } from '@/lib/arenaScoring';
import { getArenaQuestionRoster, isArenaPlayerActive } from '@/lib/arenaPresence';
import { isNewerBuildVersion, parseBuildVersion } from '@/lib/pwaVersion';
import { getEligibleBadgeIds, type UserStats } from '@/lib/gamification';

describe('arena timing and presence', () => {
  it('awards more points for faster correct answers', () => {
    expect(calculateArenaAnswerPoints(1_000, 15_000, 2_000)).toBeGreaterThan(calculateArenaAnswerPoints(1_000, 15_000, 12_000));
    expect(getArenaTimeState(1_000, 15_000, 20_000).remainingMs).toBe(0);
  });

  it('keeps a disconnected player during grace, then excludes them', () => {
    const player = { id: 'p1', online: false, lastSeenAt: 1_000 };
    expect(isArenaPlayerActive(player, 5_000)).toBe(true);
    expect(isArenaPlayerActive(player, 12_000)).toBe(false);
  });

  it('ends a question when every eligible player answered', () => {
    const roster = getArenaQuestionRoster([
      { id: 'a', online: true, answerQuestionIndex: 2 },
      { id: 'b', online: false, lastSeenAt: 0 },
      { id: 'c', online: true, excludedQuestionIndex: 2 },
    ], 2, 20_000);
    expect(roster.eligiblePlayers.map((player) => player.id)).toEqual(['a']);
    expect(roster.allAnswered).toBe(true);
  });
});

describe('PWA build versions', () => {
  it('only accepts sortable newer releases', () => {
    expect(parseBuildVersion('52-abcdef123456')).toEqual({ sequence: 52, hash: 'abcdef123456' });
    expect(isNewerBuildVersion('53-bbbbbbb', '52-aaaaaaa')).toBe(true);
    expect(isNewerBuildVersion('51-bbbbbbb', '52-aaaaaaa')).toBe(false);
    expect(isNewerBuildVersion('broken', '52-aaaaaaa')).toBe(false);
  });
});

describe('achievement unlock conditions', () => {
  it('unlocks every documented badge when all thresholds are reached', () => {
    const stats: UserStats = {
      exp: 2_000,
      level: 5,
      streak: 7,
      lastLoginDate: '2026-07-29',
      wordsLearned: 50,
      learnedWordIds: Array.from({ length: 50 }, (_, index) => `w${index}`),
      gamesPlayed: 1,
      perfectGames: 1,
      highestScore: 500,
      badges: [],
      pendingBadges: [],
    };
    expect(getEligibleBadgeIds(stats)).toHaveLength(8);
  });
});
