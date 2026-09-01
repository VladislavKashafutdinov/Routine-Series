// Backend API shapes — snake_case fields, dates as RFC3339 strings.

export interface ApiActivity {
  id: number;
  name: string;
  archived: boolean;
  created_at: string;
}

export interface ApiSeriesDefinition {
  id: number;
  activity_id: number;
  series_length: number;
  reward: number;
  currency: string;
  created_at: string;
}

/** Activity together with its latest series definition (POST/GET responses). */
export interface ApiActivityWithDef extends ApiActivity {
  definition?: ApiSeriesDefinition;
}

/** GET /api/v1/data — activity together with all its dependent data. */
export interface ApiActivityData extends ApiActivity {
  series_definitions: ApiSeriesDefinition[];
  completions: ApiCompletion[];
  reward_issues: ApiRewardIssue[];
}

/** GET /api/v1/data response — the whole dataset in one payload. */
export interface ApiAllData {
  activities: ApiActivityData[];
}

export interface ApiCompletion {
  id: number;
  activity_id: number;
  date: string; // "YYYY-MM-DD"
}

/** POST /api/v1/completions/toggle response. */
export interface ApiToggleResponse {
  created: boolean;
  completion?: ApiCompletion;
}

export interface ApiRewardIssue {
  id: number;
  activity_id: number;
  date: string; // "YYYY-MM-DD"
  amount: number;
  currency: string;
}

/** GET /api/v1/reward-issues response. */
export interface ApiPaginatedRewardIssues {
  items: ApiRewardIssue[];
  total: number;
}

// ---- Export/import payload (camelCase, matches POST /api/v1/import) ----

export interface ExportActivity {
  id: number;
  name: string;
  archived: boolean;
  createdAt: string;
}

export interface ExportSeriesDefinition {
  id: number;
  activityId: number;
  seriesLength: number;
  reward: number;
  currency: string;
  createdAt: string;
}

export interface ExportCompletion {
  id: number;
  activityId: number;
  date: string;
}

export interface ExportRewardIssue {
  id: number;
  activityId: number;
  date: string;
  amount: number;
  currency: string;
}

export interface ExportPayload {
  activities: ExportActivity[];
  seriesDefinitions: ExportSeriesDefinition[];
  completions: ExportCompletion[];
  rewardIssues: ExportRewardIssue[];
}

/** POST /api/v1/import response. */
export interface ApiImportStats {
  activities: number;
  series_definitions: number;
  completions: number;
  reward_issues: number;
}

/** Unified error format returned by all endpoints. */
export interface ApiError {
  error: string;
}

/** GET /api/v1/auth/me response — the authenticated user. */
export interface ApiUser {
  id: number;
  email: string;
  created_at: string;
}

/** POST /api/v1/auth/verify response — tokens and the user. */
export interface ApiVerifyResponse {
  access_token: string;
  refresh_token: string;
  user: ApiUser;
}
