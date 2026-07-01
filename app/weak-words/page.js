'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWeakWords } from '@/lib/syncDb';
import { formatNextReview } from '@/lib/srs';
import wordBank from '@/data/wordBank.json';
import styles from './page.module.css';

const wordMap = Object.fromEntries(wordBank.map(w => [w.id, w]));

export default function WeakWordsPage() {
  const [weakWords, setWeakWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const weak = await getWeakWords(100);
      setWeakWords(weak);
      setLoading(false);
    }
    load();
  }, []);

  const wordsWithData = weakWords.map(p => ({
    progress: p,
    word: wordMap[p.wordId],
  })).filter(w => w.word);

  return (
    <div className="page-container">
      <div className={styles.header}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Weak Words</h1>
          <p>Words you've struggled with, sorted by fail count.</p>
        </div>
        {wordsWithData.length > 0 && (
          <Link
            href="/practice?mode=weak"
            className="btn btn-primary"
            id="practice-weak-btn"
          >
            Practice These Words
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#333', padding: '60px 0', textAlign: 'center' }}>Loading…</div>
      ) : wordsWithData.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🏆</span>
          <h3 style={{ color: '#fff', marginBottom: 8 }}>No weak words yet!</h3>
          <p>Start practicing to track which words you find difficult.</p>
          <Link href="/practice" className="btn btn-primary" style={{ marginTop: 24 }}>
            Start Practice
          </Link>
        </div>
      ) : (
        <div className={`card ${styles.tableWrap}`}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Word</th>
                <th>Category</th>
                <th>Fails</th>
                <th>Last Error</th>
                <th>Next Review</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {wordsWithData.map(({ progress, word }, i) => {
                const lastError = progress.errorLog?.[progress.errorLog.length - 1];
                return (
                  <tr key={word.id}>
                    <td style={{ color: '#2a2a2a', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                    <td>
                      <span className={styles.wordCell}>{word.word}</span>
                    </td>
                    <td>
                      <span className="badge badge-gray">{word.category}</span>
                    </td>
                    <td>
                      <span className={styles.failCount} style={{
                        color: progress.failCount >= 5 ? 'var(--red)'
                          : progress.failCount >= 3 ? 'var(--yellow)'
                          : '#888'
                      }}>
                        {progress.failCount}×
                      </span>
                    </td>
                    <td>
                      {lastError ? (
                        <span className={styles.errorSpan}>
                          <span className={styles.errorAttempt}>{lastError.attempt}</span>
                          {lastError.isTypo && (
                            <span className="badge badge-yellow" style={{ marginLeft: 6 }}>typo</span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span style={{ color: '#555', fontSize: 13 }}>
                        {formatNextReview(progress.nextReview)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        progress.status === 'mastered' ? 'badge-green'
                          : progress.status === 'review' ? 'badge-yellow'
                          : 'badge-red'
                      }`}>
                        {progress.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
