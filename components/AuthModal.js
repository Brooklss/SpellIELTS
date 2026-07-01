'use client';

import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, registerWithEmail } from '@/lib/auth';
import styles from './AuthModal.module.css';

/**
 * AuthModal — slide-up auth panel.
 * Props:
 *   onClose() — dismiss the modal (guest continues)
 *   onSuccess(user) — called after a successful sign-in
 */
export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      onSuccess?.(user);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user =
        mode === 'register'
          ? await registerWithEmail(email, password, name)
          : await signInWithEmail(email, password);
      onSuccess?.(user);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Sign in">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>S</span>
          </div>
          <h2 className={styles.title}>
            {mode === 'register' ? 'Create account' : 'Welcome back'}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'register'
              ? 'Sign up to save your progress across all devices.'
              : 'Sign in to sync your progress to the cloud.'}
          </p>
        </div>

        {/* Google */}
        <button
          id="auth-google-btn"
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={busy}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>

        <div className={styles.divider}><span>or</span></div>

        {/* Email / Password form */}
        <form onSubmit={handleEmail} className={styles.form}>
          {mode === 'register' && (
            <input
              id="auth-name-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              autoComplete="name"
            />
          )}
          <input
            id="auth-email-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
            autoComplete="email"
          />
          <input
            id="auth-password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={styles.input}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            id="auth-submit-btn"
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={busy}
          >
            {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className={styles.toggleRow}>
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button className={styles.link} onClick={() => { setMode('register'); setError(''); }}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className={styles.link} onClick={() => { setMode('signin'); setError(''); }}>
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Guest dismiss */}
        <button
          id="auth-guest-btn"
          className={styles.guestBtn}
          onClick={onClose}
        >
          Continue without account →
        </button>
      </div>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
