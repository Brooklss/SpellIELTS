'use client';

import { useState, useEffect, useRef } from 'react';
import { speak, stopSpeaking, initVoices } from '@/lib/tts';
import styles from './AudioPlayer.module.css';

const ACCENTS = [
  { key: 'british', label: '🇬🇧 British' },
  { key: 'australian', label: '🇦🇺 Australian' },
  { key: 'american', label: '🇺🇸 American' },
  { key: 'canadian', label: '🇨🇦 Canadian' },
];

export default function AudioPlayer({ text, sentence, onPlay }) {
  const [accent, setAccent] = useState('british');
  const [mode, setMode] = useState('word'); // 'word' | 'sentence'
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      initVoices();
      // Retry voice load after 500ms (Chrome lazy-loads)
      setTimeout(initVoices, 500);
      mounted.current = true;
    }
  }, []);

  const handlePlay = async () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    const content = mode === 'sentence' && sentence ? sentence : text;
    setPlaying(true);
    setPlayCount(c => c + 1);
    if (onPlay) onPlay();
    try {
      await speak(content, { accent, rate: 0.82 });
    } catch (_) {}
    setPlaying(false);
  };

  return (
    <div className={styles.player}>
      <div className={styles.controls}>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mode === 'word' ? styles.active : ''}`}
            onClick={() => setMode('word')}
          >
            Word
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'sentence' ? styles.active : ''}`}
            onClick={() => setMode('sentence')}
            disabled={!sentence}
          >
            Sentence
          </button>
        </div>

        <select
          className={styles.accentSelect}
          value={accent}
          onChange={e => setAccent(e.target.value)}
        >
          {ACCENTS.map(a => (
            <option key={a.key} value={a.key}>{a.label}</option>
          ))}
        </select>
      </div>

      <button
        id="play-audio-btn"
        className={`${styles.playBtn} ${playing ? styles.playing : ''}`}
        onClick={handlePlay}
        title="Play audio (Space)"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {playCount > 0 && (
        <span className={styles.playCount}>Played {playCount}×</span>
      )}
    </div>
  );
}
