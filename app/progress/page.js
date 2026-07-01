'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllProgress, getRecentSessions, getStats } from '@/lib/syncDb';
import { formatNextReview } from '@/lib/srs';
import wordBank from '@/data/wordBank.json';
import styles from './page.module.css';

const wordMap = Object.fromEntries(wordBank.map(w => [w.id, w]));
const categories = [...new Set(wordBank.map(w => w.category))];

export default function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [allProgress, setAllProgress] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, p, sess] = await Promise.all([
        getStats(),
        getAllProgress(),
        getRecentSessions(14),
      ]);
      setStats(s);
      setAllProgress(p);
      setSessions(sess.reverse());
      setLoading(false);
    }
    load();
  }, []);

  const categoryStats = categories.map(cat => {
    const catWords = wordBank.filter(w => w.category === cat);
    const catIds = new Set(catWords.map(w => w.id));
    const catProgress = allProgress.filter(p => catIds.has(p.wordId));
    const mastered = catProgress.filter(p => p.status === 'mastered').length;
    const attempted = catProgress.length;
    const pct = catWords.length > 0 ? Math.round((mastered / catWords.length) * 100) : 0;
    return { cat, total: catWords.length, attempted, mastered, pct };
  });

  const dueNow = allProgress.filter(p => p.status !== 'mastered' && p.nextReview && p.nextReview <= Date.now());

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Progress</h1>
        <p>Your performance overview and spaced repetition queue.</p>
      </div>

      {loading ? (
        <div style={{ color: '#333', padding: '60px 0', textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {/* Main stats */}
          <div className="stat-grid" style={{ marginBottom: 40 }}>
            <div className="stat-card">
              <span className="stat-value">{stats?.mastered ?? 0}</span>
              <span className="stat-label">Mastered</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: 'var(--yellow)' }}>
                {stats?.learning ?? 0}
              </span>
              <span className="stat-label">Learning</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: 'var(--red)' }}>
                {dueNow.length}
              </span>
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

          {/* SRS queue */}
          {dueNow.length > 0 && (
            <>
              <p className="section-title">Due for Review Now</p>
              <div className={`card ${styles.dueSection}`} style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>
                  {dueNow.length} word{dueNow.length !== 1 ? 's' : ''} need review
                </p>
                <Link href="/practice?mode=srs" className="btn btn-primary" id="review-now-btn">
                  Review Now
                </Link>
              </div>
            </>
          )}

          {/* Category breakdown */}
          <p className="section-title">Category Breakdown</p>
          <div className={`card ${styles.categoryList}`} style={{ marginBottom: 32 }}>
            {categoryStats.map(({ cat, total, mastered, attempted, pct }) => (
              <div key={cat} className={styles.categoryRow}>
                <div className={styles.catInfo}>
                  <span className={styles.catName}>{cat}</span>
                  <span className={styles.catCount}>
                    {mastered}/{total} mastered
                  </span>
                </div>
                <div className={styles.catBarWrap}>
                  <div className={styles.catBar}>
                    <div
                      className={styles.catBarFill}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={styles.catPct}>{pct}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Session history */}
          <p className="section-title">Session History</p>
          {sessions.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📊</span>
              <p>No sessions recorded yet. Start practicing!</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Words</th>
                    <th>Correct</th>
                    <th>Accuracy</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => {
                    const acc = s.wordsAttempted > 0
                      ? Math.round((s.wordsCorrect / s.wordsAttempted) * 100)
                      : 0;
                    return (
                      <tr key={s.id || i}>
                        <td>{new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>{s.wordsAttempted}</td>
                        <td>{s.wordsCorrect}</td>
                        <td>
                          <span style={{
                            color: acc >= 80 ? 'var(--green)' : acc >= 60 ? 'var(--yellow)' : 'var(--red)'
                          }}>
                            {acc}%
                          </span>
                        </td>
                        <td>{s.duration ? `${s.duration}m` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
