package completion

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/api"
)

// Handlers holds shared dependencies.
type Handlers struct {
	Pool *pgxpool.Pool
}

// Toggle godoc
//
//	@Summary		Toggle completion
//	@Description	Creates a completion mark for the given date if none exists; deletes it if one already exists.
//	@Tags			completions
//	@Accept			json
//	@Produce		json
//	@Param			body	body		ToggleRequest	true	"Completion data"
//	@Success		200		{object}	ToggleResponse
//	@Failure		400		{object}	api.ErrorResponse
//	@Router			/completions/toggle [post]
func (h *Handlers) Toggle(w http.ResponseWriter, r *http.Request) {
	var req ToggleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := Toggle(r.Context(), h.Pool, req.ActivityID, req.Date)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "toggle failed")
		return
	}

	json.NewEncoder(w).Encode(result)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(api.ErrorResponse{Error: message})
}
