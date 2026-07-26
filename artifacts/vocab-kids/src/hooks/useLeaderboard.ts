/**
 * Real-time leaderboard hook.
 * Falls back to an empty list when Firebase is not configured.
 */
import { useState, useEffect } from 'react';
import { subscribeLeaderboard, subscribeStudentProgress, type LeaderboardEntry, type StudentProgress } from '@/lib/firestore';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { entries, loading };
}

export function useStudentProgress(studentId: string | null) {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setProgress(null);
      setLoading(false);
      return;
    }
    const unsub = subscribeStudentProgress(studentId, (data) => {
      setProgress(data);
      setLoading(false);
    });
    return unsub;
  }, [studentId]);

  return { progress, loading };
}
