package models

import (
	"fmt"
	"strings"
	"time"
)

// Activity represents a tracked activity.
type Activity struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Archived  bool      `json:"archived"`
	CreatedAt time.Time `json:"created_at"`
}

// SeriesDefinition defines the parameters of a series for an activity.
type SeriesDefinition struct {
	ID           int       `json:"id"`
	ActivityID   int       `json:"activity_id"`
	SeriesLength int       `json:"series_length"`
	Reward       float64   `json:"reward"`
	Currency     string    `json:"currency"`
	CreatedAt    time.Time `json:"created_at"`
}

// ActivityWithDef is an activity together with its latest series definition.
type ActivityWithDef struct {
	Activity
	Definition *SeriesDefinition `json:"definition,omitempty"`
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

// CreateSeriesDefinitionRequest is the request body for creating a new series definition.
type CreateSeriesDefinitionRequest struct {
	SeriesLength int     `json:"series_length"`
	Reward       float64 `json:"reward"`
	Currency     string  `json:"currency"`
}

// Validate checks the request fields and returns an error if invalid.
func (r CreateSeriesDefinitionRequest) Validate() error {
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
