package reward

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
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

// Update updates fields of a reward issue by ID. Only non-nil fields in the
// request are applied (PATCH semantics). Returns the updated reward issue,
// or nil if not found.
func Update(ctx context.Context, pool *pgxpool.Pool, id int, req UpdateRequest) (*RewardIssue, error) {
	var sets []string
	var args []any
	argIdx := 2 // $1 is id

	if req.hasAmount() {
		sets = append(sets, fmt.Sprintf("amount = $%d", argIdx))
		args = append(args, *req.Amount)
		argIdx++
	}
	if req.hasDate() {
		sets = append(sets, fmt.Sprintf("date = $%d", argIdx))
		args = append(args, *req.Date)
		argIdx++
	}
	if req.hasCurrency() {
		sets = append(sets, fmt.Sprintf("currency = $%d", argIdx))
		args = append(args, *req.Currency)
		argIdx++
	}

	query := fmt.Sprintf(
		`UPDATE reward_issues SET %s WHERE id = $1
		 RETURNING id, activity_id, date::text, amount, currency`,
		strings.Join(sets, ", "),
	)

	allArgs := append([]any{id}, args...)

	var r RewardIssue
	err := pool.QueryRow(ctx, query, allArgs...).Scan(&r.ID, &r.ActivityID, &r.Date, &r.Amount, &r.Currency)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // not found
		}
		return nil, fmt.Errorf("update reward issue %d: %w", id, err)
	}
	return &r, nil
}

// DeleteByID deletes a reward issue by ID. Returns false if not found.
func DeleteByID(ctx context.Context, pool *pgxpool.Pool, id int) (bool, error) {
	tag, err := pool.Exec(ctx, `DELETE FROM reward_issues WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete reward issue %d: %w", id, err)
	}
	return tag.RowsAffected() > 0, nil
}
