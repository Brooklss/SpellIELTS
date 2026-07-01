import { openDB } from 'idb';

const DB_NAME = 'spellielts';
const DB_VERSION = 1;

let dbPromise;

export function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Word progress store
        if (!db.objectStoreNames.contains('userProgress')) {
          const progressStore = db.createObjectStore('userProgress', { keyPath: 'wordId' });
          progressStore.createIndex('status', 'status');
          progressStore.createIndex('nextReview', 'nextReview');
          progressStore.createIndex('failCount', 'failCount');
        }

        // Session history store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionStore.createIndex('date', 'date');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ── User Progress ──────────────────────────────────────────────

export async function getWordProgress(wordId) {
  const db = await getDB();
  if (!db) return null;
  return db.get('userProgress', wordId);
}

export async function getAllProgress() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('userProgress');
}

export async function upsertWordProgress(progress) {
  const db = await getDB();
  if (!db) return;
  return db.put('userProgress', progress);
}

export async function getWeakWords(limit = 50) {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('userProgress');
  return all
    .filter(p => p.failCount > 0 && p.status !== 'mastered')
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, limit);
}

export async function getDueWords() {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('userProgress');
  const now = Date.now();
  return all.filter(p => p.status !== 'mastered' && p.nextReview && p.nextReview <= now);
}

export async function getMasteredWords() {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('userProgress');
  return all.filter(p => p.status === 'mastered');
}

// ── Sessions ───────────────────────────────────────────────────

export async function saveSession(session) {
  const db = await getDB();
  if (!db) return;
  return db.add('sessions', { ...session, date: Date.now() });
}

export async function getRecentSessions(limit = 14) {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('sessions');
  return all.sort((a, b) => b.date - a.date).slice(0, limit);
}

// ── Settings ───────────────────────────────────────────────────

export async function getSetting(key) {
  const db = await getDB();
  if (!db) return null;
  const row = await db.get('settings', key);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  const db = await getDB();
  if (!db) return;
  return db.put('settings', { key, value });
}

// ── Stats summary ──────────────────────────────────────────────

export async function getStats() {
  const db = await getDB();
  if (!db) return { total: 0, mastered: 0, learning: 0, dueToday: 0, totalSessions: 0, accuracy: 0 };

  const [all, sessions] = await Promise.all([
    db.getAll('userProgress'),
    db.getAll('sessions'),
  ]);

  const now = Date.now();
  const mastered = all.filter(p => p.status === 'mastered').length;
  const learning = all.filter(p => p.status !== 'mastered' && p.failCount > 0).length;
  const dueToday = all.filter(p => p.status !== 'mastered' && p.nextReview && p.nextReview <= now).length;

  let totalAttempts = 0, totalCorrect = 0;
  sessions.forEach(s => {
    totalAttempts += s.wordsAttempted || 0;
    totalCorrect += s.wordsCorrect || 0;
  });

  return {
    total: all.length,
    mastered,
    learning,
    dueToday,
    totalSessions: sessions.length,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
  };
}

export async function resetAllProgress() {
  const db = await getDB();
  if (!db) return;
  await db.clear('userProgress');
  await db.clear('sessions');
}
