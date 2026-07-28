/**
 * Gamification system logic (EXP, Levels, Streaks, Badges)
 */

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserStats {
  exp: number;
  level: number;
  streak: number;
  lastLoginDate: string; // YYYY-MM-DD
  wordsLearned: number;
  learnedWordIds: string[];
  gamesPlayed: number;
  perfectGames: number;
  highestScore: number;
  badges: string[]; // Badge IDs
  pendingBadges: string[];
}

const STORAGE_KEY = 'vocab-gamification-stats';
export const GAMIFICATION_UPDATED_EVENT = 'vocab-gamification-updated';

export const ALL_BADGES: Omit<Badge, 'unlocked'>[] = [
  { id: 'first_step', name: '初露鋒芒', desc: '完成第一次單字學習或測驗', icon: '🚀' },
  { id: 'streak_3', name: '持之以恆', desc: '連續登入學習打卡 3 天', icon: '🔥' },
  { id: 'streak_7', name: '習慣成自然', desc: '連續登入學習打卡 7 天', icon: '⚡' },
  { id: 'speller_10', name: '單字學徒', desc: '累積學會 10 個英文單字', icon: '📚' },
  { id: 'speller_50', name: '單字大師', desc: '累積學會 50 個英文單字', icon: '👑' },
  { id: 'game_champ', name: '小學霸', desc: '單場遊戲得分突破 500 分', icon: '🏆' },
  { id: 'perfect_100', name: '滿分戰神', desc: '在遊戲測驗中獲得 100% 完美滿分', icon: '💯' },
  { id: 'level_5', name: '魔法學者', desc: '等級提升至 Level 5', icon: '🌟' },
];

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateLevel(exp: number): { level: number; currentExp: number; maxExp: number } {
  // Level formula: Level N requires N * 100 EXP
  let level = 1;
  let req = 100;
  let remainingExp = exp;

  while (remainingExp >= req) {
    remainingExp -= req;
    level++;
    req = level * 100;
  }

  return { level, currentExp: remainingExp, maxExp: req };
}

function createDefaultStats(exp = 50): UserStats {
  return {
    exp,
    level: 1,
    streak: 1,
    lastLoginDate: getTodayString(),
    wordsLearned: 0,
    learnedWordIds: [],
    gamesPlayed: 0,
    perfectGames: 0,
    highestScore: 0,
    badges: [],
    pendingBadges: [],
  };
}

function normalizeStats(value: Partial<UserStats>): UserStats {
  const defaults = createDefaultStats();
  const knownBadgeIds = new Set(ALL_BADGES.map((badge) => badge.id));
  return {
    ...defaults,
    ...value,
    exp: Number.isFinite(value.exp) ? Math.max(0, Number(value.exp)) : defaults.exp,
    streak: Number.isFinite(value.streak) ? Math.max(1, Number(value.streak)) : 1,
    wordsLearned: Number.isFinite(value.wordsLearned) ? Math.max(0, Number(value.wordsLearned)) : 0,
    gamesPlayed: Number.isFinite(value.gamesPlayed) ? Math.max(0, Number(value.gamesPlayed)) : 0,
    perfectGames: Number.isFinite(value.perfectGames) ? Math.max(0, Number(value.perfectGames)) : 0,
    highestScore: Number.isFinite(value.highestScore) ? Math.max(0, Number(value.highestScore)) : 0,
    learnedWordIds: Array.isArray(value.learnedWordIds)
      ? [...new Set(value.learnedWordIds.filter((id): id is string => typeof id === 'string' && id.length > 0))]
      : [],
    badges: Array.isArray(value.badges)
      ? [...new Set(value.badges.filter((id): id is string => typeof id === 'string' && knownBadgeIds.has(id)))]
      : [],
    pendingBadges: Array.isArray(value.pendingBadges)
      ? [...new Set(value.pendingBadges.filter((id): id is string => typeof id === 'string' && knownBadgeIds.has(id)))]
      : [],
  };
}

export function getEligibleBadgeIds(stats: UserStats): string[] {
  const eligible: string[] = [];
  if (stats.wordsLearned >= 1 || stats.gamesPlayed >= 1) eligible.push('first_step');
  if (stats.streak >= 3) eligible.push('streak_3');
  if (stats.streak >= 7) eligible.push('streak_7');
  if (stats.wordsLearned >= 10) eligible.push('speller_10');
  if (stats.wordsLearned >= 50) eligible.push('speller_50');
  if (stats.highestScore >= 500) eligible.push('game_champ');
  if (stats.perfectGames >= 1) eligible.push('perfect_100');
  if (stats.level >= 5) eligible.push('level_5');
  return eligible;
}

export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return createDefaultStats(0);

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initStats = createDefaultStats();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initStats));
    return initStats;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserStats>;
    const stats = normalizeStats(parsed);
    const today = getTodayString();
    let shouldSave = JSON.stringify(stats) !== JSON.stringify(parsed);

    // Check streak
    if (stats.lastLoginDate !== today) {
      const lastDate = new Date(stats.lastLoginDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        stats.streak += 1;
      } else if (diffDays > 1) {
        stats.streak = 1;
      }
      stats.lastLoginDate = today;
      shouldSave = true;
    }

    const { level } = calculateLevel(stats.exp);
    const hasNewBadge = getEligibleBadgeIds({ ...stats, level }).some((id) => !stats.badges.includes(id));
    return shouldSave || stats.level !== level || hasNewBadge ? saveUserStats(stats) : stats;
  } catch (e) {
    console.error('Failed to parse user stats:', e);
    const fallback = createDefaultStats();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export function saveUserStats(stats: UserStats): UserStats {
  const normalized = normalizeStats(stats);
  Object.assign(stats, normalized);
  const { level } = calculateLevel(stats.exp);
  stats.level = level;

  const newBadgeIds = getEligibleBadgeIds(stats).filter((id) => !stats.badges.includes(id));
  stats.badges.push(...newBadgeIds);
  stats.pendingBadges = [...new Set([...stats.pendingBadges, ...newBadgeIds])];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GAMIFICATION_UPDATED_EVENT, {
      detail: { stats, newBadgeIds },
    }));
  }
  return stats;
}

export function addExp(amount: number): UserStats {
  const stats = getUserStats();
  stats.exp += Math.max(0, amount);
  return saveUserStats(stats);
}

export function recordWordLearned(wordId: string): UserStats {
  const stats = getUserStats();
  if (!wordId || stats.learnedWordIds.includes(wordId)) return stats;
  stats.learnedWordIds.push(wordId);
  stats.wordsLearned += 1;
  stats.exp += 2;
  return saveUserStats(stats);
}

interface GameResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  exp: number;
}

export function recordGameResult(result: GameResult): UserStats {
  const stats = getUserStats();
  stats.gamesPlayed += 1;
  stats.highestScore = Math.max(stats.highestScore, Math.max(0, result.score));
  if (result.totalQuestions > 0 && result.correctCount === result.totalQuestions) {
    stats.perfectGames += 1;
  }
  stats.exp += Math.max(0, result.exp);
  return saveUserStats(stats);
}

export function consumePendingBadgeUnlocks(): Array<Omit<Badge, 'unlocked'>> {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const stats = normalizeStats(JSON.parse(raw) as Partial<UserStats>);
    const pendingIds = [...stats.pendingBadges];
    if (pendingIds.length === 0) return [];
    stats.pendingBadges = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    return pendingIds
      .map((id) => ALL_BADGES.find((badge) => badge.id === id))
      .filter((badge): badge is Omit<Badge, 'unlocked'> => Boolean(badge));
  } catch {
    return [];
  }
}
