package dataload

import (
	"fmt"
	"regexp"
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

// LoadRequest holds the query parameter of the aggregated data endpoint.
type LoadRequest struct {
	To string
}

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// Validate checks the request fields and returns an error if invalid.
func (r LoadRequest) Validate() error {
	if !dateRe.MatchString(r.To) {
		return fmt.Errorf("to must be in YYYY-MM-DD format")
	}
	return nil
}
