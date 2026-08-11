package models

import "time"

// --- Import types (camelCase — matches frontend IndexedDB export format) ---

// ImportPayload is the structure of an imported JSON file.
type ImportPayload struct {
	Activities        []ImportActivity        `json:"activities"`
	SeriesDefinitions []ImportSeriesDefinition `json:"seriesDefinitions"`
	Completions       []ImportCompletion      `json:"completions"`
	RewardIssues      []ImportRewardIssue     `json:"rewardIssues"`
}

// ImportActivity matches the frontend activity export format.
type ImportActivity struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Archived  bool   `json:"archived"`
	CreatedAt string `json:"createdAt"`
}

// ImportSeriesDefinition matches the frontend seriesDefinition export format.
type ImportSeriesDefinition struct {
	ID           int    `json:"id"`
	ActivityID   int    `json:"activityId"`
	SeriesLength int    `json:"seriesLength"`
	Reward       float64 `json:"reward"`
	Currency     string `json:"currency"`
	CreatedAt    string `json:"createdAt"`
}

// ImportCompletion matches the frontend completion export format.
type ImportCompletion struct {
	ID         int    `json:"id"`
	ActivityID int    `json:"activityId"`
	Date       string `json:"date"`
}

// ImportRewardIssue matches the frontend rewardIssue export format.
type ImportRewardIssue struct {
	ID         int     `json:"id"`
	ActivityID int     `json:"activityId"`
	Date       string  `json:"date"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
}

// --- DB types (snake_case — used for API responses and DB operations) ---

// Completion represents a daily completion mark.
type Completion struct {
	ID         int    `json:"id"`
	ActivityID int    `json:"activity_id"`
	Date       string `json:"date"`
}

// RewardIssue represents a reward issuance record.
type RewardIssue struct {
	ID         int     `json:"id"`
	ActivityID int     `json:"activity_id"`
	Date       string  `json:"date"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
}

// ImportStats reports how many records were imported per table.
type ImportStats struct {
	Activities        int `json:"activities"`
	SeriesDefinitions int `json:"series_definitions"`
	Completions       int `json:"completions"`
	RewardIssues      int `json:"reward_issues"`
}

// ToDBActivity converts an import activity to a DB activity.
func (a ImportActivity) ToDBActivity() (Activity, error) {
	t, err := time.Parse(time.RFC3339, a.CreatedAt)
	if err != nil {
		return Activity{}, err
	}
	return Activity{ID: a.ID, Name: a.Name, Archived: a.Archived, CreatedAt: t}, nil
}

// ToDBSeriesDefinition converts an import series definition to a DB series definition.
func (d ImportSeriesDefinition) ToDBSeriesDefinition() (SeriesDefinition, error) {
	t, err := time.Parse(time.RFC3339, d.CreatedAt)
	if err != nil {
		return SeriesDefinition{}, err
	}
	return SeriesDefinition{
		ID: d.ID, ActivityID: d.ActivityID,
		SeriesLength: d.SeriesLength, Reward: d.Reward,
		Currency: d.Currency, CreatedAt: t,
	}, nil
}
