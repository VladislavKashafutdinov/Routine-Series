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

/** Unified error format returned by all endpoints. */
export interface ApiError {
  error: string;
}
