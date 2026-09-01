package dataload

import (
	"fmt"
	"time"

	"routine-series/backend/internal/completion"
	"routine-series/backend/internal/reward"
	"routine-series/backend/internal/seriesdefinition"
)

// ActivityData is one activity together with all its dependent data.
type ActivityData struct {
	ID                int                                 `json:"id"`
	Name              string                              `json:"name"`
	Archived          bool                                `json:"archived"`
	CreatedAt         time.Time                           `json:"created_at"`
	SeriesDefinitions []seriesdefinition.SeriesDefinition `json:"series_definitions"`
	Completions       []completion.Completion             `json:"completions"`
	RewardIssues      []reward.RewardIssue                `json:"reward_issues"`
}

// Response is the payload of GET /api/v1/data.
type Response struct {
	Activities []ActivityData `json:"activities"`
}

// LoadRequest holds the query parameters of the aggregated data endpoint.
type LoadRequest struct {
	// ActivityID filters the payload to a single activity; 0 means all.
	ActivityID int
}

// Validate checks the request fields and returns an error if invalid.
func (r LoadRequest) Validate() error {
	if r.ActivityID < 0 {
		return fmt.Errorf("activity_id must be a positive integer")
	}
	return nil
}
