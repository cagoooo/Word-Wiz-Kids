/**
 * Firestore data layer.
 * All functions check isFirebaseConfigured and are no-ops when offline.
 *
 * Data structure:
 *   scores/{auto-id}          — individual game sessions
 *   studentProgress/{studentId} — aggregated stats per student (for leaderboard)
 */
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScoreEntry {
  studentId: string;
  nickname: string;
  avatar: number;
  score: number;
  category: string;
  difficulty: string;
  correctCount: number;
  totalQuestions: number;
  timestamp: unknown; // Firestore Timestamp | null
}

export interface StudentProgress {
  studentId: string;
  nickname: string;
  avatar: number;
  totalScore: number;
  gamesPlayed: number;
  correctTotal: number;
  questionsTotal: number;
  lastPlayedAt: unknown; // Firestore Timestamp | null
}

export interface LeaderboardEntry {
  studentId: string;
  nickname: string;
  avatar: number;
  totalScore: number;
  gamesPlayed: number;
  rank: number;
}

// ── Score submission ──────────────────────────────────────────────────────────

export async function submitScore(params: {
  studentId: string;
  nickname: string;
  avatar: number;
  score: number;
  category: string;
  difficulty: string;
  correctCount: number;
  totalQuestions: number;
}): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  const { studentId, nickname, avatar, score, category, difficulty, correctCount, totalQuestions } = params;

  // Write individual game session
  await addDoc(collection(db, 'scores'), {
    studentId,
    nickname,
    avatar,
    score,
    category,
    difficulty,
    correctCount,
    totalQuestions,
    timestamp: serverTimestamp(),
  });

  // Upsert aggregated progress (merge so existing fields are preserved)
  const progressRef = doc(db, 'studentProgress', studentId);
  await setDoc(
    progressRef,
    {
      studentId,
      nickname,
      avatar,
      totalScore: increment(score),
      gamesPlayed: increment(1),
      correctTotal: increment(correctCount),
      questionsTotal: increment(totalQuestions),
      lastPlayedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ── Real-time leaderboard ─────────────────────────────────────────────────────

export function subscribeLeaderboard(
  callback: (entries: LeaderboardEntry[]) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'studentProgress'),
    orderBy('totalScore', 'desc'),
    limit(10),
  );

  return onSnapshot(q, (snap) => {
    const entries: LeaderboardEntry[] = snap.docs.map((docSnap, idx) => {
      const d = docSnap.data() as StudentProgress;
      return {
        studentId: d.studentId,
        nickname: d.nickname,
        avatar: d.avatar,
        totalScore: d.totalScore ?? 0,
        gamesPlayed: d.gamesPlayed ?? 0,
        rank: idx + 1,
      };
    });
    callback(entries);
  });
}

// ── Student's own progress ────────────────────────────────────────────────────

export function subscribeStudentProgress(
  studentId: string,
  callback: (progress: StudentProgress | null) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    callback(null);
    return () => {};
  }

  const ref = doc(db, 'studentProgress', studentId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as StudentProgress);
    } else {
      callback(null);
    }
  });
}

// ── Admin: all student progress ───────────────────────────────────────────────

export async function getAllStudentProgress(): Promise<StudentProgress[]> {
  if (!isFirebaseConfigured || !db) return [];

  const q = query(
    collection(db, 'studentProgress'),
    orderBy('totalScore', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as StudentProgress);
}
