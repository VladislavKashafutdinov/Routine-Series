package dataimport

import (
	"fmt"
	"time"

	"routine-series/backend/internal/activity"
	"routine-series/backend/internal/seriesdefinition"
)

// --- Import types (camelCase — matches frontend IndexedDB export format) ---

// Payload is the structure of an imported JSON file.
type Payload struct {
	Activities        []Activity        `json:"activities"`
	SeriesDefinitions []SeriesDefinition `json:"seriesDefinitions"`
	Completions       []Completion      `json:"completions"`
	RewardIssues      []RewardIssue     `json:"rewardIssues"`
}

// Activity matches the frontend activity export format.
type Activity struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Archived  bool   `json:"archived"`
	CreatedAt string `json:"createdAt"`
}

// SeriesDefinition matches the frontend seriesDefinition export format.
type SeriesDefinition struct {
	ID           int    `json:"id"`
	ActivityID   int    `json:"activityId"`
	SeriesLength int    `json:"seriesLength"`
	Reward       float64 `json:"reward"`
	Currency     string `json:"currency"`
	CreatedAt    string `json:"createdAt"`
}

// Completion matches the frontend completion export format.
type Completion struct {
	ID         int    `json:"id"`
	ActivityID int    `json:"activityId"`
	Date       string `json:"date"`
}

// RewardIssue matches the frontend rewardIssue export format.
type RewardIssue struct {
	ID         int     `json:"id"`
	ActivityID int     `json:"activityId"`
	Date       string  `json:"date"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
}

// Stats reports how many records were imported per table.
type Stats struct {
	Activities        int `json:"activities"`
	SeriesDefinitions int `json:"series_definitions"`
	Completions       int `json:"completions"`
	RewardIssues      int `json:"reward_issues"`
}

// -- Validation --

// Validate checks required fields in all arrays.
func (p Payload) Validate() error {
	for i, a := range p.Activities {
		if err := a.Validate(); err != nil {
			return fmt.Errorf("activities[%d]: %w", i, err)
		}
	}
	for i, d := range p.SeriesDefinitions {
		if err := d.Validate(); err != nil {
			return fmt.Errorf("seriesDefinitions[%d]: %w", i, err)
		}
	}
	for i, c := range p.Completions {
		if err := c.Validate(); err != nil {
			return fmt.Errorf("completions[%d]: %w", i, err)
		}
	}
	for i, ri := range p.RewardIssues {
		if err := ri.Validate(); err != nil {
			return fmt.Errorf("rewardIssues[%d]: %w", i, err)
		}
	}
	return nil
}

func (a Activity) Validate() error {
	if a.Name == "" {
		return fmt.Errorf("name is required")
	}
	return nil
}

func (d SeriesDefinition) Validate() error {
	if d.SeriesLength <= 0 {
		return fmt.Errorf("seriesLength > 0 required")
	}
	if d.Currency == "" {
		return fmt.Errorf("currency is required")
	}
	return nil
}

func (c Completion) Validate() error {
	if c.Date == "" {
		return fmt.Errorf("date is required")
	}
	return nil
}

func (ri RewardIssue) Validate() error {
	if ri.Currency == "" {
		return fmt.Errorf("currency is required")
	}
	if ri.Amount <= 0 {
		return fmt.Errorf("amount > 0 required")
	}
	return nil
}

// -- Converters --

// ToDBActivity converts an import activity to a DB activity.
func (a Activity) ToDBActivity() (activity.Activity, error) {
	t, err := time.Parse(time.RFC3339, a.CreatedAt)
	if err != nil {
		return activity.Activity{}, err
	}
	return activity.Activity{ID: a.ID, Name: a.Name, Archived: a.Archived, CreatedAt: t}, nil
}

// ToDBSeriesDefinition converts an import series definition to a DB series definition.
func (d SeriesDefinition) ToDBSeriesDefinition() (seriesdefinition.SeriesDefinition, error) {
	t, err := time.Parse(time.RFC3339, d.CreatedAt)
	if err != nil {
		return seriesdefinition.SeriesDefinition{}, err
	}
	return seriesdefinition.SeriesDefinition{
		ID: d.ID, ActivityID: d.ActivityID,
		SeriesLength: d.SeriesLength, Reward: d.Reward,
		Currency: d.Currency, CreatedAt: t,
	}, nil
}
