import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Skip Firebase init entirely if the API key is not provided (e.g. during build)
const isConfigured = !!firebaseConfig.apiKey;

// Prevent duplicate initialisation in Next.js hot-reloads
const app = isConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

// Auth instance (null when unconfigured)
export const auth = app ? getAuth(app) : null;

// Firestore with offline persistence (long-polling for better Next.js compat)
let _db;
export function getFirestoreDB() {
  if (!app) return null;
  if (_db) return _db;

  if (typeof window === 'undefined') {
    // SSR: return plain Firestore (no persistence needed server-side)
    _db = getFirestore(app);
    return _db;
  }

  // Client: enable unlimited offline cache
  _db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: false,
  });

  // enableIndexedDbPersistence is fire-and-forget — errors are non-fatal
  enableIndexedDbPersistence(_db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — persistence can only be enabled in one tab at a time.
      console.warn('[Firebase] Offline persistence disabled: multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support all required features.
      console.warn('[Firebase] Offline persistence not supported in this browser.');
    }
  });

  return _db;
}

export default app;
