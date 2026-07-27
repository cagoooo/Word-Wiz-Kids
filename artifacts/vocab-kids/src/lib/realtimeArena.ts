/**
 * Realtime Kahoot-style Arena battle engine using Firebase Realtime Database or Local fallback.
 */

import { isFirebaseConfigured, rtdb } from '@/lib/firebase';
import { ref, set, onValue, push, update, get } from 'firebase/database';
import { generateQuestions, Question } from '@/lib/gameUtils';
import { MOCK_WORDS } from '@/data/words';

export interface PlayerState {
  id: string;
  nickname: string;
  avatar: number;
  score: number;
  currentAnswer?: number;
  isCorrect?: boolean;
}

export interface ArenaRoom {
  pin: string;
  hostName: string;
  category: string;
  status: 'waiting' | 'question' | 'leaderboard' | 'finished';
  currentQuestionIndex: number;
  questions: Question[];
  players: Record<string, PlayerState>;
  createdTime: number;
}

// Generate random 4-digit PIN
export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function createArenaRoom(category: string = '全部'): Promise<string> {
  const pin = generatePin();
  const questions = generateQuestions(MOCK_WORDS, 5, 'normal');

  const roomData: ArenaRoom = {
    pin,
    hostName: '老師',
    category,
    status: 'waiting',
    currentQuestionIndex: 0,
    questions,
    players: {},
    createdTime: Date.now(),
  };

  if (isFirebaseConfigured && rtdb) {
    const roomRef = ref(rtdb, `arena_rooms/${pin}`);
    await set(roomRef, roomData);
  } else {
    localStorage.setItem(`arena_room_${pin}`, JSON.stringify(roomData));
  }

  return pin;
}

export async function joinArenaRoom(pin: string, nickname: string, avatar: number = 1): Promise<string> {
  const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
  const player: PlayerState = {
    id: playerId,
    nickname,
    avatar,
    score: 0,
  };

  if (isFirebaseConfigured && rtdb) {
    const playerRef = ref(rtdb, `arena_rooms/${pin}/players/${playerId}`);
    await set(playerRef, player);
  } else {
    const raw = localStorage.getItem(`arena_room_${pin}`);
    if (!raw) throw new Error('找不到該對戰房間，請確認 PIN 碼！');
    const room: ArenaRoom = JSON.parse(raw);
    room.players[playerId] = player;
    localStorage.setItem(`arena_room_${pin}`, JSON.stringify(room));
  }

  return playerId;
}

export function subscribeArenaRoom(pin: string, onUpdate: (room: ArenaRoom | null) => void): () => void {
  if (isFirebaseConfigured && rtdb) {
    const roomRef = ref(rtdb, `arena_rooms/${pin}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      onUpdate(snapshot.val());
    });
    return () => unsubscribe();
  } else {
    const interval = setInterval(() => {
      const raw = localStorage.getItem(`arena_room_${pin}`);
      onUpdate(raw ? JSON.parse(raw) : null);
    }, 1000);
    return () => clearInterval(interval);
  }
}

export async function updateArenaStatus(pin: string, status: ArenaRoom['status'], questionIdx?: number): Promise<void> {
  const updates: Record<string, any> = { status };
  if (questionIdx !== undefined) {
    updates.currentQuestionIndex = questionIdx;
  }

  if (isFirebaseConfigured && rtdb) {
    const roomRef = ref(rtdb, `arena_rooms/${pin}`);
    await update(roomRef, updates);
  } else {
    const raw = localStorage.getItem(`arena_room_${pin}`);
    if (raw) {
      const room: ArenaRoom = JSON.parse(raw);
      room.status = status;
      if (questionIdx !== undefined) room.currentQuestionIndex = questionIdx;
      localStorage.setItem(`arena_room_${pin}`, JSON.stringify(room));
    }
  }
}

export async function submitArenaAnswer(
  pin: string,
  playerId: string,
  optionIndex: number,
  isCorrect: boolean,
  scoreGain: number
): Promise<void> {
  if (isFirebaseConfigured && rtdb) {
    const playerRef = ref(rtdb, `arena_rooms/${pin}/players/${playerId}`);
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const p: PlayerState = snapshot.val();
      await update(playerRef, {
        currentAnswer: optionIndex,
        isCorrect,
        score: p.score + (isCorrect ? scoreGain : 0),
      });
    }
  } else {
    const raw = localStorage.getItem(`arena_room_${pin}`);
    if (raw) {
      const room: ArenaRoom = JSON.parse(raw);
      const p = room.players[playerId];
      if (p) {
        p.currentAnswer = optionIndex;
        p.isCorrect = isCorrect;
        p.score += isCorrect ? scoreGain : 0;
        localStorage.setItem(`arena_room_${pin}`, JSON.stringify(room));
      }
    }
  }
}
