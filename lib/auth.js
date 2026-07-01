import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

function requireAuth() {
  if (!auth) throw new Error('Firebase is not configured. Please set up your .env.local file.');
  return auth;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Google Sign-In ─────────────────────────────────────────────

export async function signInWithGoogle() {
  const result = await signInWithPopup(requireAuth(), googleProvider);
  return result.user;
}

// ── Email / Password ───────────────────────────────────────────

export async function registerWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(requireAuth(), email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(requireAuth(), email, password);
  return result.user;
}

// ── Sign Out ───────────────────────────────────────────────────

export async function signOut() {
  if (!auth) return;
  await firebaseSignOut(auth);
}

// ── Auth State Listener ────────────────────────────────────────

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (!auth) {
    // Not configured — immediately emit null (signed-out state)
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Returns initials from a displayName or email string.
 * Used as avatar fallback when no photoURL is available.
 */
export function getUserInitials(user) {
  if (!user) return '?';
  if (user.displayName) {
    return user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}
