package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

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

		// Convert and validate activities.
		activities := make([]models.Activity, 0, len(payload.Activities))
		for i, a := range payload.Activities {
			if a.Name == "" {
				writeError(w, http.StatusBadRequest, "activities["+strconv.Itoa(i)+"]: name is required")
				return
			}
			dbAct, err := a.ToDBActivity()
			if err != nil {
				writeError(w, http.StatusBadRequest, "activities["+strconv.Itoa(i)+"]: invalid createdAt: "+err.Error())
				return
			}
			activities = append(activities, dbAct)
		}

		// Convert and validate series definitions.
		definitions := make([]models.SeriesDefinition, 0, len(payload.SeriesDefinitions))
		for i, d := range payload.SeriesDefinitions {
			if d.SeriesLength <= 0 {
				writeError(w, http.StatusBadRequest, "seriesDefinitions["+strconv.Itoa(i)+"]: seriesLength > 0 required")
				return
			}
			if d.Currency == "" {
				writeError(w, http.StatusBadRequest, "seriesDefinitions["+strconv.Itoa(i)+"]: currency is required")
				return
			}
			dbDef, err := d.ToDBSeriesDefinition()
			if err != nil {
				writeError(w, http.StatusBadRequest, "seriesDefinitions["+strconv.Itoa(i)+"]: invalid createdAt: "+err.Error())
				return
			}
			definitions = append(definitions, dbDef)
		}

		// Validate completions.
		completions := make([]models.Completion, 0, len(payload.Completions))
		for i, c := range payload.Completions {
			if c.Date == "" {
				writeError(w, http.StatusBadRequest, "completions["+strconv.Itoa(i)+"]: date is required")
				return
			}
			completions = append(completions, models.Completion{
				ID: c.ID, ActivityID: c.ActivityID, Date: c.Date,
			})
		}

		// Validate reward issues.
		rewardIssues := make([]models.RewardIssue, 0, len(payload.RewardIssues))
		for i, ri := range payload.RewardIssues {
			if ri.Currency == "" {
				writeError(w, http.StatusBadRequest, "rewardIssues["+strconv.Itoa(i)+"]: currency is required")
				return
			}
			if ri.Amount <= 0 {
				writeError(w, http.StatusBadRequest, "rewardIssues["+strconv.Itoa(i)+"]: amount > 0 required")
				return
			}
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
