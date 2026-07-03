import { dayDiff } from './date';

/**
 * Calculate the current streak: how many consecutive days
 * (ending at the most recent completion) the activity was done.
 * If the most recent completion is more than 1 day before today,
 * the current streak is 0.
 */
export function calculateStreak(
  completionDates: string[],
  todayStr: string
): number {
  if (completionDates.length === 0) return 0;

  const sorted = [...new Set(completionDates)].sort().reverse();
  const mostRecent = sorted[0];

  // Streak broken if gap between today and most recent completion > 1
  if (dayDiff(mostRecent, todayStr) > 1) return 0;

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

/**
 * Calculate the longest streak ever achieved.
 */
export function calculateLongestStreak(completionDates: string[]): number {
  if (completionDates.length === 0) return 0;

  const sorted = [...new Set(completionDates)].sort();
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
