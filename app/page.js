'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStats, getRecentSessions } from '@/lib/db';
import styles from './page.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, sess] = await Promise.all([getStats(), getRecentSessions(7)]);
        setStats(s);
        setSessions(sess);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Track your IELTS spelling progress and start practicing.</p>
      </div>

      {/* Quick actions */}
      <div className={styles.actions}>
        <Link href="/practice" className={`btn btn-primary ${styles.bigBtn}`} id="start-practice-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
          Start Practice
        </Link>
        <Link href="/practice?mode=weak" className={`btn btn-secondary ${styles.bigBtn}`} id="weak-words-btn">
          Practice Weak Words
        </Link>
        <Link href="/progress" className={`btn btn-ghost ${styles.bigBtn}`} id="view-progress-btn">
          View Progress →
        </Link>
      </div>

      <hr className="divider" />

      {/* Stats grid */}
      <p className="section-title">Your Stats</p>
      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <div className="stat-grid" style={{ marginBottom: 40 }}>
          <div className="stat-card">
            <span className="stat-value">{stats?.mastered ?? 0}</span>
            <span className="stat-label">Mastered</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--yellow)' }}>{stats?.learning ?? 0}</span>
            <span className="stat-label">Learning</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--red)' }}>{stats?.dueToday ?? 0}</span>
            <span className="stat-label">Due Now</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.accuracy ?? 0}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.totalSessions ?? 0}</span>
            <span className="stat-label">Sessions</span>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {!loading && sessions.length > 0 && (
        <>
          <p className="section-title">Recent Sessions</p>
          <div className={`card ${styles.sessionList}`}>
            {sessions.map((s, i) => (
              <div key={s.id || i} className={styles.sessionRow}>
                <span className={styles.sessionDate}>
                  {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span className={styles.sessionStat}>{s.wordsAttempted} words</span>
                <span className={styles.sessionStat}>
                  {s.wordsAttempted > 0
                    ? `${Math.round((s.wordsCorrect / s.wordsAttempted) * 100)}% correct`
                    : '—'}
                </span>
                <span className={styles.sessionDuration}>{s.duration ? `${s.duration}m` : '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && sessions.length === 0 && (
        <div className="empty">
          <span className="empty-icon">🎯</span>
          <h3 style={{ color: '#fff', marginBottom: 8 }}>No sessions yet</h3>
          <p>Start your first practice session to see your progress here.</p>
        </div>
      )}
    </div>
  );
}
