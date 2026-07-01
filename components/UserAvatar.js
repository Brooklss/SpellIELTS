'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserInitials } from '@/lib/auth';
import AuthModal from './AuthModal';
import styles from './UserAvatar.module.css';

export default function UserAvatar() {
  const { user, isSignedIn, signOut, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) {
    return <div className={styles.skeleton} aria-hidden="true" />;
  }

  if (!isSignedIn) {
    return (
      <>
        <button
          id="nav-signin-btn"
          className={styles.signInBtn}
          onClick={() => setShowModal(true)}
        >
          Sign In
        </button>
        {showModal && (
          <AuthModal
            onClose={() => setShowModal(false)}
            onSuccess={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Signed in: show avatar with dropdown
  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        id="nav-avatar-btn"
        className={styles.avatar}
        onClick={() => setShowMenu((v) => !v)}
        aria-label="Account menu"
        title={user.displayName || user.email}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="avatar" className={styles.avatarImg} referrerPolicy="no-referrer" />
        ) : (
          <span className={styles.avatarInitials}>{getUserInitials(user)}</span>
        )}
        <span className={styles.syncDot} aria-hidden="true" />
      </button>

      {showMenu && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuUser}>
            <p className={styles.menuName}>{user.displayName || 'Account'}</p>
            <p className={styles.menuEmail}>{user.email}</p>
          </div>
          <hr className={styles.menuDivider} />
          <button
            id="nav-signout-btn"
            className={styles.menuItem}
            role="menuitem"
            onClick={async () => { setShowMenu(false); await signOut(); }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
