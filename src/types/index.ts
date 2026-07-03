// ---- Database entities ----

export interface Activity {
  id?: number;
  name: string;
  createdAt: Date;
}

export interface Completion {
  id?: number;
  activityId: number;
  date: string; // "YYYY-MM-DD" in local timezone
  createdAt: Date;
}

// ---- Computed view ----

export interface ActivityWithStreak {
  id: number;
  name: string;
  createdAt: Date;
  currentStreak: number;
  longestStreak: number;
  isDoneToday: boolean;
  completions: Completion[];
}
