package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

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

func writeError(w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{Error: message})
}
