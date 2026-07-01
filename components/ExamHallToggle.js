'use client';

import styles from './ExamHallToggle.module.css';
import { startExamNoise, stopExamNoise } from '@/lib/examNoise';
import { useState } from 'react';

export default function ExamHallToggle() {
  const [active, setActive] = useState(false);

  const toggle = () => {
    if (active) {
      stopExamNoise();
      setActive(false);
    } else {
      startExamNoise();
      setActive(true);
    }
  };

  return (
    <button
      id="exam-hall-toggle"
      className={`${styles.toggle} ${active ? styles.active : ''}`}
      onClick={toggle}
      title="Toggle Exam Hall Realism noise"
    >
      <span className={styles.icon}>{active ? '🔊' : '🔇'}</span>
      <span className={styles.text}>Exam Hall</span>
      <span className={`${styles.dot} ${active ? styles.dotActive : ''}`} />
    </button>
  );
}
