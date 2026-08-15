package seriesdefinition

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrActivityNotFound is returned when the activity doesn't exist or doesn't
// belong to the user.
var ErrActivityNotFound = errors.New("activity not found")

// Create inserts a new series definition for the user's activity.
func Create(ctx context.Context, pool *pgxpool.Pool, userID, activityID int, seriesLength int, reward float64, currency string) (*SeriesDefinition, error) {
	var d SeriesDefinition
	err := pool.QueryRow(ctx,
		`INSERT INTO series_definitions (activity_id, series_length, reward, currency)
		 SELECT $1, $2, $3, $4
		 WHERE EXISTS (SELECT 1 FROM activities WHERE id = $1 AND user_id = $5)
		 RETURNING id, activity_id, series_length, reward, currency, created_at`,
		activityID, seriesLength, reward, currency, userID,
	).Scan(&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrActivityNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("insert series definition: %w", err)
	}
	return &d, nil
}

// List returns all series definitions of the user's activity, newest first.
func List(ctx context.Context, pool *pgxpool.Pool, userID, activityID int) ([]SeriesDefinition, error) {
	rows, err := pool.Query(ctx,
		`SELECT sd.id, sd.activity_id, sd.series_length, sd.reward, sd.currency, sd.created_at
		 FROM series_definitions sd
		 JOIN activities a ON a.id = sd.activity_id
		 WHERE sd.activity_id = $1 AND a.user_id = $2
		 ORDER BY sd.created_at DESC`, activityID, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("query series definitions: %w", err)
	}
	defer rows.Close()

	results := []SeriesDefinition{}
	for rows.Next() {
		var d SeriesDefinition
		if err := rows.Scan(&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan series definition: %w", err)
		}
		results = append(results, d)
	}
	return results, rows.Err()
}

// Delete deletes a series definition of the user by ID.
// Returns (found, isLast) — isLast means it's the only remaining definition for the activity.
func Delete(ctx context.Context, pool *pgxpool.Pool, userID, id int) (found bool, isLast bool, err error) {
	var activityID int
	err = pool.QueryRow(ctx, `
		SELECT sd.activity_id FROM series_definitions sd
		JOIN activities a ON a.id = sd.activity_id
		WHERE sd.id = $1 AND a.user_id = $2`, id, userID).Scan(&activityID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, false, nil
		}
		return false, false, fmt.Errorf("query series definition %d: %w", id, err)
	}

	var count int
	err = pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM series_definitions sd
		JOIN activities a ON a.id = sd.activity_id
		WHERE sd.activity_id = $1 AND a.user_id = $2`, activityID, userID).Scan(&count)
	if err != nil {
		return false, false, fmt.Errorf("count series definitions: %w", err)
	}
	if count <= 1 {
		return true, true, nil
	}

	_, err = pool.Exec(ctx, `
		DELETE FROM series_definitions sd
		USING activities a
		WHERE sd.id = $1 AND a.id = sd.activity_id AND a.user_id = $2`, id, userID)
	if err != nil {
		return false, false, fmt.Errorf("delete series definition %d: %w", id, err)
	}
	return true, false, nil
}
