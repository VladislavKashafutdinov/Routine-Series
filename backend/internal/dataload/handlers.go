package dataload

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/api"
	"routine-series/backend/internal/auth"
)

// Handlers holds shared dependencies.
type Handlers struct {
	Pool *pgxpool.Pool
}

// Load godoc
//
//	@Summary		Load all data
//	@Description	Returns all activities of the user with their series definitions, completions and reward issues in a single payload.
//	@Tags			data
//	@Produce		json
//	@Param			activity_id	query		int		false	"Filter to a single activity"
//	@Success		200	{object}	Response
//	@Failure		400	{object}	api.ErrorResponse
//	@Failure		401	{object}	api.ErrorResponse
//	@Router			/data [get]
func (h *Handlers) Load(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.CurrentUserID(r.Context())
	if !ok {
		api.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	req := LoadRequest{}
	if raw := r.URL.Query().Get("activity_id"); raw != "" {
		id, err := strconv.Atoi(raw)
		if err != nil || id <= 0 {
			api.WriteError(w, http.StatusBadRequest, "activity_id must be a positive integer")
			return
		}
		req.ActivityID = id
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := Load(r.Context(), h.Pool, userID, req)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to load data")
		return
	}

	json.NewEncoder(w).Encode(res)
}
