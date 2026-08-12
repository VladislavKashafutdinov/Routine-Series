package api

// ErrorResponse is the unified error format for all API endpoints.
type ErrorResponse struct {
	Error string `json:"error"`
}
