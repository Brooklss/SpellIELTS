import {
  getFirestoreDB,
} from './firebase';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

// ── Helpers ────────────────────────────────────────────────────

function progressRef(uid, wordId) {
  return doc(getFirestoreDB(), 'users', uid, 'progress', wordId);
}

function progressCol(uid) {
  return collection(getFirestoreDB(), 'users', uid, 'progress');
}

function sessionsCol(uid) {
  return collection(getFirestoreDB(), 'users', uid, 'sessions');
}

function settingsRef(uid) {
  return doc(getFirestoreDB(), 'users', uid, 'settings', 'main');
}

// ── Word Progress ──────────────────────────────────────────────

export async function cloudGetWordProgress(uid, wordId) {
  const snap = await getDoc(progressRef(uid, wordId));
  return snap.exists() ? snap.data() : null;
}

export async function cloudGetAllProgress(uid) {
  const snap = await getDocs(progressCol(uid));
  return snap.docs.map((d) => d.data());
}

export async function cloudUpsertWordProgress(uid, progress) {
  await setDoc(progressRef(uid, progress.wordId), progress, { merge: true });
}

/**
 * Batch-upsert many progress records at once (used during sync-on-sign-in).
 * Firestore batch limit is 500 writes — we chunk automatically.
 */
export async function cloudBatchUpsertProgress(uid, progressArray) {
  const db = getFirestoreDB();
  const CHUNK = 400;
  for (let i = 0; i < progressArray.length; i += CHUNK) {
    const batch = writeBatch(db);
    progressArray.slice(i, i + CHUNK).forEach((p) => {
      batch.set(doc(db, 'users', uid, 'progress', p.wordId), p, { merge: true });
    });
    await batch.commit();
  }
}

export async function cloudGetWeakWords(uid, limitN = 50) {
  const all = await cloudGetAllProgress(uid);
  return all
    .filter((p) => p.failCount > 0 && p.status !== 'mastered')
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, limitN);
}

export async function cloudGetDueWords(uid) {
  const all = await cloudGetAllProgress(uid);
  const now = Date.now();
  return all.filter(
    (p) => p.status !== 'mastered' && p.nextReview && p.nextReview <= now
  );
}

export async function cloudGetMasteredWords(uid) {
  const all = await cloudGetAllProgress(uid);
  return all.filter((p) => p.status === 'mastered');
}

// ── Sessions ───────────────────────────────────────────────────

export async function cloudSaveSession(uid, session) {
  await addDoc(sessionsCol(uid), {
    ...session,
    date: session.date ?? Date.now(),
    createdAt: serverTimestamp(),
  });
}

export async function cloudGetRecentSessions(uid, limitN = 14) {
  const q = query(sessionsCol(uid), orderBy('date', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Settings ───────────────────────────────────────────────────

export async function cloudGetSettings(uid) {
  const snap = await getDoc(settingsRef(uid));
  return snap.exists() ? snap.data() : {};
}

export async function cloudSetSetting(uid, key, value) {
  await setDoc(settingsRef(uid), { [key]: value }, { merge: true });
}

// ── Stats ──────────────────────────────────────────────────────

export async function cloudGetStats(uid) {
  const [all, sessions] = await Promise.all([
    cloudGetAllProgress(uid),
    cloudGetRecentSessions(uid, 1000),
  ]);

  const now = Date.now();
  const mastered = all.filter((p) => p.status === 'mastered').length;
  const learning = all.filter(
    (p) => p.status !== 'mastered' && p.failCount > 0
  ).length;
  const dueToday = all.filter(
    (p) => p.status !== 'mastered' && p.nextReview && p.nextReview <= now
  ).length;

  let totalAttempts = 0,
    totalCorrect = 0;
  sessions.forEach((s) => {
    totalAttempts += s.wordsAttempted || 0;
    totalCorrect += s.wordsCorrect || 0;
  });

  return {
    total: all.length,
    mastered,
    learning,
    dueToday,
    totalSessions: sessions.length,
    accuracy:
      totalAttempts > 0
        ? Math.round((totalCorrect / totalAttempts) * 100)
        : 0,
  };
}

// ── Delete all user data ───────────────────────────────────────

export async function cloudDeleteAllUserData(uid) {
  const db = getFirestoreDB();
  const [progressSnap, sessionsSnap] = await Promise.all([
    getDocs(progressCol(uid)),
    getDocs(sessionsCol(uid)),
  ]);

  const batch = writeBatch(db);
  progressSnap.docs.forEach((d) => batch.delete(d.ref));
  sessionsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(settingsRef(uid));
  await batch.commit();
}
