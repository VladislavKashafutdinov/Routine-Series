package reward

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Create inserts a new reward issue record.
func Create(ctx context.Context, pool *pgxpool.Pool, activityID int, date string, amount float64, currency string) (*RewardIssue, error) {
	var r RewardIssue
	err := pool.QueryRow(ctx,
		`INSERT INTO reward_issues (activity_id, date, amount, currency)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, activity_id, date::text, amount, currency`,
		activityID, date, amount, currency,
	).Scan(&r.ID, &r.ActivityID, &r.Date, &r.Amount, &r.Currency)
	if err != nil {
		return nil, fmt.Errorf("insert reward issue: %w", err)
	}
	return &r, nil
}

// ListByActivity returns paginated reward issues for an activity, newest first.
func ListByActivity(ctx context.Context, pool *pgxpool.Pool, activityID int, limit, offset int) (*PaginatedResponse, error) {
	var total int
	err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM reward_issues WHERE activity_id = $1`, activityID,
	).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("count reward issues: %w", err)
	}

	rows, err := pool.Query(ctx,
		`SELECT id, activity_id, date::text, amount, currency FROM reward_issues
		 WHERE activity_id = $1
		 ORDER BY date DESC
		 LIMIT $2 OFFSET $3`,
		activityID, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("query reward issues: %w", err)
	}
	defer rows.Close()

	var items []RewardIssue
	for rows.Next() {
		var r RewardIssue
		if err := rows.Scan(&r.ID, &r.ActivityID, &r.Date, &r.Amount, &r.Currency); err != nil {
			return nil, fmt.Errorf("scan reward issue: %w", err)
		}
		items = append(items, r)
	}
	return &PaginatedResponse{Items: items, Total: total}, rows.Err()
}
