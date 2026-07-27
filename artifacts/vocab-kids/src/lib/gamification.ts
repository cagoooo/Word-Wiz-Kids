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
  gamesPlayed: number;
  perfectGames: number;
  highestScore: number;
  badges: string[]; // Badge IDs
}

const STORAGE_KEY = 'vocab-gamification-stats';

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
  return now.toISOString().split('T')[0];
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

export function getUserStats(): UserStats {
  if (typeof window === 'undefined') {
    return {
      exp: 0,
      level: 1,
      streak: 1,
      lastLoginDate: getTodayString(),
      wordsLearned: 0,
      gamesPlayed: 0,
      perfectGames: 0,
      highestScore: 0,
      badges: ['first_step'],
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initStats: UserStats = {
      exp: 50,
      level: 1,
      streak: 1,
      lastLoginDate: getTodayString(),
      wordsLearned: 0,
      gamesPlayed: 0,
      perfectGames: 0,
      highestScore: 0,
      badges: ['first_step'],
    };
    saveUserStats(initStats);
    return initStats;
  }

  try {
    const stats: UserStats = JSON.parse(raw);
    const today = getTodayString();

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
      saveUserStats(stats);
    }

    return stats;
  } catch (e) {
    console.error('Failed to parse user stats:', e);
    return {
      exp: 50,
      level: 1,
      streak: 1,
      lastLoginDate: getTodayString(),
      wordsLearned: 0,
      gamesPlayed: 0,
      perfectGames: 0,
      highestScore: 0,
      badges: ['first_step'],
    };
  }
}

export function saveUserStats(stats: UserStats): void {
  const { level } = calculateLevel(stats.exp);
  stats.level = level;

  // Check badges
  if (!stats.badges.includes('first_step')) stats.badges.push('first_step');
  if (stats.streak >= 3 && !stats.badges.includes('streak_3')) stats.badges.push('streak_3');
  if (stats.streak >= 7 && !stats.badges.includes('streak_7')) stats.badges.push('streak_7');
  if (stats.wordsLearned >= 10 && !stats.badges.includes('speller_10')) stats.badges.push('speller_10');
  if (stats.wordsLearned >= 50 && !stats.badges.includes('speller_50')) stats.badges.push('speller_50');
  if (stats.highestScore >= 500 && !stats.badges.includes('game_champ')) stats.badges.push('game_champ');
  if (stats.perfectGames >= 1 && !stats.badges.includes('perfect_100')) stats.badges.push('perfect_100');
  if (stats.level >= 5 && !stats.badges.includes('level_5')) stats.badges.push('level_5');

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function addExp(amount: number): UserStats {
  const stats = getUserStats();
  stats.exp += amount;
  saveUserStats(stats);
  return stats;
}
