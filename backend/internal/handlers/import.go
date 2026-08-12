package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"routine-series/backend/internal/app"
	"routine-series/backend/internal/db"
	"routine-series/backend/internal/models"
)

// ImportData godoc
//
//	@Summary		Import data
//	@Description	Accepts a JSON file and imports its data (activities, seriesDefinitions, completions, rewardIssues). Truncates existing data first.
//	@Tags			import
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			file	formData	file	true	"JSON data dump"
//	@Success		200		{object}	models.ImportStats
//	@Failure		400		{object}	models.ErrorResponse
//	@Router			/import [post]
func ImportData(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Limit upload size to 10 MB.
		r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

		if err := r.ParseMultipartForm(10 << 20); err != nil {
			writeError(w, http.StatusBadRequest, "file too large (max 10 MB)")
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			writeError(w, http.StatusBadRequest, "missing 'file' field in form data")
			return
		}
		defer file.Close()

		var payload models.ImportPayload
		if err := json.NewDecoder(file).Decode(&payload); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON in uploaded file")
			return
		}
		if err := payload.Validate(); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Convert import types to DB types.
		activities := make([]models.Activity, 0, len(payload.Activities))
		for _, a := range payload.Activities {
			dbAct, err := a.ToDBActivity()
			if err != nil {
				writeError(w, http.StatusBadRequest, "invalid createdAt for activity "+fmt.Sprintf("%d", a.ID)+": "+err.Error())
				return
			}
			activities = append(activities, dbAct)
		}

		definitions := make([]models.SeriesDefinition, 0, len(payload.SeriesDefinitions))
		for _, d := range payload.SeriesDefinitions {
			dbDef, err := d.ToDBSeriesDefinition()
			if err != nil {
				writeError(w, http.StatusBadRequest, "invalid createdAt for seriesDefinition "+fmt.Sprintf("%d", d.ID)+": "+err.Error())
				return
			}
			definitions = append(definitions, dbDef)
		}

		completions := make([]models.Completion, 0, len(payload.Completions))
		for _, c := range payload.Completions {
			completions = append(completions, models.Completion{
				ID: c.ID, ActivityID: c.ActivityID, Date: c.Date,
			})
		}

		rewardIssues := make([]models.RewardIssue, 0, len(payload.RewardIssues))
		for _, ri := range payload.RewardIssues {
			rewardIssues = append(rewardIssues, models.RewardIssue{
				ID: ri.ID, ActivityID: ri.ActivityID, Date: ri.Date,
				Amount: ri.Amount, Currency: ri.Currency,
			})
		}

		stats, err := db.ImportAll(r.Context(), a.Pool, activities, definitions, completions, rewardIssues)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "import failed")
			return
		}

		json.NewEncoder(w).Encode(stats)
	}
}
