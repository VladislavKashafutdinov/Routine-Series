package seriesdefinition

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
//	@Summary		Create series definition
//	@Description	Adds a new series definition version for an activity.
//	@Tags			series-definitions
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int				true	"Activity ID"
//	@Param			body	body		CreateRequest	true	"Series parameters"
//	@Success		201		{object}	SeriesDefinition
//	@Failure		400		{object}	api.ErrorResponse
//	@Failure		404		{object}	api.ErrorResponse
//	@Router			/activities/{id}/series-definitions [post]
func (h *Handlers) Create(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		api.WriteError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	def, err := Create(r.Context(), h.Pool, id, req.SeriesLength, req.Reward, req.Currency)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to create series definition")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(def)
}

// List godoc
//
//	@Summary		List series definitions
//	@Description	Returns all series definition versions for an activity, newest first.
//	@Tags			series-definitions
//	@Produce		json
//	@Param			id	path		int	true	"Activity ID"
//	@Success		200	{array}		SeriesDefinition
//	@Failure		400	{object}	api.ErrorResponse
//	@Router			/activities/{id}/series-definitions [get]
func (h *Handlers) List(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		api.WriteError(w, http.StatusBadRequest, "id must be a positive integer")
		return
	}

	defs, err := List(r.Context(), h.Pool, id)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to list series definitions")
		return
	}
	json.NewEncoder(w).Encode(defs)
}

// Delete godoc
//
//	@Summary		Delete series definition
//	@Description	Deletes a series definition version. Cannot delete the last remaining definition.
//	@Tags			series-definitions
//	@Produce		json
//	@Param			id		path		int	true	"Activity ID"
//	@Param			defId	path		int	true	"Series Definition ID"
//	@Success		204
//	@Failure		400	{object}	api.ErrorResponse
//	@Failure		404	{object}	api.ErrorResponse
//	@Failure		409	{object}	api.ErrorResponse
//	@Router			/activities/{id}/series-definitions/{defId} [delete]
func (h *Handlers) Delete(w http.ResponseWriter, r *http.Request) {
	defID, err := strconv.Atoi(chi.URLParam(r, "defId"))
	if err != nil || defID <= 0 {
		api.WriteError(w, http.StatusBadRequest, "defId must be a positive integer")
		return
	}

	found, isLast, err := Delete(r.Context(), h.Pool, defID)
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to delete series definition")
		return
	}
	if !found {
		api.WriteError(w, http.StatusNotFound, "series definition not found")
		return
	}
	if isLast {
		api.WriteError(w, http.StatusConflict, "cannot delete the last series definition")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
