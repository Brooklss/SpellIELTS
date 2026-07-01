'use client';

/**
 * SyncWatcher — zero-UI component mounted at the root.
 * Listens to auth changes and triggers syncOnSignIn when a user signs in.
 * Also registers the uid getter with syncDb so cloud writes are attributed.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { syncOnSignIn, _setGetUser } from '@/lib/syncDb';

export default function SyncWatcher() {
  const { user } = useAuth();
  const prevUid = useRef(null);

  // Register the uid getter once
  useEffect(() => {
    _setGetUser(() => user);
  }, [user]);

  // On sign-in (uid appeared or changed) run the merge sync
  useEffect(() => {
    const currentUid = user?.uid ?? null;
    if (currentUid && currentUid !== prevUid.current) {
      syncOnSignIn(user);
    }
    prevUid.current = currentUid;
  }, [user]);

  return null;
}
