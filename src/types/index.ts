// ---- Database entities ----

export interface Activity {
  id?: number;
  name: string;
  archived: boolean;
  createdAt: Date;
}

export interface SeriesDefinition {
  id?: number;
  activityId: number;
  seriesLength: number;  // target days per series
  reward: number;        // reward for completing a series
  currency: string;      // e.g. "₽"
  createdAt: Date;       // when this version was created
}

export interface Completion {
  id?: number;
  activityId: number;
  date: string; // "YYYY-MM-DD"
}

// ---- Computed ----

export interface ActivityWithStreak {
  id: number;
  name: string;
  archived: boolean;
  createdAt: Date;
  seriesLength: number;
  reward: number;
  currency: string;
  currentStreak: number;  // consecutive days up to today
  longestStreak: number;   // best ever
  isDoneToday: boolean;
  completions: Completion[];
}
