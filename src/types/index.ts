// ---- Database entities ----

export interface Activity {
  id?: number;
  name: string;
  createdAt: Date;
  seriesLength: number; // target series length in days (default 7)
  reward: number;       // reward value for completing a series
  currency: string;     // reward unit (e.g. "₽", "coins")
}

export type SeriesStatus = 'active' | 'completed' | 'broken';

export interface Series {
  id?: number;
  activityId: number;
  number: number;         // ordinal: #1, #2, ...
  status: SeriesStatus;
  rewardIssued: boolean;  // has the reward been claimed?
  createdAt: Date;
}

export interface Completion {
  id?: number;
  seriesId: number;
  activityId: number;     // denormalized for easy querying
  date: string;           // "YYYY-MM-DD" in local timezone
  createdAt: Date;
}

// ---- Computed views ----

export interface SeriesWithCompletions extends Series {
  completions: Completion[];
}

export interface ActivityWithSeries {
  id: number;
  name: string;
  createdAt: Date;
  seriesLength: number;
  reward: number;
  currency: string;
  activeSeries: SeriesWithCompletions | null;
  lastCompletedSeries: SeriesWithCompletions | null; // most recent completed, for reward claim
  isDoneToday: boolean;
}
