package api

import (
	"encoding/json"
	"net/http"
)

// ErrorResponse is the unified error format for all API endpoints.
type ErrorResponse struct {
	Error string `json:"error"`
}

// WriteError writes error to http response in json with given status
func WriteError(w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}
