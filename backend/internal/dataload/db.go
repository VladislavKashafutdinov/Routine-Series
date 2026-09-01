package dataload

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/completion"
	"routine-series/backend/internal/reward"
	"routine-series/backend/internal/seriesdefinition"
)

type activityRow struct {
	ID        int
	Name      string
	Archived  bool
	CreatedAt time.Time
}

// Load returns all activities of the user with their series definitions,
// completions up to `to`, and reward issues — the whole dataset in one payload.
func Load(ctx context.Context, pool *pgxpool.Pool, userID int, to string) (*Response, error) {
	activities, err := queryActivities(ctx, pool, userID)
	if err != nil {
		return nil, err
	}
	defs, err := queryDefinitions(ctx, pool, userID)
	if err != nil {
		return nil, err
	}
	comps, err := queryCompletions(ctx, pool, userID, to)
	if err != nil {
		return nil, err
	}
	issues, err := queryRewardIssues(ctx, pool, userID)
	if err != nil {
		return nil, err
	}
	return assemble(activities, defs, comps, issues), nil
}

func queryActivities(ctx context.Context, pool *pgxpool.Pool, userID int) ([]activityRow, error) {
	rows, err := pool.Query(ctx, `
		SELECT a.id, a.name, a.archived, a.created_at
		FROM activities a
		WHERE a.user_id = $1
		ORDER BY a.id`, userID)
	if err != nil {
		return nil, fmt.Errorf("query activities: %w", err)
	}
	defer rows.Close()

	results := []activityRow{}
	for rows.Next() {
		var a activityRow
		if err := rows.Scan(&a.ID, &a.Name, &a.Archived, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan activity: %w", err)
		}
		results = append(results, a)
	}
	return results, rows.Err()
}

func queryDefinitions(ctx context.Context, pool *pgxpool.Pool, userID int) ([]seriesdefinition.SeriesDefinition, error) {
	rows, err := pool.Query(ctx, `
		SELECT sd.id, sd.activity_id, sd.series_length, sd.reward, sd.currency, sd.created_at
		FROM series_definitions sd
		JOIN activities a ON a.id = sd.activity_id
		WHERE a.user_id = $1
		ORDER BY sd.created_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("query series definitions: %w", err)
	}
	defer rows.Close()

	results := []seriesdefinition.SeriesDefinition{}
	for rows.Next() {
		var d seriesdefinition.SeriesDefinition
		if err := rows.Scan(&d.ID, &d.ActivityID, &d.SeriesLength, &d.Reward, &d.Currency, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan series definition: %w", err)
		}
		results = append(results, d)
	}
	return results, rows.Err()
}

func queryCompletions(ctx context.Context, pool *pgxpool.Pool, userID int, to string) ([]completion.Completion, error) {
	rows, err := pool.Query(ctx, `
		SELECT c.id, c.activity_id, c.date::text
		FROM completions c
		JOIN activities a ON a.id = c.activity_id
		WHERE a.user_id = $1 AND c.date <= $2
		ORDER BY c.date`, userID, to)
	if err != nil {
		return nil, fmt.Errorf("query completions: %w", err)
	}
	defer rows.Close()

	results := []completion.Completion{}
	for rows.Next() {
		var c completion.Completion
		if err := rows.Scan(&c.ID, &c.ActivityID, &c.Date); err != nil {
			return nil, fmt.Errorf("scan completion: %w", err)
		}
		results = append(results, c)
	}
	return results, rows.Err()
}

func queryRewardIssues(ctx context.Context, pool *pgxpool.Pool, userID int) ([]reward.RewardIssue, error) {
	rows, err := pool.Query(ctx, `
		SELECT ri.id, ri.activity_id, ri.date::text, ri.amount, ri.currency
		FROM reward_issues ri
		JOIN activities a ON a.id = ri.activity_id
		WHERE a.user_id = $1
		ORDER BY ri.date DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("query reward issues: %w", err)
	}
	defer rows.Close()

	results := []reward.RewardIssue{}
	for rows.Next() {
		var r reward.RewardIssue
		if err := rows.Scan(&r.ID, &r.ActivityID, &r.Date, &r.Amount, &r.Currency); err != nil {
			return nil, fmt.Errorf("scan reward issue: %w", err)
		}
		results = append(results, r)
	}
	return results, rows.Err()
}

// assemble groups flat table rows by activity, keeping the activities order.
func assemble(
	activities []activityRow,
	defs []seriesdefinition.SeriesDefinition,
	comps []completion.Completion,
	issues []reward.RewardIssue,
) *Response {
	byID := make(map[int]*ActivityData, len(activities))
	for _, a := range activities {
		byID[a.ID] = &ActivityData{
			ID:                a.ID,
			Name:              a.Name,
			Archived:          a.Archived,
			CreatedAt:         a.CreatedAt,
			SeriesDefinitions: []seriesdefinition.SeriesDefinition{},
			Completions:       []completion.Completion{},
			RewardIssues:      []reward.RewardIssue{},
		}
	}
	for _, d := range defs {
		if act, ok := byID[d.ActivityID]; ok {
			act.SeriesDefinitions = append(act.SeriesDefinitions, d)
		}
	}
	for _, c := range comps {
		if act, ok := byID[c.ActivityID]; ok {
			act.Completions = append(act.Completions, c)
		}
	}
	for _, r := range issues {
		if act, ok := byID[r.ActivityID]; ok {
			act.RewardIssues = append(act.RewardIssues, r)
		}
	}

	res := &Response{Activities: make([]ActivityData, 0, len(byID))}
	for _, a := range activities {
		res.Activities = append(res.Activities, *byID[a.ID])
	}
	return res
}
