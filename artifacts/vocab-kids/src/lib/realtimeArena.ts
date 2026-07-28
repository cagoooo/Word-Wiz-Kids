/** Firebase Realtime Database classroom battle engine. */

import { ensureAnonymousAuth, isFirebaseConfigured, rtdb } from '@/lib/firebase';
import { get, onValue, ref, runTransaction, serverTimestamp, set, update } from 'firebase/database';
import { generateQuestions, type QuestionDirection } from '@/lib/gameUtils';
import type { Word } from '@/data/words';
import { calculateArenaAnswerPoints } from '@/lib/arenaScoring';

export interface ArenaWord {
  id: string;
  english: string;
  chinese: string;
  phonetic: string;
  category: string;
}

export interface ArenaQuestion {
  word: ArenaWord;
  options: ArenaWord[];
  correctIndex: number;
  direction: QuestionDirection;
}

export interface PlayerState {
  id: string;
  nickname: string;
  avatar: number;
  score: number;
  joinedAt: number;
  answerQuestionIndex?: number;
  currentAnswer?: number;
  isCorrect?: boolean;
  answeredAt?: number;
}

export interface ArenaRoom {
  pin: string;
  hostUid: string;
  hostName: string;
  category: string;
  status: 'waiting' | 'question' | 'leaderboard' | 'finished';
  currentQuestionIndex: number;
  currentCorrectIndex: number;
  questionStartedAt: number;
  questionDurationMs: number;
  questions: ArenaQuestion[];
  players?: Record<string, PlayerState>;
  createdTime: number;
  expiresAt: number;
}

const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
export const ARENA_QUESTION_DURATION_MS = 15_000;
export const ARENA_HOST_SESSION_KEY = 'word-wiz-arena-host-pin';
let arenaServerTimeOffsetMs = 0;

export function getArenaErrorMessage(error: unknown, fallback = '即時對戰服務暫時無法使用，請稍後再試。'): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('auth/operation-not-allowed')) {
    return 'Firebase 匿名登入尚未啟用，請先在 Authentication 後臺開啟匿名登入。';
  }
  if (message.includes('auth/requests-from-referer')) {
    return 'Firebase API Key 尚未允許目前的網站網域，請在 Google Cloud 金鑰限制中加入此網域。';
  }
  if (message.includes('PERMISSION_DENIED') || message.includes('permission-denied')) {
    return 'Firebase 對戰資料權限不足，請確認 Realtime Database 規則已部署。';
  }
  return message || fallback;
}

function requireArenaDatabase() {
  if (!isFirebaseConfigured || !rtdb) {
    throw new Error('即時對戰服務尚未完成設定，請稍後再試');
  }
  return rtdb;
}

function compactWord(word: Word): ArenaWord {
  return {
    id: word.id,
    english: word.english,
    chinese: word.chinese,
    phonetic: word.phonetic ?? '',
    category: word.category,
  };
}

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function createArenaRoom(
  category: string,
  words: Word[],
  questionCount = 5,
  hostName = '老師',
): Promise<string> {
  const database = requireArenaDatabase();
  const user = await ensureAnonymousAuth();
  const pool = category === '全部' ? words : words.filter((word) => word.category === category);
  if (pool.length < 4) throw new Error('這個主題至少需要 4 個單字才能進行對戰');

  const generated = generateQuestions(pool, Math.min(questionCount, pool.length), 'random');
  const questions: ArenaQuestion[] = generated.map((question) => ({
    word: compactWord(question.word),
    options: question.options.map(compactWord),
    correctIndex: question.correctIndex,
    direction: question.direction,
  }));
  if (questions.length === 0 || questions.some((question) => question.options.length !== 4)) {
    throw new Error('題目產生失敗，請確認單字庫內容後重試');
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const pin = generatePin();
    const roomRef = ref(database, `arena_rooms/${pin}`);
    if ((await get(roomRef)).exists()) continue;

    const now = Date.now();
    const roomData: ArenaRoom = {
      pin,
      hostUid: user.uid,
      hostName,
      category,
      status: 'waiting',
      currentQuestionIndex: 0,
      currentCorrectIndex: questions[0].correctIndex,
      questionStartedAt: 0,
      questionDurationMs: ARENA_QUESTION_DURATION_MS,
      questions,
      createdTime: now,
      expiresAt: now + ROOM_TTL_MS,
    };
    await set(roomRef, roomData);
    return pin;
  }

  throw new Error('目前房間較多，無法取得新的 PIN，請再試一次');
}

export async function joinArenaRoom(pin: string, nickname: string, avatar = 1): Promise<string> {
  const database = requireArenaDatabase();
  const user = await ensureAnonymousAuth();
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) throw new Error('請輸入 4 位數的房間 PIN');

  const roomRef = ref(database, `arena_rooms/${cleanPin}`);
  const roomSnapshot = await get(roomRef);
  if (!roomSnapshot.exists()) throw new Error('找不到這個對戰房間，請確認 PIN');
  const room = roomSnapshot.val() as ArenaRoom;
  if (room.expiresAt < Date.now()) throw new Error('這個對戰房間已過期');
  if (room.status !== 'waiting') throw new Error('這場對戰已經開始，無法再加入');
  if (!Array.isArray(room.questions) || room.questions.length === 0) throw new Error('房間沒有可用題目，請老師重新建立');

  const players = room.players ?? {};
  if (players[user.uid]) return user.uid;
  if (Object.keys(players).length >= 60) throw new Error('房間人數已滿');

  const player: PlayerState = {
    id: user.uid,
    nickname: nickname.trim().slice(0, 12),
    avatar: Math.max(1, Math.min(8, avatar)),
    score: 0,
    joinedAt: Date.now(),
  };
  await set(ref(database, `arena_rooms/${cleanPin}/players/${user.uid}`), player);
  return user.uid;
}

export function subscribeArenaRoom(
  pin: string,
  onUpdate: (room: ArenaRoom | null) => void,
  onError?: (error: Error) => void,
): () => void {
  let cancelled = false;
  let unsubscribe = () => {};

  void (async () => {
    try {
      const database = requireArenaDatabase();
      await ensureAnonymousAuth();
      if (cancelled) return;
      unsubscribe = onValue(
        ref(database, `arena_rooms/${pin}`),
        (snapshot) => onUpdate(snapshot.exists() ? snapshot.val() as ArenaRoom : null),
        (error) => onError?.(error),
      );
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('無法連線對戰房間'));
    }
  })();

  return () => {
    cancelled = true;
    unsubscribe();
  };
}

/** Synchronize countdowns and answer timestamps with Firebase server time. */
export function subscribeArenaServerTimeOffset(onUpdate: (offsetMs: number) => void): () => void {
  const database = requireArenaDatabase();
  return onValue(ref(database, '.info/serverTimeOffset'), (snapshot) => {
    const offset = typeof snapshot.val() === 'number' ? snapshot.val() : 0;
    arenaServerTimeOffsetMs = offset;
    onUpdate(offset);
  });
}

export async function startArenaQuestion(pin: string, questionIndex: number): Promise<void> {
  const database = requireArenaDatabase();
  await ensureAnonymousAuth();
  const questionSnapshot = await get(ref(database, `arena_rooms/${pin}/questions/${questionIndex}`));
  if (!questionSnapshot.exists()) throw new Error('找不到這一題，請重新建立房間');
  const question = questionSnapshot.val() as ArenaQuestion;
  await update(ref(database, `arena_rooms/${pin}`), {
    status: 'question',
    currentQuestionIndex: questionIndex,
    currentCorrectIndex: question.correctIndex,
    questionStartedAt: serverTimestamp(),
  });
}

export async function updateArenaStatus(pin: string, status: ArenaRoom['status']): Promise<void> {
  const database = requireArenaDatabase();
  await ensureAnonymousAuth();
  await update(ref(database, `arena_rooms/${pin}`), { status });
}

export async function submitArenaAnswer(
  pin: string,
  playerId: string,
  optionIndex: number,
): Promise<{ isCorrect: boolean; score: number; pointsAwarded: number }> {
  const database = requireArenaDatabase();
  const user = await ensureAnonymousAuth();
  if (user.uid !== playerId) throw new Error('玩家身分已失效，請重新加入');

  const roomSnapshot = await get(ref(database, `arena_rooms/${pin}`));
  if (!roomSnapshot.exists()) throw new Error('對戰房間已關閉');
  const room = roomSnapshot.val() as ArenaRoom;
  if (room.status !== 'question') throw new Error('目前不是作答時間');
  const question = room.questions[room.currentQuestionIndex];
  if (!question || optionIndex < 0 || optionIndex >= question.options.length) throw new Error('答案選項無效');
  const isCorrect = optionIndex === question.correctIndex;
  const answeredAt = Date.now() + arenaServerTimeOffsetMs;
  if (answeredAt > room.questionStartedAt + room.questionDurationMs) throw new Error('本題作答時間已結束');
  const pointsAwarded = isCorrect
    ? calculateArenaAnswerPoints(room.questionStartedAt, room.questionDurationMs, answeredAt)
    : 0;

  const result = await runTransaction(
    ref(database, `arena_rooms/${pin}/players/${playerId}`),
    (player: PlayerState | null) => {
      if (!player || player.answerQuestionIndex === room.currentQuestionIndex) return;
      return {
        ...player,
        answerQuestionIndex: room.currentQuestionIndex,
        currentAnswer: optionIndex,
        isCorrect,
        answeredAt,
        score: player.score + pointsAwarded,
      };
    },
  );

  if (!result.committed) throw new Error('這一題已經作答過了');
  const updatedPlayer = result.snapshot.val() as PlayerState;
  return { isCorrect, score: updatedPlayer.score, pointsAwarded };
}
