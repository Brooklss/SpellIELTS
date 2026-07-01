/**
 * Spaced Repetition System (SM-2 approximation)
 * Intervals: 2min → 10min → 1day → 3days → 7days → mastered after 3 consecutive passes
 */

const INTERVALS_MS = [
  2 * 60 * 1000,          // 2 minutes
  10 * 60 * 1000,         // 10 minutes
  24 * 60 * 60 * 1000,    // 1 day
  3 * 24 * 60 * 60 * 1000, // 3 days
  7 * 24 * 60 * 60 * 1000, // 7 days
];

/**
 * Create fresh progress record for a word
 */
export function createProgressRecord(wordId) {
  return {
    wordId,
    failCount: 0,
    passCount: 0,
    consecutivePasses: 0,
    intervalIndex: 0,
    lastSeen: null,
    nextReview: null,
    status: 'new', // 'new' | 'learning' | 'review' | 'mastered'
    errorLog: [],  // [{attempt, correct, isTypo, timestamp}]
  };
}

/**
 * Update progress after a FAILED attempt
 */
export function applyFail(progress, { attempt, correct, isTypo = false }) {
  const updated = { ...progress };
  updated.failCount += 1;
  updated.consecutivePasses = 0;
  updated.intervalIndex = 0; // reset interval on fail
  updated.lastSeen = Date.now();
  updated.nextReview = Date.now() + INTERVALS_MS[0]; // review in 2 minutes
  updated.status = 'learning';
  updated.errorLog = [
    ...(updated.errorLog || []).slice(-19), // keep last 20 errors
    { attempt, correct, isTypo, timestamp: Date.now() },
  ];
  return updated;
}

/**
 * Update progress after a PASS
 */
export function applyPass(progress) {
  const updated = { ...progress };
  updated.passCount += 1;
  updated.consecutivePasses = (updated.consecutivePasses || 0) + 1;
  updated.lastSeen = Date.now();

  if (updated.consecutivePasses >= 3) {
    updated.status = 'mastered';
    updated.nextReview = null;
  } else {
    const nextIndex = Math.min(
      (updated.intervalIndex || 0) + 1,
      INTERVALS_MS.length - 1
    );
    updated.intervalIndex = nextIndex;
    updated.nextReview = Date.now() + INTERVALS_MS[nextIndex];
    updated.status = updated.failCount > 0 ? 'review' : 'learning';
  }

  return updated;
}

/**
 * Format a nextReview date into a human-readable string
 */
export function formatNextReview(nextReview) {
  if (!nextReview) return '—';
  const diff = nextReview - Date.now();
  if (diff <= 0) return 'Now';
  if (diff < 60 * 1000) return `${Math.round(diff / 1000)}s`;
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60000)}m`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h`;
  return `${Math.round(diff / 86400000)}d`;
}
