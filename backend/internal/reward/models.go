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

// UpdateRequest is the request body for updating a reward issue.
// All fields are optional; at least one must be provided (PATCH semantics).
type UpdateRequest struct {
	Amount   *float64 `json:"amount,omitempty" example:"150"`
	Date     *string  `json:"date,omitempty" example:"2026-08-12"` // YYYY-MM-DD
	Currency *string  `json:"currency,omitempty" example:"₽"`
}

// Validate checks the request fields and returns an error if invalid.
func (r UpdateRequest) Validate() error {
	// At least one field must be provided.
	if !r.hasAmount() && !r.hasDate() && !r.hasCurrency() {
		return fmt.Errorf("at least one field (amount, date, currency) must be provided")
	}
	if r.hasAmount() && *r.Amount <= 0 {
		return fmt.Errorf("amount must be greater than 0")
	}
	if r.hasDate() && !dateRe.MatchString(*r.Date) {
		return fmt.Errorf("date must be in YYYY-MM-DD format")
	}
	if r.hasCurrency() && strings.TrimSpace(*r.Currency) == "" {
		return fmt.Errorf("currency must not be empty")
	}
	return nil
}

func (r UpdateRequest) hasAmount() bool   { return r.Amount != nil }
func (r UpdateRequest) hasDate() bool     { return r.Date != nil }
func (r UpdateRequest) hasCurrency() bool { return r.Currency != nil }

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
