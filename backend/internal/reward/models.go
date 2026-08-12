package reward

// RewardIssue represents a reward issuance record.
type RewardIssue struct {
	ID         int     `json:"id"`
	ActivityID int     `json:"activity_id"`
	Date       string  `json:"date"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
}
