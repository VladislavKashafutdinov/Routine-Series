package reward

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/api"
)

// Handlers holds shared dependencies.
type Handlers struct {
	Pool *pgxpool.Pool
}

// Create godoc
//
//	@Summary		Create reward issue
//	@Description	Records a reward issuance for an activity.
//	@Tags			rewards
//	@Accept			json
//	@Produce		json
//	@Param			body	body		CreateRequest	true	"Reward data"
//	@Success		201		{object}	RewardIssue
//	@Failure		400		{object}	api.ErrorResponse
//	@Router			/reward-issues [post]
func (h *Handlers) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	issue, err := Create(r.Context(), h.Pool, req.ActivityID, req.Date, req.Amount, req.Currency)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create reward issue")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(issue)
}

// List godoc
//
//	@Summary		List reward issues
//	@Description	Returns paginated reward issues for an activity, newest first.
//	@Tags			rewards
//	@Produce		json
//	@Param			activity_id	query		int		true	"Activity ID"
//	@Param			limit		query		int		false	"Limit (default 20)"
//	@Param			offset		query		int		false	"Offset (default 0)"
//	@Success		200			{object}	PaginatedResponse
//	@Failure		400			{object}	api.ErrorResponse
//	@Router			/reward-issues [get]
func (h *Handlers) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	activityID, _ := strconv.Atoi(q.Get("activity_id"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	if activityID <= 0 {
		writeError(w, http.StatusBadRequest, "activity_id must be a positive integer")
		return
	}
	if limit <= 0 {
		limit = 20
	}

	result, err := ListByActivity(r.Context(), h.Pool, activityID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list reward issues")
		return
	}

	json.NewEncoder(w).Encode(result)
}

// Update godoc
//
//	@Summary		Update reward issue
//	@Description	Updates fields of a reward issue by ID. All fields are optional; at least one must be provided.
//	@Tags			rewards
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int				true	"Reward Issue ID"
//	@Param			body	body		UpdateRequest	true	"Fields to update"
//	@Success		200		{object}	RewardIssue
//	@Failure		400		{object}	api.ErrorResponse
//	@Failure		404		{object}	api.ErrorResponse
//	@Router			/reward-issues/{id} [patch]
func (h *Handlers) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := Update(r.Context(), h.Pool, id, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update reward issue")
		return
	}
	if updated == nil {
		writeError(w, http.StatusNotFound, "reward issue not found")
		return
	}

	json.NewEncoder(w).Encode(updated)
}

// Delete godoc
//
//	@Summary		Delete reward issue
//	@Description	Deletes a reward issue by ID.
//	@Tags			rewards
//	@Produce		json
//	@Param			id	path		int	true	"Reward Issue ID"
//	@Success		204
//	@Failure		400	{object}	api.ErrorResponse
//	@Failure		404	{object}	api.ErrorResponse
//	@Router			/reward-issues/{id} [delete]
func (h *Handlers) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	found, err := DeleteByID(r.Context(), h.Pool, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete reward issue")
		return
	}
	if !found {
		writeError(w, http.StatusNotFound, "reward issue not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(api.ErrorResponse{Error: message})
}
