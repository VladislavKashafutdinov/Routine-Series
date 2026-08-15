package reward

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrActivityNotFound is returned when the activity doesn't exist or doesn't
// belong to the user.
var ErrActivityNotFound = errors.New("activity not found")

// Create inserts a new reward issue record for the user's activity.
func Create(ctx context.Context, pool *pgxpool.Pool, userID, activityID int, date string, amount float64, currency string) (*RewardIssue, error) {
	var r RewardIssue
	err := pool.QueryRow(ctx,
		`INSERT INTO reward_issues (activity_id, date, amount, currency)
		 SELECT $1, $2, $3, $4
		 WHERE EXISTS (SELECT 1 FROM activities WHERE id = $1 AND user_id = $5)
		 RETURNING id, activity_id, date::text, amount, currency`,
		activityID, date, amount, currency, userID,
	).Scan(&r.ID, &r.ActivityID, &r.Date, &r.Amount, &r.Currency)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrActivityNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("insert reward issue: %w", err)
	}
	return &r, nil
}

// ListByActivity returns paginated reward issues of the user's activity, newest first.
func ListByActivity(ctx context.Context, pool *pgxpool.Pool, userID, activityID int, limit, offset int) (*PaginatedResponse, error) {
	var total int
	err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM reward_issues ri
		 JOIN activities a ON a.id = ri.activity_id
		 WHERE ri.activity_id = $1 AND a.user_id = $2`, activityID, userID,
	).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("count reward issues: %w", err)
	}

	rows, err := pool.Query(ctx,
		`SELECT ri.id, ri.activity_id, ri.date::text, ri.amount, ri.currency
		 FROM reward_issues ri
		 JOIN activities a ON a.id = ri.activity_id
		 WHERE ri.activity_id = $1 AND a.user_id = $2
		 ORDER BY ri.date DESC
		 LIMIT $3 OFFSET $4`,
		activityID, userID, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("query reward issues: %w", err)
	}
	defer rows.Close()

	items := []RewardIssue{}
	for rows.Next() {
		var r RewardIssue
		if err := rows.Scan(&r.ID, &r.ActivityID, &r.Date, &r.Amount, &r.Currency); err != nil {
			return nil, fmt.Errorf("scan reward issue: %w", err)
		}
		items = append(items, r)
	}
	return &PaginatedResponse{Items: items, Total: total}, rows.Err()
}

// Update updates fields of a reward issue of the user by ID. Only non-nil
// fields in the request are applied (PATCH semantics). Returns the updated
// reward issue, or nil if not found.
func Update(ctx context.Context, pool *pgxpool.Pool, userID, id int, req UpdateRequest) (*RewardIssue, error) {
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
		`UPDATE reward_issues ri SET %s
		 FROM activities a
		 WHERE ri.id = $1 AND a.id = ri.activity_id AND a.user_id = $%d
		 RETURNING ri.id, ri.activity_id, ri.date::text, ri.amount, ri.currency`,
		strings.Join(sets, ", "),
		argIdx,
	)

	allArgs := append([]any{id}, args...)
	allArgs = append(allArgs, userID)

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

// DeleteByID deletes a reward issue of the user by ID. Returns false if not found.
func DeleteByID(ctx context.Context, pool *pgxpool.Pool, userID, id int) (bool, error) {
	tag, err := pool.Exec(ctx, `
		DELETE FROM reward_issues ri
		USING activities a
		WHERE ri.id = $1 AND a.id = ri.activity_id AND a.user_id = $2`, id, userID)
	if err != nil {
		return false, fmt.Errorf("delete reward issue %d: %w", id, err)
	}
	return tag.RowsAffected() > 0, nil
}
