CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE series_definitions (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL REFERENCES activities(id),
    series_length INT NOT NULL,
    reward NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_series_definitions_activity_created
    ON series_definitions(activity_id, created_at);

CREATE TABLE completions (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL REFERENCES activities(id),
    date DATE NOT NULL,
    UNIQUE(activity_id, date)
);

CREATE INDEX idx_completions_activity_date
    ON completions(activity_id, date);

CREATE TABLE reward_issues (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL REFERENCES activities(id),
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL
);

CREATE INDEX idx_reward_issues_activity_date
    ON reward_issues(activity_id, date);
