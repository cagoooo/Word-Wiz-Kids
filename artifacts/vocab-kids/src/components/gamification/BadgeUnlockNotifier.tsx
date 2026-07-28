import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  consumePendingBadgeUnlocks,
  GAMIFICATION_UPDATED_EVENT,
} from '@/lib/gamification';

export function BadgeUnlockNotifier() {
  useEffect(() => {
    const showPendingBadges = () => {
      const badges = consumePendingBadgeUnlocks();
      if (badges.length === 0) return;
      toast({
        title: '🎉 解鎖新成就！',
        description: badges.map((badge) => `${badge.icon} ${badge.name}`).join('、'),
      });
    };

    showPendingBadges();
    window.addEventListener(GAMIFICATION_UPDATED_EVENT, showPendingBadges);
    return () => window.removeEventListener(GAMIFICATION_UPDATED_EVENT, showPendingBadges);
  }, []);

  return null;
}
