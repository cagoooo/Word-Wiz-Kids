import React from 'react';
import { Award, Lock, Sparkles, X } from 'lucide-react';
import { ALL_BADGES, getUserStats } from '@/lib/gamification';

interface BadgeGridProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeGridModal: React.FC<BadgeGridProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const stats = getUserStats();
  const unlockedCount = stats.badges.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-amber-400 to-purple-600 rounded-2xl text-white shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                成就殿堂
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {unlockedCount} / {ALL_BADGES.length} 已解鎖
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                努力練習單字與遊戲通關，解鎖屬於你的魔法徽章吧！
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-4 pr-1">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = stats.badges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-card to-primary/5 border-primary/30 shadow-md hover:scale-105'
                    : 'bg-muted/40 border-border opacity-60 grayscale'
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-inner relative ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-amber-300 via-pink-400 to-purple-500 text-white shadow-amber-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {badge.icon}
                  {!isUnlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white/80" />
                    </div>
                  )}
                </div>

                <h4 className="font-bold text-sm text-foreground mb-1">
                  {badge.name}
                </h4>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  {badge.desc}
                </p>

                {isUnlocked && (
                  <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 已解鎖
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
