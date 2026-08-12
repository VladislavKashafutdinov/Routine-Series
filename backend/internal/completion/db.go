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

	// Check if a completion already exists for this activity+date.
	var existingID int
	err = tx.QueryRow(ctx,
		`SELECT id FROM completions WHERE activity_id = $1 AND date = $2`,
		activityID, date,
	).Scan(&existingID)

	if err == pgx.ErrNoRows {
		// Not found — create one.
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

	// Found — delete it.
	_, err = tx.Exec(ctx, `DELETE FROM completions WHERE id = $1`, existingID)
	if err != nil {
		return nil, fmt.Errorf("delete completion: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return &ToggleResponse{Created: false}, nil
}
