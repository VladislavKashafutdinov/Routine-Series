// ---- Database entities ----

export interface Activity {
  id?: number;
  name: string;
  archived: boolean;
  /** Informational only — not used in business logic. For debugging/analytics. */
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

export interface RewardIssue {
  id?: number;
  activityId: number;
  date: string;   // "YYYY-MM-DD" — дата выдачи
  amount: number;  // размер выданной награды
  currency: string; // валюта
}

export interface Completion {
  id?: number;
  activityId: number;
  date: string; // "YYYY-MM-DD"
}

// ---- Computed ----

/** Computed series view — not stored in DB */
export interface ComputedSeries {
  number: number;
  status: 'active' | 'completed' | 'broken';
  seriesLength: number;
  reward: number;
  currency: string;
  startDate: string;          // first completion date
  endDate?: string;           // last completion date (completed/broken)
  completions: Completion[];
  definitionCreatedAt: Date;  // createdAt of the SeriesDefinition this series belongs to
}

export interface ActivityWithStreak {
  id: number;
  name: string;
  archived: boolean;
  createdAt: Date;
  seriesLength: number;
  reward: number;
  currency: string;
  currentStreak: number;   // consecutive days up to today
  longestStreak: number;    // best ever
  earnedByCurrency: Record<string, number>;
  issuedByCurrency: Record<string, number>;
  unissuedByCurrency: Record<string, number>;
  isDoneToday: boolean;
  completions: Completion[];
  series: ComputedSeries[];
  rewardIssues: RewardIssue[];
  seriesDefinitions: SeriesDefinition[];
}
