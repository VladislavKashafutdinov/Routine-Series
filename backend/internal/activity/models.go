package activity

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"routine-series/backend/internal/seriesdefinition"
)

// ErrHasDependents is returned when an activity can't be hard-deleted
// because it has completions or reward issues.
var ErrHasDependents = errors.New("activity has completions or reward issues, archive instead")

// DependentsError reports which dependents block the hard delete — the counts
// make the 409 cause visible in logs.
type DependentsError struct {
	Completions  int
	RewardIssues int
}

func (e *DependentsError) Error() string {
	return fmt.Sprintf("activity has completions or reward issues (completions=%d, reward_issues=%d), archive instead", e.Completions, e.RewardIssues)
}

// Unwrap keeps errors.Is(err, ErrHasDependents) working.
func (e *DependentsError) Unwrap() error { return ErrHasDependents }

// Activity represents a tracked activity.
type Activity struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Archived  bool      `json:"archived"`
	CreatedAt time.Time `json:"created_at"`
}

// ActivityWithDef is an activity together with its latest series definition.
type ActivityWithDef struct {
	Activity
	Definition *seriesdefinition.SeriesDefinition `json:"definition,omitempty"`
}

// CreateActivityRequest is the request body for creating an activity.
type CreateActivityRequest struct {
	Name         string  `json:"name"`
	SeriesLength int     `json:"series_length"`
	Reward       float64 `json:"reward"`
	Currency     string  `json:"currency"`
}

// Validate checks the request fields and returns an error if invalid.
func (r CreateActivityRequest) Validate() error {
	r.Name = strings.TrimSpace(r.Name)
	if r.Name == "" {
		return fmt.Errorf("name is required")
	}
	if len(r.Name) > 255 {
		return fmt.Errorf("name must not exceed 255 characters")
	}
	if r.SeriesLength <= 0 {
		return fmt.Errorf("series_length must be greater than 0")
	}
	if r.Reward < 0 {
		return fmt.Errorf("reward must not be negative")
	}
	if strings.TrimSpace(r.Currency) == "" {
		return fmt.Errorf("currency is required")
	}
	return nil
}

// UpdateActivityRequest is the request body for renaming an activity.
type UpdateActivityRequest struct {
	Name string `json:"name"`
}

// Validate checks the request fields and returns an error if invalid.
func (r *UpdateActivityRequest) Validate() error {
	r.Name = strings.TrimSpace(r.Name)
	if r.Name == "" {
		return fmt.Errorf("name is required")
	}
	if len(r.Name) > 255 {
		return fmt.Errorf("name must not exceed 255 characters")
	}
	return nil
}
