package activity

import (
	"encoding/json"
	"errors"
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

// CreateActivity godoc
//
//	@Summary		Create activity
//	@Description	Creates an activity together with its first series definition in a single transaction.
//	@Tags			activities
//	@Accept			json
//	@Produce		json
//	@Param			body	body		CreateActivityRequest	true	"Activity data"
//	@Success		201		{object}	ActivityWithDef
//	@Failure		400		{object}	api.ErrorResponse
//	@Router			/activities [post]
func (h *Handlers) CreateActivity(w http.ResponseWriter, r *http.Request) {
	var req CreateActivityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := Create(r.Context(), h.Pool, req.Name, req.SeriesLength, req.Reward, req.Currency)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to create activity")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

// ListActivities godoc
//
//	@Summary		List active activities
//	@Description	Returns all non-archived activities with their latest series definition.
//	@Tags			activities
//	@Produce		json
//	@Success		200	{array}		ActivityWithDef
//	@Router			/activities [get]
func (h *Handlers) ListActivities(w http.ResponseWriter, r *http.Request) {
	activities, err := GetAllActive(r.Context(), h.Pool)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to list activities")
		return
	}
	json.NewEncoder(w).Encode(activities)
}

// ListArchivedActivities godoc
//
//	@Summary		List archived activities
//	@Description	Returns all archived activities with their latest series definition.
//	@Tags			activities
//	@Produce		json
//	@Success		200	{array}		ActivityWithDef
//	@Router			/activities/archived [get]
func (h *Handlers) ListArchivedActivities(w http.ResponseWriter, r *http.Request) {
	activities, err := GetAllArchived(r.Context(), h.Pool)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to list archived activities")
		return
	}
	json.NewEncoder(w).Encode(activities)
}

// GetActivity godoc
//
//	@Summary		Get activity by ID
//	@Description	Returns a single activity with its latest series definition.
//	@Tags			activities
//	@Produce		json
//	@Param			id	path		int	true	"Activity ID"
//	@Success		200	{object}	ActivityWithDef
//	@Failure		400	{object}	api.ErrorResponse
//	@Failure		404	{object}	api.ErrorResponse
//	@Router			/activities/{id} [get]
func (h *Handlers) GetActivity(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		api.WriteError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	a, err := GetByID(r.Context(), h.Pool, id)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to get activity")
		return
	}
	if a == nil {
		api.WriteError(w, http.StatusNotFound, "activity not found")
		return
	}

	json.NewEncoder(w).Encode(a)
}

// UpdateActivity godoc
//
//	@Summary		Rename activity
//	@Description	Updates the name of an activity by ID.
//	@Tags			activities
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int					true	"Activity ID"
//	@Param			body	body		UpdateActivityRequest	true	"New name"
//	@Success		200		{object}	ActivityWithDef
//	@Failure		400		{object}	api.ErrorResponse
//	@Failure		404		{object}	api.ErrorResponse
//	@Router			/activities/{id} [patch]
func (h *Handlers) UpdateActivity(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		api.WriteError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	var req UpdateActivityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	found, err := UpdateName(r.Context(), h.Pool, id, req.Name)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to update activity")
		return
	}
	if !found {
		api.WriteError(w, http.StatusNotFound, "activity not found")
		return
	}

	a, _ := GetByID(r.Context(), h.Pool, id)
	json.NewEncoder(w).Encode(a)
}

// ArchiveActivity godoc
//
//	@Summary		Archive activity
//	@Description	Moves an activity to the archive (soft-delete).
//	@Tags			activities
//	@Produce		json
//	@Param			id	path		int	true	"Activity ID"
//	@Success		204
//	@Failure		400	{object}	api.ErrorResponse
//	@Failure		404	{object}	api.ErrorResponse
//	@Router			/activities/{id}/archive [post]
func (h *Handlers) ArchiveActivity(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		api.WriteError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	found, err := Archive(r.Context(), h.Pool, id)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to archive activity")
		return
	}
	if !found {
		api.WriteError(w, http.StatusNotFound, "activity not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RestoreActivity godoc
//
//	@Summary		Restore activity
//	@Description	Restores an activity from the archive.
//	@Tags			activities
//	@Produce		json
//	@Param			id	path		int	true	"Activity ID"
//	@Success		204
//	@Failure		400	{object}	api.ErrorResponse
//	@Failure		404	{object}	api.ErrorResponse
//	@Router			/activities/{id}/restore [post]
func (h *Handlers) RestoreActivity(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		api.WriteError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	found, err := Restore(r.Context(), h.Pool, id)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to restore activity")
		return
	}
	if !found {
		api.WriteError(w, http.StatusNotFound, "activity not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteActivity godoc
//
//	@Summary		Hard-delete activity
//	@Description	Permanently deletes an activity and its series definitions. Refuses if completions or reward issues exist (archive instead).
//	@Tags			activities
//	@Produce		json
//	@Param			id	path		int	true	"Activity ID"
//	@Success		204
//	@Failure		400	{object}	api.ErrorResponse
//	@Failure		404	{object}	api.ErrorResponse
//	@Failure		409	{object}	api.ErrorResponse
//	@Router			/activities/{id} [delete]
func (h *Handlers) DeleteActivity(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		api.WriteError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	deleted, err := HardDelete(r.Context(), h.Pool, id)
	if err != nil {
		if errors.Is(err, ErrHasDependents) {
			api.WriteError(w, http.StatusConflict, err.Error())
			return
		}
		api.WriteError(w, http.StatusInternalServerError, "failed to delete activity")
		return
	}
	if !deleted {
		api.WriteError(w, http.StatusNotFound, "activity not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
