'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AudioPlayer from '@/components/AudioPlayer';
import AnswerInput from '@/components/AnswerInput';
import DiffVisualizer from '@/components/DiffVisualizer';
import ExamHallToggle from '@/components/ExamHallToggle';
import { gradeAnswer, checkWordLimit } from '@/lib/grader';
import { createProgressRecord, applyFail, applyPass } from '@/lib/srs';
import {
  getWordProgress,
  upsertWordProgress,
  getWeakWords,
  getDueWords,
  saveSession,
} from '@/lib/syncDb';
import wordBank from '@/data/wordBank.json';
import styles from './page.module.css';

const CATEGORIES = ['All', ...new Set(wordBank.map(w => w.category))];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode'); // 'weak' | 'srs' | null

  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [answer, setAnswer] = useState('');
  const [inputState, setInputState] = useState(null); // null | 'correct' | 'wrong' | 'typo'
  const [result, setResult] = useState(null);
  const [wordLimit, setWordLimit] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });
  const [sessionStart] = useState(Date.now());
  const [showAccentMorph, setShowAccentMorph] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const submitted = useRef(false);

  // Build queue based on mode/filters
  useEffect(() => {
    async function buildQueue() {
      setLoading(true);
      let words = [];

      if (modeParam === 'weak') {
        const weakProgress = await getWeakWords(50);
        const weakIds = new Set(weakProgress.map(p => p.wordId));
        words = wordBank.filter(w => weakIds.has(w.id));
        if (words.length === 0) words = shuffleArray(wordBank).slice(0, 20);
      } else if (modeParam === 'srs') {
        const dueProgress = await getDueWords();
        const dueIds = new Set(dueProgress.map(p => p.wordId));
        words = wordBank.filter(w => dueIds.has(w.id));
        if (words.length === 0) words = shuffleArray(wordBank).slice(0, 20);
      } else {
        words = wordBank;
      }

      // Apply category/difficulty filter
      let filtered = words;
      if (category !== 'All') filtered = filtered.filter(w => w.category === category);
      if (difficulty !== 'All') filtered = filtered.filter(w => w.difficulty === difficulty);
      if (filtered.length === 0) filtered = words;

      setQueue(shuffleArray(filtered));
      setQueueIndex(0);
      setLoading(false);
    }
    buildQueue();
  }, [modeParam, category, difficulty]);

  // Set current word when queue or index changes
  useEffect(() => {
    if (queue.length > 0) {
      setCurrentWord(queue[queueIndex % queue.length]);
      resetState();
    }
  }, [queue, queueIndex]);

  function resetState() {
    setAnswer('');
    setInputState(null);
    setResult(null);
    setAnswered(false);
    setShowAccentMorph(false);
    submitted.current = false;
  }

  const handleSubmit = useCallback(async () => {
    if (!currentWord || !answer.trim() || submitted.current) return;
    submitted.current = true;

    const limit = parseInt(wordLimit, 10);
    const limitCheck = checkWordLimit(answer, limit);
    const { correct, isTypo, diff } = gradeAnswer(answer, currentWord.word);

    const limitBreached = limitCheck.breached;

    // Load or create progress record
    let progress = await getWordProgress(currentWord.id);
    if (!progress) progress = createProgressRecord(currentWord.id);

    let finalCorrect = correct && !limitBreached;

    if (finalCorrect) {
      progress = applyPass(progress);
      setInputState('correct');
    } else {
      progress = applyFail(progress, {
        attempt: answer.trim().toLowerCase(),
        correct: currentWord.word,
        isTypo: isTypo && !limitBreached,
      });
      setInputState(isTypo && !limitBreached ? 'typo' : 'wrong');
    }

    await upsertWordProgress(progress);

    setResult({
      correct: finalCorrect,
      isTypo: isTypo && !limitBreached,
      diff: correct ? null : diff,
      limitBreached,
      limitInfo: limitCheck,
      progress,
    });
    setAnswered(true);
    setSessionStats(prev => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (finalCorrect ? 1 : 0),
    }));
    setShowAccentMorph(!finalCorrect);
  }, [currentWord, answer, wordLimit]);

  const handleNext = useCallback(async () => {
    const nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      // Save session on completion
      const duration = Math.round((Date.now() - sessionStart) / 60000);
      await saveSession({
        wordsAttempted: sessionStats.attempted + 1,
        wordsCorrect: sessionStats.correct + (result?.correct ? 1 : 0),
        duration,
      });
    }
    setQueueIndex(nextIdx % queue.length);
  }, [queueIndex, queue.length, sessionStats, result, sessionStart]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        document.getElementById('play-audio-btn')?.click();
      }
      if (e.key === 'ArrowRight' && answered) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answered, handleNext]);

  const progressPct = queue.length > 0 ? ((queueIndex % queue.length) / queue.length) * 100 : 0;

  return (
    <div className="page-container">
      {/* Header + Session stats */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>
            {modeParam === 'weak' ? 'Weak Words' : modeParam === 'srs' ? 'SRS Review' : 'Practice'}
          </h1>
        </div>
        <div className={styles.sessionBar}>
          <span className={styles.sessionStat}>
            <span style={{ color: '#fff' }}>{sessionStats.correct}</span>/{sessionStats.attempted}
          </span>
          <ExamHallToggle />
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          id="category-filter"
          className={styles.filterSelect}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          id="difficulty-filter"
          className={styles.filterSelect}
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
        >
          <option value="All">All Levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <div className={styles.wordLimitWrap}>
          <input
            id="word-limit-input"
            type="number"
            className={styles.wordLimitInput}
            placeholder="Word limit…"
            value={wordLimit}
            onChange={e => setWordLimit(e.target.value)}
            min="1"
            max="10"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {loading ? (
        <div className={styles.loadingCenter}>Loading words…</div>
      ) : (
        <div className={styles.practiceArea}>
          {/* Word info */}
          {currentWord && (
            <div className={styles.wordMeta}>
              <span className="badge badge-gray">{currentWord.category}</span>
              <span className={`badge ${
                currentWord.difficulty === 'easy' ? 'badge-green'
                : currentWord.difficulty === 'medium' ? 'badge-yellow'
                : 'badge-red'}`}>
                {currentWord.difficulty}
              </span>
              <span className={styles.wordCounter}>
                {(queueIndex % queue.length) + 1} / {queue.length}
              </span>
            </div>
          )}

          {/* Audio player */}
          {currentWord && (
            <AudioPlayer
              text={currentWord.word}
              sentence={currentWord.sentence}
            />
          )}

          {/* Keyboard hint */}
          <p className={styles.hint}>
            Press <kbd className={styles.kbd}>Space</kbd> to replay · <kbd className={styles.kbd}>Enter</kbd> to submit
          </p>

          {/* Answer input */}
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmit}
            disabled={answered}
            state={inputState}
          />

          {/* Submit / Next */}
          <div className={styles.btnRow}>
            {!answered ? (
              <button
                id="submit-answer-btn"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!answer.trim()}
              >
                Check Answer
              </button>
            ) : (
              <button
                id="next-word-btn"
                className="btn btn-primary"
                onClick={handleNext}
              >
                Next Word →
              </button>
            )}
            <button
              id="skip-word-btn"
              className="btn btn-ghost"
              onClick={handleNext}
            >
              Skip
            </button>
          </div>

          {/* Result panel */}
          {answered && result && (
            <div className={`${styles.resultPanel} animate-in`}>
              {result.limitBreached && (
                <div className={styles.limitWarning}>
                  ⚠️ Spelling correct, but you exceeded the IELTS word limit!
                  <br />
                  <span>Limit: {result.limitInfo.limit} word{result.limitInfo.limit !== 1 ? 's' : ''} — you wrote {result.limitInfo.actual}</span>
                </div>
              )}

              {result.correct ? (
                <div className={styles.correctMsg}>
                  <span className={styles.resultIcon}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--green)' }}>Correct!</strong>
                    {result.progress?.status === 'mastered' && (
                      <span className={styles.masteredBadge}>🎉 Mastered!</span>
                    )}
                    {result.progress?.consecutivePasses > 1 && result.progress?.status !== 'mastered' && (
                      <p style={{ marginTop: 4, fontSize: 12, color: '#555' }}>
                        {result.progress.consecutivePasses} consecutive passes
                      </p>
                    )}
                  </div>
                </div>
              ) : result.isTypo ? (
                <div className={styles.typoMsg}>
                  <span className={styles.resultIcon} style={{ color: 'var(--yellow)' }}>~</span>
                  <div>
                    <strong style={{ color: 'var(--yellow)' }}>Possible typo</strong>
                    <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                      Very close! Logged as a near-miss.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.wrongMsg}>
                  <span className={styles.resultIcon} style={{ color: 'var(--red)' }}>✗</span>
                  <div>
                    <strong style={{ color: 'var(--red)' }}>Incorrect</strong>
                    <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                      Failed {result.progress?.failCount ?? 1} time{(result.progress?.failCount ?? 1) !== 1 ? 's' : ''}
                      {result.progress?.nextReview
                        ? ` · Review scheduled`
                        : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Diff visualizer */}
              {result.diff && !result.correct && (
                <DiffVisualizer
                  diff={result.diff}
                  correct={currentWord?.word}
                  attempt={answer}
                />
              )}

              {/* Correct answer reveal */}
              {!result.correct && (
                <div className={styles.correctReveal}>
                  <span className={styles.revealLabel}>Correct spelling</span>
                  <span className={styles.revealWord}>{currentWord?.word}</span>
                </div>
              )}

              {/* Accent morpher */}
              {showAccentMorph && (
                <div className={styles.accentMorph}>
                  <p className={styles.morphLabel}>Hear it in another accent</p>
                  <div className={styles.morphBtns}>
                    {[
                      { key: 'scottish', label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish' },
                      { key: 'australian_thick', label: '🇦🇺 Thick Aus' },
                      { key: 'rp', label: '🎙 RP/BBC' },
                    ].map(m => (
                      <button
                        key={m.key}
                        id={`morph-${m.key}-btn`}
                        className="btn btn-secondary"
                        onClick={() => {
                          import('@/lib/tts').then(({ speak }) => {
                            speak(currentWord?.word, { morph: m.key, accent: 'british' });
                          });
                        }}
                        style={{ fontSize: 12, padding: '6px 12px' }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Context sentence */}
              {currentWord?.sentence && (
                <div className={styles.contextSentence}>
                  <span className={styles.sentenceLabel}>Context</span>
                  <p className={styles.sentence}>
                    {currentWord.sentence.split(new RegExp(`(${currentWord.word})`, 'i')).map((part, i) =>
                      part.toLowerCase() === currentWord.word.toLowerCase()
                        ? <mark key={i} className={styles.wordHighlight}>{part}</mark>
                        : <span key={i}>{part}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="page-container" style={{ color: '#333' }}>Loading…</div>}>
      <PracticeContent />
    </Suspense>
  );
}
