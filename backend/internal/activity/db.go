package activity

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/seriesdefinition"
)

// Create inserts an activity and its first series definition in a single transaction.
func Create(ctx context.Context, pool *pgxpool.Pool, userID int, name string, seriesLength int, reward float64, currency string) (*ActivityWithDef, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var a Activity
	err = tx.QueryRow(ctx,
		`INSERT INTO activities (name, user_id) VALUES ($1, $2) RETURNING id, name, archived, created_at`,
		name, userID,
	).Scan(&a.ID, &a.Name, &a.Archived, &a.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert activity: %w", err)
	}

	var def seriesdefinition.SeriesDefinition
	err = tx.QueryRow(ctx,
		`INSERT INTO series_definitions (activity_id, series_length, reward, currency)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, activity_id, series_length, reward, currency, created_at`,
		a.ID, seriesLength, reward, currency,
	).Scan(&def.ID, &def.ActivityID, &def.SeriesLength, &def.Reward, &def.Currency, &def.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert series definition: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return &ActivityWithDef{Activity: a, Definition: &def}, nil
}

const withDefQuery = `
SELECT a.id, a.name, a.archived, a.created_at,
       sd.id, sd.activity_id, sd.series_length, sd.reward, sd.currency, sd.created_at
FROM activities a
LEFT JOIN LATERAL (
    SELECT * FROM series_definitions
    WHERE activity_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
) sd ON true
`

// GetAllActive returns all non-archived activities of the user with their latest series definition.
func GetAllActive(ctx context.Context, pool *pgxpool.Pool, userID int) ([]ActivityWithDef, error) {
	rows, err := pool.Query(ctx, withDefQuery+` WHERE a.user_id = $1 AND a.archived = false ORDER BY a.id`, userID)
	if err != nil {
		return nil, fmt.Errorf("query activities: %w", err)
	}
	defer rows.Close()
	return scanWithDefs(rows)
}

// GetAllArchived returns all archived activities of the user with their latest series definition.
func GetAllArchived(ctx context.Context, pool *pgxpool.Pool, userID int) ([]ActivityWithDef, error) {
	rows, err := pool.Query(ctx, withDefQuery+` WHERE a.user_id = $1 AND a.archived = true ORDER BY a.id`, userID)
	if err != nil {
		return nil, fmt.Errorf("query archived activities: %w", err)
	}
	defer rows.Close()
	return scanWithDefs(rows)
}

// GetByID returns a single activity of the user with its latest series definition, or nil if not found.
func GetByID(ctx context.Context, pool *pgxpool.Pool, userID, id int) (*ActivityWithDef, error) {
	row := pool.QueryRow(ctx, withDefQuery+` WHERE a.user_id = $1 AND a.id = $2`, userID, id)

	var a Activity
	var d seriesdefinition.SeriesDefinition
	err := row.Scan(
		&a.ID, &a.Name, &a.Archived, &a.CreatedAt,
		&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("query activity %d: %w", id, err)
	}
	return &ActivityWithDef{Activity: a, Definition: &d}, nil
}

// UpdateName updates the name of the user's activity by ID. Returns false if not found.
func UpdateName(ctx context.Context, pool *pgxpool.Pool, userID, id int, name string) (bool, error) {
	tag, err := pool.Exec(ctx, `UPDATE activities SET name = $2 WHERE id = $1 AND user_id = $3`, id, name, userID)
	if err != nil {
		return false, fmt.Errorf("update activity %d: %w", id, err)
	}
	return tag.RowsAffected() > 0, nil
}

// Archive sets archived = true for the user's activity. Returns false if not found.
func Archive(ctx context.Context, pool *pgxpool.Pool, userID, id int) (bool, error) {
	tag, err := pool.Exec(ctx, `UPDATE activities SET archived = true WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return false, fmt.Errorf("archive activity %d: %w", id, err)
	}
	return tag.RowsAffected() > 0, nil
}

// Restore sets archived = false for the user's activity. Returns false if not found.
func Restore(ctx context.Context, pool *pgxpool.Pool, userID, id int) (bool, error) {
	tag, err := pool.Exec(ctx, `UPDATE activities SET archived = false WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return false, fmt.Errorf("restore activity %d: %w", id, err)
	}
	return tag.RowsAffected() > 0, nil
}

// HardDelete permanently deletes the user's activity and its series definitions.
// Refuses to delete if completions or reward issues exist (returns false, ErrHasDependents).
// Returns (true, nil) on success, (false, nil) if activity not found.
func HardDelete(ctx context.Context, pool *pgxpool.Pool, userID, id int) (bool, error) {
	// Check for dependents.
	var count int
	err := pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM completions c
		JOIN activities a ON a.id = c.activity_id
		WHERE c.activity_id = $1 AND a.user_id = $2`, id, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("check completions for activity %d: %w", id, err)
	}
	if count > 0 {
		return false, ErrHasDependents
	}

	err = pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM reward_issues ri
		JOIN activities a ON a.id = ri.activity_id
		WHERE ri.activity_id = $1 AND a.user_id = $2`, id, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("check reward_issues for activity %d: %w", id, err)
	}
	if count > 0 {
		return false, ErrHasDependents
	}

	// Delete series definitions first, then the activity itself.
	tx, err := pool.Begin(ctx)
	if err != nil {
		return false, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Make sure the activity belongs to the user before deleting dependents.
	var owned int
	err = tx.QueryRow(ctx, `SELECT 1 FROM activities WHERE id = $1 AND user_id = $2`, id, userID).Scan(&owned)
	if err == pgx.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("check activity %d: %w", id, err)
	}

	_, err = tx.Exec(ctx, `DELETE FROM series_definitions WHERE activity_id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete series_definitions for activity %d: %w", id, err)
	}

	tag, err := tx.Exec(ctx, `DELETE FROM activities WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return false, fmt.Errorf("delete activity %d: %w", id, err)
	}

	if err := tx.Commit(ctx); err != nil {
		return false, fmt.Errorf("commit tx: %w", err)
	}

	return tag.RowsAffected() > 0, nil
}

func scanWithDefs(rows pgx.Rows) ([]ActivityWithDef, error) {
	results := []ActivityWithDef{}
	for rows.Next() {
		var a Activity
		var d seriesdefinition.SeriesDefinition
		if err := rows.Scan(
			&a.ID, &a.Name, &a.Archived, &a.CreatedAt,
			&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan activity: %w", err)
		}
		results = append(results, ActivityWithDef{Activity: a, Definition: &d})
	}
	return results, rows.Err()
}
