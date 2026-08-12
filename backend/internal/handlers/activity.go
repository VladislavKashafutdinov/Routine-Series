package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"routine-series/backend/internal/app"
	"routine-series/backend/internal/db"
	"routine-series/backend/internal/models"
)

// CreateActivity godoc
//
//	@Summary		Create activity
//	@Description	Creates an activity together with its first series definition in a single transaction.
//	@Tags			activities
//	@Accept			json
//	@Produce		json
//	@Param			body	body		models.CreateActivityRequest	true	"Activity data"
//	@Success		201		{object}	models.ActivityWithDef
//	@Failure		400		{object}	models.ErrorResponse
//	@Router			/activities [post]
func CreateActivity(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.CreateActivityRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		// Validation
		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}
		if len(req.Name) > 255 {
			writeError(w, http.StatusBadRequest, "name must not exceed 255 characters")
			return
		}
		if req.SeriesLength <= 0 {
			writeError(w, http.StatusBadRequest, "series_length must be greater than 0")
			return
		}
		if req.Reward < 0 {
			writeError(w, http.StatusBadRequest, "reward must not be negative")
			return
		}
		if strings.TrimSpace(req.Currency) == "" {
			writeError(w, http.StatusBadRequest, "currency is required")
			return
		}

		result, err := db.CreateActivity(r.Context(), a.Pool, req.Name, req.SeriesLength, req.Reward, req.Currency)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create activity")
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(result)
	}
}

// ListActivities godoc
//
//	@Summary		List active activities
//	@Description	Returns all non-archived activities with their latest series definition.
//	@Tags			activities
//	@Produce		json
//	@Success		200	{array}		models.ActivityWithDef
//	@Router			/activities [get]
func ListActivities(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activities, err := db.GetAllActive(r.Context(), a.Pool)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list activities")
			return
		}
		json.NewEncoder(w).Encode(activities)
	}
}

// ListArchivedActivities godoc
//
//	@Summary		List archived activities
//	@Description	Returns all archived activities with their latest series definition.
//	@Tags			activities
//	@Produce		json
//	@Success		200	{array}		models.ActivityWithDef
//	@Router			/activities/archived [get]
func ListArchivedActivities(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activities, err := db.GetAllArchived(r.Context(), a.Pool)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list archived activities")
			return
		}
		json.NewEncoder(w).Encode(activities)
	}
}

// GetActivity godoc
//
//	@Summary		Get activity by ID
//	@Description	Returns a single activity with its latest series definition.
//	@Tags			activities
//	@Produce		json
//	@Param			id	path		int	true	"Activity ID"
//	@Success		200	{object}	models.ActivityWithDef
//	@Failure		400	{object}	models.ErrorResponse
//	@Failure		404	{object}	models.ErrorResponse
//	@Router			/activities/{id} [get]
func GetActivity(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil || id <= 0 {
			writeError(w, http.StatusBadRequest, "id must be a positive integer")
			return
		}

		activity, err := db.GetByID(r.Context(), a.Pool, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to get activity")
			return
		}
		if activity == nil {
			writeError(w, http.StatusNotFound, "activity not found")
			return
		}

		json.NewEncoder(w).Encode(activity)
	}
}

// UpdateActivity godoc
//
//	@Summary		Rename activity
//	@Description	Updates the name of an activity by ID.
//	@Tags			activities
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int							true	"Activity ID"
//	@Param			body	body		models.UpdateActivityRequest	true	"New name"
//	@Success		200		{object}	models.ActivityWithDef
//	@Failure		400		{object}	models.ErrorResponse
//	@Failure		404		{object}	models.ErrorResponse
//	@Router			/activities/{id} [patch]
func UpdateActivity(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil || id <= 0 {
			writeError(w, http.StatusBadRequest, "id must be a positive integer")
			return
		}

		var req models.UpdateActivityRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}
		if len(req.Name) > 255 {
			writeError(w, http.StatusBadRequest, "name must not exceed 255 characters")
			return
		}

		found, err := db.UpdateName(r.Context(), a.Pool, id, req.Name)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update activity")
			return
		}
		if !found {
			writeError(w, http.StatusNotFound, "activity not found")
			return
		}

		// Return updated activity with definition.
		activity, _ := db.GetByID(r.Context(), a.Pool, id)
		json.NewEncoder(w).Encode(activity)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{Error: message})
}
