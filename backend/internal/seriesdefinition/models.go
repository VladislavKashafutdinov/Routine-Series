package seriesdefinition

import (
	"fmt"
	"strings"
	"time"
)

// SeriesDefinition defines the parameters of a series for an activity.
type SeriesDefinition struct {
	ID           int       `json:"id"`
	ActivityID   int       `json:"activity_id"`
	SeriesLength int       `json:"series_length"`
	Reward       float64   `json:"reward"`
	Currency     string    `json:"currency"`
	CreatedAt    time.Time `json:"created_at"`
}

// CreateRequest is the request body for creating a new series definition.
type CreateRequest struct {
	SeriesLength int     `json:"series_length"`
	Reward       float64 `json:"reward"`
	Currency     string  `json:"currency"`
}

// Validate checks the request fields and returns an error if invalid.
func (r CreateRequest) Validate() error {
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
