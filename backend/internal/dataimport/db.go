package dataimport

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/activity"
	"routine-series/backend/internal/completion"
	"routine-series/backend/internal/reward"
	"routine-series/backend/internal/seriesdefinition"
)

// ImportAll clears all tables and inserts the given data in a single transaction.
func ImportAll(
	ctx context.Context, pool *pgxpool.Pool,
	activities []activity.Activity,
	definitions []seriesdefinition.SeriesDefinition,
	completions []completion.Completion,
	rewardIssues []reward.RewardIssue,
) (Stats, error) {
	stats := Stats{}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return stats, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `TRUNCATE activities, series_definitions, completions, reward_issues RESTART IDENTITY CASCADE`)
	if err != nil {
		return stats, fmt.Errorf("truncate: %w", err)
	}

	if len(activities) > 0 {
		n, err := tx.CopyFrom(ctx,
			pgx.Identifier{"activities"},
			[]string{"id", "name", "archived", "created_at"},
			pgx.CopyFromSlice(len(activities), func(i int) ([]any, error) {
				a := activities[i]
				return []any{a.ID, a.Name, a.Archived, a.CreatedAt}, nil
			}),
		)
		if err != nil {
			return stats, fmt.Errorf("copy activities: %w", err)
		}
		stats.Activities = int(n)
	}

	if len(definitions) > 0 {
		n, err := tx.CopyFrom(ctx,
			pgx.Identifier{"series_definitions"},
			[]string{"id", "activity_id", "series_length", "reward", "currency", "created_at"},
			pgx.CopyFromSlice(len(definitions), func(i int) ([]any, error) {
				d := definitions[i]
				return []any{d.ID, d.ActivityID, d.SeriesLength, d.Reward, d.Currency, d.CreatedAt}, nil
			}),
		)
		if err != nil {
			return stats, fmt.Errorf("copy series_definitions: %w", err)
		}
		stats.SeriesDefinitions = int(n)
	}

	if len(completions) > 0 {
		n, err := tx.CopyFrom(ctx,
			pgx.Identifier{"completions"},
			[]string{"id", "activity_id", "date"},
			pgx.CopyFromSlice(len(completions), func(i int) ([]any, error) {
				c := completions[i]
				return []any{c.ID, c.ActivityID, c.Date}, nil
			}),
		)
		if err != nil {
			return stats, fmt.Errorf("copy completions: %w", err)
		}
		stats.Completions = int(n)
	}

	if len(rewardIssues) > 0 {
		n, err := tx.CopyFrom(ctx,
			pgx.Identifier{"reward_issues"},
			[]string{"id", "activity_id", "date", "amount", "currency"},
			pgx.CopyFromSlice(len(rewardIssues), func(i int) ([]any, error) {
				r := rewardIssues[i]
				return []any{r.ID, r.ActivityID, r.Date, r.Amount, r.Currency}, nil
			}),
		)
		if err != nil {
			return stats, fmt.Errorf("copy reward_issues: %w", err)
		}
		stats.RewardIssues = int(n)
	}

	sequences := []struct{ seq, table string }{
		{"activities_id_seq", "activities"},
		{"series_definitions_id_seq", "series_definitions"},
		{"completions_id_seq", "completions"},
		{"reward_issues_id_seq", "reward_issues"},
	}
	for _, s := range sequences {
		if _, err := tx.Exec(ctx,
			`SELECT setval($1, COALESCE((SELECT MAX(id) FROM `+pgx.Identifier{s.table}.Sanitize()+`), 0), true)`, s.seq,
		); err != nil {
			return stats, fmt.Errorf("reset sequence %s: %w", s.seq, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return stats, fmt.Errorf("commit tx: %w", err)
	}

	return stats, nil
}
