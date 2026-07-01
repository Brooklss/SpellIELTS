'use client';

import { useRef, useEffect } from 'react';
import styles from './AnswerInput.module.css';

export default function AnswerInput({ value, onChange, onSubmit, disabled, state }) {
  const inputRef = useRef(null);

  // Focus on mount and after each new word
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const stateClass = state === 'correct' ? styles.correct
    : state === 'wrong' ? styles.wrong
    : state === 'typo' ? styles.typo
    : '';

  return (
    <div className={styles.wrapper}>
      <input
        id="answer-input"
        ref={inputRef}
        type="text"
        className={`${styles.input} ${stateClass}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type your answer here…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        aria-label="Spelling answer input"
      />
      {state === 'correct' && (
        <span className={styles.stateIcon}>✓</span>
      )}
      {(state === 'wrong' || state === 'typo') && (
        <span className={styles.stateIcon}>✗</span>
      )}
    </div>
  );
}
