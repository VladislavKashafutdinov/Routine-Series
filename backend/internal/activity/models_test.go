package activity

import (
	"errors"
	"strings"
	"testing"
)

func TestDependentsErrorReportsCountsAndUnwraps(t *testing.T) {
	err := &DependentsError{Completions: 2, RewardIssues: 1}

	if !errors.Is(err, ErrHasDependents) {
		t.Fatal("expected errors.Is(err, ErrHasDependents) to be true")
	}
	msg := err.Error()
	if !strings.Contains(msg, "completions=2") || !strings.Contains(msg, "reward_issues=1") {
		t.Fatalf("error message should include both counts, got %q", msg)
	}
}
