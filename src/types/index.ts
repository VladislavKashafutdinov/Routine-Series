// ---- Database entities ----

export interface Activity {
  id?: number;
  name: string;
  createdAt: Date;
  seriesLength: number; // target days per series (default 7)
  reward: number;       // reward for completing a series
  currency: string;     // e.g. "₽"
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
  createdAt: Date;
  seriesLength: number;
  reward: number;
  currency: string;
  currentStreak: number;  // consecutive days up to today
  longestStreak: number;   // best ever
  isDoneToday: boolean;
  completions: Completion[];
}
