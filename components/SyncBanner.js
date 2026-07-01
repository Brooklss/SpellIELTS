'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import styles from './SyncBanner.module.css';

/**
 * SyncBanner — shows on the Dashboard:
 *  - Guests: nudge to sign in
 *  - Signed in: cloud sync status
 */
export default function SyncBanner() {
  const { isSignedIn, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [online, setOnline] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline  = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (loading || dismissed) return null;

  // Signed in + offline
  if (isSignedIn && !online) {
    return (
      <div className={`${styles.banner} ${styles.offline}`} role="status">
        <span className={styles.icon}>⚡</span>
        <span>Offline — changes saved locally and will sync when reconnected.</span>
      </div>
    );
  }

  // Signed in + online
  if (isSignedIn) {
    return (
      <div className={`${styles.banner} ${styles.synced}`} role="status">
        <span className={styles.icon}>✓</span>
        <span>Progress is being saved to the cloud.</span>
      </div>
    );
  }

  // Guest
  return (
    <>
      <div className={`${styles.banner} ${styles.guest}`} role="status">
        <span className={styles.icon}>☁</span>
        <span>
          Sign in to back up your progress —{' '}
          <button
            id="sync-banner-signin-btn"
            className={styles.bannerLink}
            onClick={() => setShowModal(true)}
          >
            Sign in free →
          </button>
        </span>
        <button
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
}
