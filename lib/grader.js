import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

/**
 * Grade a user's answer against the correct word.
 * Returns { correct, isTypo, diff }
 *
 * correct  — boolean, case-insensitive match
 * isTypo   — true if Levenshtein distance <= 1 (adjacent key, one transposition)
 * diff     — array of [op, text] tuples for highlighting
 * wordCount — number of words in the answer (for word-count guard)
 */
export function gradeAnswer(userInput, correctWord) {
  const userTrimmed = userInput.trim();
  const userLower = userTrimmed.toLowerCase();
  const correctLower = correctWord.toLowerCase();

  const correct = userLower === correctLower;
  const wordCount = userTrimmed.split(/\s+/).filter(Boolean).length;

  // Compute character-level diff
  const diffs = dmp.diff_main(correctLower, userLower);
  dmp.diff_cleanupSemantic(diffs);

  // Levenshtein distance for typo detection
  const distance = levenshtein(userLower, correctLower);
  const isTypo = !correct && distance <= 1;

  return { correct, isTypo, diff: diffs, wordCount };
}

/**
 * Check IELTS word-count rule.
 * Returns { breached, limit, actual }
 */
export function checkWordLimit(userInput, limit) {
  if (!limit || limit <= 0) return { breached: false };
  const actual = userInput.trim().split(/\s+/).filter(Boolean).length;
  return {
    breached: actual > limit,
    limit,
    actual,
  };
}

/**
 * Simple Levenshtein distance
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
