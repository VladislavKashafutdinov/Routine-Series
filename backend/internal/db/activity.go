package db

import (
	"context"
	"fmt"

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
