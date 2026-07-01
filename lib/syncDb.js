/**
 * lib/syncDb.js — Hybrid bridge
 *
 * All app components import from here instead of db.js directly.
 *
 * Strategy:
 *  - Writes go to IndexedDB immediately (fast/offline) AND to Firestore
 *    (fire-and-forget when signed in).
 *  - Reads prefer IndexedDB (already hydrated by syncOnSignIn), fall back
 *    to Firestore if local is empty and user is signed in.
 *  - syncOnSignIn(): merges local data → cloud on login.
 */

import * as local from './db';
import * as cloud from './cloudDb';

// ── Internal: get current user ─────────────────────────────────
// We lazily import auth to avoid circular deps.
let _getUser = null;
export function _setGetUser(fn) {
  _getUser = fn;
}

function uid() {
  return _getUser?.()?.uid ?? null;
}

// ── Sync status ────────────────────────────────────────────────
// Components can subscribe to know when a sync is in progress.
let _syncListeners = [];
let _syncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'error'

export function onSyncStatusChange(callback) {
  _syncListeners.push(callback);
  callback(_syncStatus); // emit current value immediately
  return () => {
    _syncListeners = _syncListeners.filter((l) => l !== callback);
  };
}

function setSyncStatus(status) {
  _syncStatus = status;
  _syncListeners.forEach((l) => l(status));
}

// ── Merge-on-sign-in ───────────────────────────────────────────

/**
 * Called by AuthContext after a successful sign-in.
 * Merges local IndexedDB data into Firestore, then loads Firestore data
 * back into IndexedDB so the app always reads locally.
 */
export async function syncOnSignIn(user) {
  if (!user) return;
  const id = user.uid;
  setSyncStatus('syncing');

  try {
    // 1. Read both sides
    const [localProgress, cloudProgress] = await Promise.all([
      local.getAllProgress(),
      cloud.cloudGetAllProgress(id),
    ]);

    // 2. Merge: for each wordId take the record with more total attempts
    const cloudMap = new Map(cloudProgress.map((p) => [p.wordId, p]));
    const localMap = new Map(localProgress.map((p) => [p.wordId, p]));

    const merged = [];
    const allIds = new Set([...cloudMap.keys(), ...localMap.keys()]);

    for (const wordId of allIds) {
      const l = localMap.get(wordId);
      const c = cloudMap.get(wordId);
      if (!l) { merged.push(c); continue; }
      if (!c) { merged.push(l); continue; }
      // Keep the record with more practice (higher total attempts)
      const lTotal = (l.failCount || 0) + (l.passCount || 0);
      const cTotal = (c.failCount || 0) + (c.passCount || 0);
      merged.push(lTotal >= cTotal ? l : c);
    }

    // 3. Write merged set to both stores
    await cloud.cloudBatchUpsertProgress(id, merged);
    await Promise.all(merged.map((p) => local.upsertWordProgress(p)));

    setSyncStatus('synced');
  } catch (err) {
    console.error('[syncDb] syncOnSignIn failed:', err);
    setSyncStatus('error');
  }
}

// ── Fire-and-forget cloud write helper ─────────────────────────
function cloudWrite(fn) {
  const id = uid();
  if (!id) return;
  fn(id).catch((err) => console.warn('[syncDb] cloud write failed:', err));
}

// ── Word Progress ──────────────────────────────────────────────

export async function getWordProgress(wordId) {
  return local.getWordProgress(wordId);
}

export async function getAllProgress() {
  return local.getAllProgress();
}

export async function upsertWordProgress(progress) {
  await local.upsertWordProgress(progress);
  cloudWrite((id) => cloud.cloudUpsertWordProgress(id, progress));
}

export async function getWeakWords(limit = 50) {
  return local.getWeakWords(limit);
}

export async function getDueWords() {
  return local.getDueWords();
}

export async function getMasteredWords() {
  return local.getMasteredWords();
}

// ── Sessions ───────────────────────────────────────────────────

export async function saveSession(session) {
  await local.saveSession(session);
  cloudWrite((id) => cloud.cloudSaveSession(id, { ...session, date: Date.now() }));
}

export async function getRecentSessions(limit = 14) {
  return local.getRecentSessions(limit);
}

// ── Settings ───────────────────────────────────────────────────

export async function getSetting(key) {
  return local.getSetting(key);
}

export async function setSetting(key, value) {
  await local.setSetting(key, value);
  cloudWrite((id) => cloud.cloudSetSetting(id, key, value));
}

// ── Stats ──────────────────────────────────────────────────────

export async function getStats() {
  return local.getStats();
}

// ── Reset (signs out or explicit reset) ───────────────────────

export async function resetAllProgress() {
  await local.resetAllProgress();
  // Note: cloud data is NOT deleted on local reset — only on explicit
  // "Delete my account" action in Settings.
}
