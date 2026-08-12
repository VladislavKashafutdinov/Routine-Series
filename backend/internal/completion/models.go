package completion

// Completion represents a daily completion mark.
type Completion struct {
	ID         int    `json:"id"`
	ActivityID int    `json:"activity_id"`
	Date       string `json:"date"`
}
