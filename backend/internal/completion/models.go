package completion

import (
	"fmt"
	"regexp"
)

// Completion represents a daily completion mark.
type Completion struct {
	ID         int    `json:"id"`
	ActivityID int    `json:"activity_id"`
	Date       string `json:"date" example:"2026-08-12"` // YYYY-MM-DD
}

// ToggleRequest is the request body for toggling a completion.
type ToggleRequest struct {
	ActivityID int    `json:"activity_id" example:"1"`
	Date       string `json:"date" example:"2026-08-12"` // YYYY-MM-DD
}

// ToggleResponse is returned after a toggle operation.
type ToggleResponse struct {
	Created    bool        `json:"created"`
	Completion *Completion `json:"completion,omitempty"`
}

// ListRequest is the query parameters for listing completions.
type ListRequest struct {
	ActivityID int
	From       string
	To         string
}

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// Validate checks the request fields and returns an error if invalid.
func (r ToggleRequest) Validate() error {
	if r.ActivityID <= 0 {
		return fmt.Errorf("activity_id must be a positive integer")
	}
	if !dateRe.MatchString(r.Date) {
		return fmt.Errorf("date must be in YYYY-MM-DD format")
	}
	return nil
}

// Validate checks the request fields and returns an error if invalid.
func (r ListRequest) Validate() error {
	if r.ActivityID <= 0 {
		return fmt.Errorf("activity_id must be a positive integer")
	}
	if !dateRe.MatchString(r.From) || !dateRe.MatchString(r.To) {
		return fmt.Errorf("from and to must be in YYYY-MM-DD format")
	}
	if r.From > r.To {
		return fmt.Errorf("from must be <= to")
	}
	return nil
}
