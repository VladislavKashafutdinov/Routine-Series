package reward

import (
	"fmt"
	"regexp"
	"strings"
)

// RewardIssue represents a reward issuance record.
type RewardIssue struct {
	ID         int     `json:"id"`
	ActivityID int     `json:"activity_id"`
	Date       string  `json:"date" example:"2026-08-12"` // YYYY-MM-DD
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
}

// CreateRequest is the request body for creating a reward issue.
type CreateRequest struct {
	ActivityID int     `json:"activity_id" example:"1"`
	Date       string  `json:"date" example:"2026-08-12"` // YYYY-MM-DD
	Amount     float64 `json:"amount" example:"100"`
	Currency   string  `json:"currency" example:"₽"`
}

// PaginatedResponse wraps a list of reward issues with total count.
type PaginatedResponse struct {
	Items []RewardIssue `json:"items"`
	Total int           `json:"total"`
}

// UpdateRequest is the request body for updating a reward issue amount.
type UpdateRequest struct {
	Amount float64 `json:"amount" example:"150"`
}

// Validate checks the request fields and returns an error if invalid.
func (r UpdateRequest) Validate() error {
	if r.Amount <= 0 {
		return fmt.Errorf("amount must be greater than 0")
	}
	return nil
}

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// Validate checks the request fields and returns an error if invalid.
func (r CreateRequest) Validate() error {
	if r.ActivityID <= 0 {
		return fmt.Errorf("activity_id must be a positive integer")
	}
	if !dateRe.MatchString(r.Date) {
		return fmt.Errorf("date must be in YYYY-MM-DD format")
	}
	if r.Amount <= 0 {
		return fmt.Errorf("amount must be greater than 0")
	}
	if strings.TrimSpace(r.Currency) == "" {
		return fmt.Errorf("currency is required")
	}
	return nil
}
