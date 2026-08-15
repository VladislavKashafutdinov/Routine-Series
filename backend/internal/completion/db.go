package completion

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

// Toggle toggles a completion mark for the user's activity: if one exists for
// the date, deletes it; otherwise creates it.
// Returns whether the mark was created (true) or deleted (false), and the affected completion.
func Toggle(ctx context.Context, pool *pgxpool.Pool, userID, activityID int, date string) (*ToggleResponse, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var owned int
	err = tx.QueryRow(ctx,
		`SELECT 1 FROM activities WHERE id = $1 AND user_id = $2`,
		activityID, userID,
	).Scan(&owned)
	if err == pgx.ErrNoRows {
		return nil, ErrActivityNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("check activity %d: %w", activityID, err)
	}

	var existingID int
	err = tx.QueryRow(ctx,
		`SELECT id FROM completions WHERE activity_id = $1 AND date = $2`,
		activityID, date,
	).Scan(&existingID)

	if err == pgx.ErrNoRows {
		var c Completion
		err = tx.QueryRow(ctx,
			`INSERT INTO completions (activity_id, date) VALUES ($1, $2)
			 RETURNING id, activity_id, date::text`,
			activityID, date,
		).Scan(&c.ID, &c.ActivityID, &c.Date)
		if err != nil {
			return nil, fmt.Errorf("insert completion: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("commit tx: %w", err)
		}
		return &ToggleResponse{Created: true, Completion: &c}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query completion: %w", err)
	}

	_, err = tx.Exec(ctx, `DELETE FROM completions WHERE id = $1`, existingID)
	if err != nil {
		return nil, fmt.Errorf("delete completion: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return &ToggleResponse{Created: false}, nil
}

// ListByDateRange returns all completions of the user's activity within the given date range.
func ListByDateRange(ctx context.Context, pool *pgxpool.Pool, userID, activityID int, from, to string) ([]Completion, error) {
	rows, err := pool.Query(ctx,
		`SELECT c.id, c.activity_id, c.date::text
		 FROM completions c
		 JOIN activities a ON a.id = c.activity_id
		 WHERE c.activity_id = $1 AND a.user_id = $2 AND c.date >= $3 AND c.date <= $4
		 ORDER BY c.date`,
		activityID, userID, from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("query completions: %w", err)
	}
	defer rows.Close()

	results := []Completion{}
	for rows.Next() {
		var c Completion
		if err := rows.Scan(&c.ID, &c.ActivityID, &c.Date); err != nil {
			return nil, fmt.Errorf("scan completion: %w", err)
		}
		results = append(results, c)
	}
	return results, rows.Err()
}
