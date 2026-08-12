package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"routine-series/backend/internal/app"
	"routine-series/backend/internal/db"
	"routine-series/backend/internal/models"
)

// CreateSeriesDef godoc
//
//	@Summary		Create series definition
//	@Description	Adds a new series definition version for an activity.
//	@Tags			series-definitions
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int									true	"Activity ID"
//	@Param			body	body		models.CreateSeriesDefinitionRequest	true	"Series parameters"
//	@Success		201		{object}	models.SeriesDefinition
//	@Failure		400		{object}	models.ErrorResponse
//	@Failure		404		{object}	models.ErrorResponse
//	@Router			/activities/{id}/series-definitions [post]
func CreateSeriesDef(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil || id <= 0 {
			writeError(w, http.StatusBadRequest, "id must be a positive integer")
			return
		}

		var req models.CreateSeriesDefinitionRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		if err := req.Validate(); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		def, err := db.CreateSeriesDefinition(r.Context(), a.Pool, id, req.SeriesLength, req.Reward, req.Currency)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create series definition")
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(def)
	}
}

// ListSeriesDefinitions godoc
//
//	@Summary		List series definitions
//	@Description	Returns all series definition versions for an activity, newest first.
//	@Tags			series-definitions
//	@Produce		json
//	@Param			id	path		int	true	"Activity ID"
//	@Success		200	{array}		models.SeriesDefinition
//	@Failure		400	{object}	models.ErrorResponse
//	@Router			/activities/{id}/series-definitions [get]
func ListSeriesDefinitions(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil || id <= 0 {
			writeError(w, http.StatusBadRequest, "id must be a positive integer")
			return
		}

		defs, err := db.GetSeriesDefinitions(r.Context(), a.Pool, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list series definitions")
			return
		}
		json.NewEncoder(w).Encode(defs)
	}
}

// DeleteSeriesDef godoc
//
//	@Summary		Delete series definition
//	@Description	Deletes a series definition version. Cannot delete the last remaining definition.
//	@Tags			series-definitions
//	@Produce		json
//	@Param			id		path		int	true	"Activity ID"
//	@Param			defId	path		int	true	"Series Definition ID"
//	@Success		204
//	@Failure		400	{object}	models.ErrorResponse
//	@Failure		404	{object}	models.ErrorResponse
//	@Failure		409	{object}	models.ErrorResponse
//	@Router			/activities/{id}/series-definitions/{defId} [delete]
func DeleteSeriesDef(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defID, err := strconv.Atoi(chi.URLParam(r, "defId"))
		if err != nil || defID <= 0 {
			writeError(w, http.StatusBadRequest, "defId must be a positive integer")
			return
		}

		found, isLast, err := db.DeleteSeriesDefinition(r.Context(), a.Pool, defID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to delete series definition")
			return
		}
		if !found {
			writeError(w, http.StatusNotFound, "series definition not found")
			return
		}
		if isLast {
			writeError(w, http.StatusConflict, "cannot delete the last series definition")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
