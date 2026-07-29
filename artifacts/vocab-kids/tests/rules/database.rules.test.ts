import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, remove, set, update } from 'firebase/database';

let testEnv: RulesTestEnvironment;
const projectId = 'demo-word-wiz-kids';
const pin = '1234';
const now = Date.now();

const room = {
  pin,
  hostUid: 'host-1',
  hostName: '老師',
  category: '其他',
  status: 'waiting',
  currentQuestionIndex: 0,
  currentCorrectIndex: 0,
  questionStartedAt: 0,
  questionDurationMs: 15_000,
  questions: [{ word: { id: 'w1', english: 'ball', chinese: '球', phonetic: '', category: '其他' }, options: [], correctIndex: 0, direction: 'en_to_zh' }],
  createdTime: now,
  expiresAt: now + 60_000,
  players: {
    'player-1': { id: 'player-1', nickname: '小英', avatar: 1, score: 0, joinedAt: now, online: true, lastSeenAt: now },
  },
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    database: { rules: readFileSync(path.resolve(import.meta.dirname, '../../../../database.rules.json'), 'utf8') },
  });
});
beforeEach(async () => {
  await testEnv.clearDatabase();
  await testEnv.withSecurityRulesDisabled((context) => set(ref(context.database(), `arena_rooms/${pin}`), room));
});
afterAll(async () => testEnv.cleanup());

describe('arena presence rules', () => {
  it('allows a clean player join with required presence fields', async () => {
    const db = testEnv.authenticatedContext('player-2').database();
    await assertSucceeds(set(ref(db, `arena_rooms/${pin}/players/player-2`), {
      id: 'player-2', nickname: '小雄', avatar: 2, score: 0, joinedAt: now, online: true, lastSeenAt: now,
    }));
  });

  it('rejects a new player that preloads answer or exclusion fields', async () => {
    const db = testEnv.authenticatedContext('player-2').database();
    await assertFails(set(ref(db, `arena_rooms/${pin}/players/player-2`), {
      id: 'player-2', nickname: '小雄', avatar: 2, score: 0, joinedAt: now, online: true, lastSeenAt: now,
      answerQuestionIndex: 0, currentAnswer: 0, isCorrect: true, answeredAt: now, excludedQuestionIndex: 0,
    }));
  });

  it('allows a player to update only their own presence fields', async () => {
    const db = testEnv.authenticatedContext('player-1').database();
    await assertSucceeds(update(ref(db, `arena_rooms/${pin}/players/player-1`), { online: false, lastSeenAt: now + 1 }));
  });

  it('rejects score tampering disguised as a presence update', async () => {
    const db = testEnv.authenticatedContext('player-1').database();
    await assertFails(update(ref(db, `arena_rooms/${pin}/players/player-1`), { online: false, lastSeenAt: now + 1, score: 9999 }));
  });

  it('rejects unlisted schema fields', async () => {
    const db = testEnv.authenticatedContext('player-1').database();
    await assertFails(update(ref(db, `arena_rooms/${pin}/players/player-1`), { randomHackerField: 'x' }));
  });

  it('allows the host to skip or remove a disconnected player', async () => {
    const db = testEnv.authenticatedContext('host-1').database();
    await assertSucceeds(update(ref(db, `arena_rooms/${pin}/players/player-1`), { excludedQuestionIndex: 0 }));
    await assertSucceeds(remove(ref(db, `arena_rooms/${pin}/players/player-1`)));
  });

  it('does not let another player alter the roster', async () => {
    const db = testEnv.authenticatedContext('intruder').database();
    await assertFails(remove(ref(db, `arena_rooms/${pin}/players/player-1`)));
  });
});
