import { dayDiff } from './date';

/** Count consecutive days ending at the most recent completion. Returns 0 if gap > 1 from today. */
export function computeCurrentStreak(dates: string[], todayStr: string): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();

  // Gap from today to most recent completion must be <= 1
  if (dayDiff(sorted[0], todayStr) > 1) return 0;

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (dayDiff(sorted[i + 1], sorted[i]) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Find the longest consecutive run in the date set. */
export function computeLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let longest = 1;
  let current = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (dayDiff(sorted[i], sorted[i + 1]) === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}
