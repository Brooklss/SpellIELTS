'use client';

import styles from './DiffVisualizer.module.css';

/**
 * Renders character-level diff between correct word and user attempt
 * diff is array of [op, text] where op: -1=delete, 0=equal, 1=insert
 */
export default function DiffVisualizer({ diff, correct, attempt }) {
  if (!diff) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <span className={styles.label}>Correct</span>
        <span className={styles.word}>{correct}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Yours</span>
        <span className={styles.word}>
          {diff.map(([op, text], i) => {
            if (op === 0) return <span key={i} className={styles.equal}>{text}</span>;
            if (op === -1) return <span key={i} className={styles.missing}>{text}</span>;
            if (op === 1) return <span key={i} className={styles.extra}>{text}</span>;
            return null;
          })}
        </span>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.missingDot} /> Missing
        </span>
        <span className={styles.legendItem}>
          <span className={styles.extraDot} /> Extra
        </span>
      </div>
    </div>
  );
}
