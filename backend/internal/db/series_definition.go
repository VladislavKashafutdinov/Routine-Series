package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/models"
)

// CreateSeriesDefinition inserts a new series definition for an activity.
func CreateSeriesDefinition(ctx context.Context, pool *pgxpool.Pool, activityID int, seriesLength int, reward float64, currency string) (*models.SeriesDefinition, error) {
	var d models.SeriesDefinition
	err := pool.QueryRow(ctx,
		`INSERT INTO series_definitions (activity_id, series_length, reward, currency)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, activity_id, series_length, reward, currency, created_at`,
		activityID, seriesLength, reward, currency,
	).Scan(&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert series definition: %w", err)
	}
	return &d, nil
}

// GetSeriesDefinitions returns all series definitions for an activity, newest first.
func GetSeriesDefinitions(ctx context.Context, pool *pgxpool.Pool, activityID int) ([]models.SeriesDefinition, error) {
	rows, err := pool.Query(ctx,
		`SELECT id, activity_id, series_length, reward, currency, created_at
		 FROM series_definitions WHERE activity_id = $1
		 ORDER BY created_at DESC`, activityID,
	)
	if err != nil {
		return nil, fmt.Errorf("query series definitions: %w", err)
	}
	defer rows.Close()

	var results []models.SeriesDefinition
	for rows.Next() {
		var d models.SeriesDefinition
		if err := rows.Scan(&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan series definition: %w", err)
		}
		results = append(results, d)
	}
	return results, rows.Err()
}

// DeleteSeriesDefinition deletes a series definition by ID.
// Returns (found, isLast) — isLast means it's the only remaining definition for the activity.
func DeleteSeriesDefinition(ctx context.Context, pool *pgxpool.Pool, id int) (found bool, isLast bool, err error) {
	// Get activity_id for this definition.
	var activityID int
	err = pool.QueryRow(ctx, `SELECT activity_id FROM series_definitions WHERE id = $1`, id).Scan(&activityID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, false, nil
		}
		return false, false, fmt.Errorf("query series definition %d: %w", id, err)
	}

	// Count remaining definitions for this activity.
	var count int
	err = pool.QueryRow(ctx, `SELECT COUNT(*) FROM series_definitions WHERE activity_id = $1`, activityID).Scan(&count)
	if err != nil {
		return false, false, fmt.Errorf("count series definitions: %w", err)
	}
	if count <= 1 {
		return true, true, nil // isLast
	}

	_, err = pool.Exec(ctx, `DELETE FROM series_definitions WHERE id = $1`, id)
	if err != nil {
		return false, false, fmt.Errorf("delete series definition %d: %w", id, err)
	}
	return true, false, nil
}
