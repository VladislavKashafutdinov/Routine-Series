package completion

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Toggle toggles a completion mark: if one exists for the date, deletes it; otherwise creates it.
// Returns whether the mark was created (true) or deleted (false), and the affected completion.
func Toggle(ctx context.Context, pool *pgxpool.Pool, activityID int, date string) (*ToggleResponse, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

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

// ListByDateRange returns all completions for an activity within the given date range.
func ListByDateRange(ctx context.Context, pool *pgxpool.Pool, activityID int, from, to string) ([]Completion, error) {
	rows, err := pool.Query(ctx,
		`SELECT id, activity_id, date::text FROM completions
		 WHERE activity_id = $1 AND date >= $2 AND date <= $3
		 ORDER BY date`,
		activityID, from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("query completions: %w", err)
	}
	defer rows.Close()

	var results []Completion
	for rows.Next() {
		var c Completion
		if err := rows.Scan(&c.ID, &c.ActivityID, &c.Date); err != nil {
			return nil, fmt.Errorf("scan completion: %w", err)
		}
		results = append(results, c)
	}
	return results, rows.Err()
}
