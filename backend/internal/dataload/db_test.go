package dataload

import (
	"testing"
	"time"

	"routine-series/backend/internal/completion"
	"routine-series/backend/internal/reward"
	"routine-series/backend/internal/seriesdefinition"
)

func TestAssembleGroupsDataByActivity(t *testing.T) {
	now := time.Now()

	activities := []activityRow{
		{ID: 1, Name: "first", Archived: false, CreatedAt: now},
		{ID: 2, Name: "second", Archived: true, CreatedAt: now},
	}
	defs := []seriesdefinition.SeriesDefinition{
		{ID: 11, ActivityID: 1, SeriesLength: 7, Reward: 10, Currency: "₽", CreatedAt: now},
		{ID: 21, ActivityID: 2, SeriesLength: 3, Reward: 5, Currency: "₽", CreatedAt: now},
	}
	comps := []completion.Completion{
		{ID: 31, ActivityID: 1, Date: "2026-08-01"},
	}
	issues := []reward.RewardIssue{
		{ID: 41, ActivityID: 2, Date: "2026-08-02", Amount: 5, Currency: "₽"},
	}

	res := assemble(activities, defs, comps, issues)

	if len(res.Activities) != 2 {
		t.Fatalf("expected 2 activities, got %d", len(res.Activities))
	}
	if res.Activities[0].ID != 1 || res.Activities[1].ID != 2 {
		t.Fatalf("activities order not preserved: %+v", res.Activities)
	}
	if len(res.Activities[0].SeriesDefinitions) != 1 || res.Activities[0].SeriesDefinitions[0].ID != 11 {
		t.Fatalf("definitions not grouped: %+v", res.Activities[0].SeriesDefinitions)
	}
	if len(res.Activities[0].Completions) != 1 || res.Activities[0].Completions[0].ID != 31 {
		t.Fatalf("completions not grouped: %+v", res.Activities[0].Completions)
	}
	if len(res.Activities[1].RewardIssues) != 1 || res.Activities[1].RewardIssues[0].ID != 41 {
		t.Fatalf("reward issues not grouped: %+v", res.Activities[1].RewardIssues)
	}
	// Empty slices must serialize as [], not null.
	if res.Activities[0].RewardIssues == nil || res.Activities[1].SeriesDefinitions == nil || res.Activities[1].Completions == nil {
		t.Fatalf("empty slices must not be nil: %+v", res.Activities)
	}
}
