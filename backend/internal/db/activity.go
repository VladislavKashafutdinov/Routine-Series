package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/models"
)

// CreateActivity inserts an activity and its first series definition in a single transaction.
func CreateActivity(ctx context.Context, pool *pgxpool.Pool, name string, seriesLength int, reward float64, currency string) (*models.ActivityWithDef, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var a models.Activity
	err = tx.QueryRow(ctx,
		`INSERT INTO activities (name) VALUES ($1) RETURNING id, name, archived, created_at`,
		name,
	).Scan(&a.ID, &a.Name, &a.Archived, &a.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert activity: %w", err)
	}

	var def models.SeriesDefinition
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

	return &models.ActivityWithDef{
		Activity:   a,
		Definition: &def,
	}, nil
}

const activityWithDefQuery = `
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

// GetAllActive returns all non-archived activities with their latest series definition.
func GetAllActive(ctx context.Context, pool *pgxpool.Pool) ([]models.ActivityWithDef, error) {
	rows, err := pool.Query(ctx, activityWithDefQuery+` WHERE a.archived = false ORDER BY a.id`)
	if err != nil {
		return nil, fmt.Errorf("query activities: %w", err)
	}
	defer rows.Close()

	return scanActivityWithDefs(rows)
}

// GetAllArchived returns all archived activities with their latest series definition.
func GetAllArchived(ctx context.Context, pool *pgxpool.Pool) ([]models.ActivityWithDef, error) {
	rows, err := pool.Query(ctx, activityWithDefQuery+` WHERE a.archived = true ORDER BY a.id`)
	if err != nil {
		return nil, fmt.Errorf("query archived activities: %w", err)
	}
	defer rows.Close()

	return scanActivityWithDefs(rows)
}

// GetByID returns a single activity with its latest series definition, or nil if not found.
func GetByID(ctx context.Context, pool *pgxpool.Pool, id int) (*models.ActivityWithDef, error) {
	row := pool.QueryRow(ctx, activityWithDefQuery+` WHERE a.id = $1`, id)

	var a models.Activity
	var d models.SeriesDefinition
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

	return &models.ActivityWithDef{Activity: a, Definition: &d}, nil
}

// UpdateName updates the name of an activity by ID. Returns false if not found.
func UpdateName(ctx context.Context, pool *pgxpool.Pool, id int, name string) (bool, error) {
	tag, err := pool.Exec(ctx,
		`UPDATE activities SET name = $2 WHERE id = $1`,
		id, name,
	)
	if err != nil {
		return false, fmt.Errorf("update activity %d: %w", id, err)
	}
	return tag.RowsAffected() > 0, nil
}

func scanActivityWithDefs(rows pgx.Rows) ([]models.ActivityWithDef, error) {
	var results []models.ActivityWithDef
	for rows.Next() {
		var a models.Activity
		var d models.SeriesDefinition
		if err := rows.Scan(
			&a.ID, &a.Name, &a.Archived, &a.CreatedAt,
			&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan activity: %w", err)
		}
		results = append(results, models.ActivityWithDef{Activity: a, Definition: &d})
	}
	return results, rows.Err()
}
