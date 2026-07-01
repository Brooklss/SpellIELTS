'use client';

import { useState, useEffect } from 'react';
import { getSetting, setSetting, resetAllProgress } from '@/lib/db';
import styles from './page.module.css';

export default function SettingsPage() {
  const [defaultAccent, setDefaultAccent] = useState('british');
  const [examNoise, setExamNoise] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [accent, noise] = await Promise.all([
        getSetting('defaultAccent'),
        getSetting('examNoiseDefault'),
      ]);
      if (accent) setDefaultAccent(accent);
      if (noise !== null) setExamNoise(noise === true || noise === 'true');
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    await Promise.all([
      setSetting('defaultAccent', defaultAccent),
      setSetting('examNoiseDefault', examNoise),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetAllProgress();
    setConfirmReset(false);
    alert('All progress has been reset.');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Customise your SpellIELTS experience.</p>
      </div>

      {loading ? (
        <div style={{ color: '#333', padding: '40px 0', textAlign: 'center' }}>Loading…</div>
      ) : (
        <div className={styles.settingsGrid}>
          {/* Preferences */}
          <section className={`card ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Preferences</h2>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label htmlFor="default-accent" className={styles.settingLabel}>
                  Default Accent
                </label>
                <p className={styles.settingDesc}>
                  The accent used when you start a new practice session.
                </p>
              </div>
              <select
                id="default-accent"
                className={styles.select}
                value={defaultAccent}
                onChange={e => setDefaultAccent(e.target.value)}
              >
                <option value="british">🇬🇧 British</option>
                <option value="australian">🇦🇺 Australian</option>
                <option value="american">🇺🇸 American</option>
                <option value="canadian">🇨🇦 Canadian</option>
              </select>
            </div>

            <hr className="divider" />

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Exam Hall Noise</span>
                <p className={styles.settingDesc}>
                  Enable keyboard and ambient noise by default to simulate exam conditions.
                </p>
              </div>
              <button
                id="exam-noise-toggle"
                className={`${styles.toggle} ${examNoise ? styles.toggleOn : ''}`}
                onClick={() => setExamNoise(v => !v)}
                role="switch"
                aria-checked={examNoise}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>

            <div className={styles.saveRow}>
              <button
                id="save-settings-btn"
                className="btn btn-primary"
                onClick={handleSave}
              >
                {saved ? '✓ Saved' : 'Save Settings'}
              </button>
            </div>
          </section>

          {/* Data */}
          <section className={`card ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Data</h2>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Reset All Progress</span>
                <p className={styles.settingDesc}>
                  Permanently delete all your word progress, error logs, and session history. This cannot be undone.
                </p>
              </div>
              <button
                id="reset-progress-btn"
                className={`btn ${confirmReset ? '' : 'btn-secondary'}`}
                onClick={handleReset}
                style={confirmReset ? {
                  background: 'rgba(248,113,113,0.1)',
                  borderColor: 'rgba(248,113,113,0.4)',
                  color: 'var(--red)',
                } : {}}
              >
                {confirmReset ? '⚠️ Confirm Reset' : 'Reset Progress'}
              </button>
            </div>
            {confirmReset && (
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmReset(false)}
                style={{ marginTop: 8 }}
              >
                Cancel
              </button>
            )}
          </section>

          {/* About */}
          <section className={`card ${styles.section}`}>
            <h2 className={styles.sectionTitle}>About</h2>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutItem}>
                <span className={styles.aboutLabel}>Version</span>
                <span className={styles.aboutValue}>1.0.0</span>
              </div>
              <div className={styles.aboutItem}>
                <span className={styles.aboutLabel}>Word Bank</span>
                <span className={styles.aboutValue}>300 IELTS words</span>
              </div>
              <div className={styles.aboutItem}>
                <span className={styles.aboutLabel}>Audio Engine</span>
                <span className={styles.aboutValue}>Web Speech API</span>
              </div>
              <div className={styles.aboutItem}>
                <span className={styles.aboutLabel}>Database</span>
                <span className={styles.aboutValue}>IndexedDB (local)</span>
              </div>
              <div className={styles.aboutItem}>
                <span className={styles.aboutLabel}>SRS Algorithm</span>
                <span className={styles.aboutValue}>SM-2 approximation</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
