import React, { useEffect, useState } from 'react';
import { Award, Flame, Zap } from 'lucide-react';
import { calculateLevel, GAMIFICATION_UPDATED_EVENT, getUserStats } from '@/lib/gamification';
import { BadgeGridModal } from './BadgeGrid';

export const UserExpBar: React.FC = () => {
  const [showBadges, setShowBadges] = useState(false);
  const [stats, setStats] = useState(getUserStats);

  useEffect(() => {
    const refreshStats = () => setStats(getUserStats());
    window.addEventListener(GAMIFICATION_UPDATED_EVENT, refreshStats);
    return () => window.removeEventListener(GAMIFICATION_UPDATED_EVENT, refreshStats);
  }, []);

  const { level, currentExp, maxExp } = calculateLevel(stats.exp);
  const percent = Math.min(100, Math.round((currentExp / maxExp) * 100));

  return (
    <>
      <div className="w-full bg-card/80 backdrop-blur-md border border-border/80 rounded-2xl p-3.5 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Level & EXP */}
        <div className="flex items-center gap-3.5 flex-1 min-w-[240px]">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-purple-500/20">
              {level}
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-amber-300 font-extrabold border border-amber-400/40">
              LV
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-foreground flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                經驗值 (EXP)
              </span>
              <span className="text-muted-foreground font-mono">
                {currentExp} / {maxExp} ({percent}%)
              </span>
            </div>

            <div className="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Streak & Badges button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Streak badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs"
            title="連續每日登入學習打卡"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{stats.streak} 天打卡</span>
          </div>

          {/* Badges button */}
          <button
            onClick={() => setShowBadges(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>成就館 ({stats.badges.length})</span>
          </button>
        </div>
      </div>

      <BadgeGridModal isOpen={showBadges} onClose={() => setShowBadges(false)} />
    </>
  );
};
