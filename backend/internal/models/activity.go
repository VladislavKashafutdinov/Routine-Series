package models

import "time"

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

// CreateSeriesDefinitionRequest is the request body for creating a new series definition.
type CreateSeriesDefinitionRequest struct {
	SeriesLength int     `json:"series_length"`
	Reward       float64 `json:"reward"`
	Currency     string  `json:"currency"`
}

// CreateActivityRequest is the request body for creating an activity.
type CreateActivityRequest struct {
	Name         string  `json:"name"`
	SeriesLength int     `json:"series_length"`
	Reward       float64 `json:"reward"`
	Currency     string  `json:"currency"`
}
