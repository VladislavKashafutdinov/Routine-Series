package completion

import (
	"encoding/json"
	"net/http"
	"strconv"

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
		api.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := Toggle(r.Context(), h.Pool, req.ActivityID, req.Date)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "toggle failed")
		return
	}

	json.NewEncoder(w).Encode(result)
}

// List godoc
//
//	@Summary		List completions
//	@Description	Returns completions for an activity within a date range.
//	@Tags			completions
//	@Produce		json
//	@Param			activity_id	query		int		true	"Activity ID"
//	@Param			from		query		string	true	"Start date (YYYY-MM-DD)"
//	@Param			to			query		string	true	"End date (YYYY-MM-DD)"
//	@Success		200			{array}		Completion
//	@Failure		400			{object}	api.ErrorResponse
//	@Router			/completions [get]
func (h *Handlers) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	activityID, _ := strconv.Atoi(q.Get("activity_id"))
	req := ListRequest{
		ActivityID: activityID,
		From:       q.Get("from"),
		To:         q.Get("to"),
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	completions, err := ListByDateRange(r.Context(), h.Pool, req.ActivityID, req.From, req.To)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to list completions")
		return
	}

	json.NewEncoder(w).Encode(completions)
}
