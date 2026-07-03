import { dayDiff } from './date';
import type { SeriesWithCompletions } from '../types';

/**
 * Check if the active series has a gap (missed day) and should be marked broken.
 * Returns true if the series is still active (no gap > 1 from last completion to today).
 */
export function isSeriesBroken(series: SeriesWithCompletions, todayStr: string): boolean {
  if (series.completions.length === 0) {
    // Empty series that was created but never started — not broken yet
    // unless it was created more than 1 day ago
    return dayDiff(series.createdAt.toISOString().slice(0, 10), todayStr) > 1;
  }
  const dates = series.completions.map((c) => c.date).sort();
  const lastDate = dates[dates.length - 1];
  return dayDiff(lastDate, todayStr) > 1;
}

/**
 * Check if the active series has reached its target length.
 */
export function isSeriesCompleted(series: SeriesWithCompletions, targetLength: number): boolean {
  const uniqueDates = new Set(series.completions.map((c) => c.date));
  return uniqueDates.size >= targetLength;
}

/**
 * Calculate consecutive days ending at the most recent completion within a series.
 */
export function countConsecutiveInSeries(series: SeriesWithCompletions): number {
  const dates = [...new Set(series.completions.map((c) => c.date))].sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    if (dayDiff(dates[i + 1], dates[i]) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
