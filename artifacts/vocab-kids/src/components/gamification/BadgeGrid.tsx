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
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl sm:p-6">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 mb-4 flex shrink-0 items-start justify-between gap-3 border-b border-border pb-4 sm:mb-5 sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
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
            aria-label="關閉成就殿堂"
            className="shrink-0 cursor-pointer rounded-xl bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges Grid */}
        <div className="grid min-h-0 flex-1 touch-pan-y grid-cols-2 gap-4 overflow-y-auto overscroll-contain pb-1 pr-1 [-webkit-overflow-scrolling:touch] sm:grid-cols-4">
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
