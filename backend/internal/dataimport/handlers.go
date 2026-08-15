package dataimport

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/activity"
	"routine-series/backend/internal/api"
	"routine-series/backend/internal/auth"
	"routine-series/backend/internal/completion"
	"routine-series/backend/internal/reward"
	"routine-series/backend/internal/seriesdefinition"
)

// Logger for logging in import endpoints
type Logger interface {
	Errorf(format string, args ...any)
}

// Handlers holds shared dependencies.
type Handlers struct {
	Pool   *pgxpool.Pool
	Logger Logger
}

// ImportData godoc
//
//	@Summary		Import data
//	@Description	Accepts a JSON file and imports its data (activities, seriesDefinitions, completions, rewardIssues). Truncates existing data first.
//	@Tags			import
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			file	formData	file	true	"JSON data dump"
//	@Success		200		{object}	Stats
//	@Failure		400		{object}	api.ErrorResponse
//	@Failure		401		{object}	api.ErrorResponse
//	@Router			/import [post]
func (h *Handlers) ImportData(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.CurrentUserID(r.Context())
	if !ok {
		api.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		api.WriteError(w, http.StatusBadRequest, "file too large (max 10 MB)")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		api.WriteError(w, http.StatusBadRequest, "missing 'file' field in form data")
		return
	}
	defer file.Close()

	var payload Payload
	if err := json.NewDecoder(file).Decode(&payload); err != nil {
		api.WriteError(w, http.StatusBadRequest, "invalid JSON in uploaded file")
		return
	}
	if err := payload.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	activities := make([]activity.Activity, 0, len(payload.Activities))
	for _, a := range payload.Activities {
		dbAct, err := a.ToDBActivity()
		if err != nil {
			api.WriteError(w, http.StatusBadRequest, "invalid createdAt for activity "+fmt.Sprintf("%d", a.ID)+": "+err.Error())
			return
		}
		activities = append(activities, dbAct)
	}

	definitions := make([]seriesdefinition.SeriesDefinition, 0, len(payload.SeriesDefinitions))
	for _, d := range payload.SeriesDefinitions {
		dbDef, err := d.ToDBSeriesDefinition()
		if err != nil {
			api.WriteError(w, http.StatusBadRequest, "invalid createdAt for seriesDefinition "+fmt.Sprintf("%d", d.ID)+": "+err.Error())
			return
		}
		definitions = append(definitions, dbDef)
	}

	completions := make([]completion.Completion, 0, len(payload.Completions))
	for _, c := range payload.Completions {
		completions = append(completions, completion.Completion{
			ID: c.ID, ActivityID: c.ActivityID, Date: c.Date,
		})
	}

	rewardIssues := make([]reward.RewardIssue, 0, len(payload.RewardIssues))
	for _, ri := range payload.RewardIssues {
		rewardIssues = append(rewardIssues, reward.RewardIssue{
			ID: ri.ID, ActivityID: ri.ActivityID, Date: ri.Date,
			Amount: ri.Amount, Currency: ri.Currency,
		})
	}

	stats, err := ImportAll(r.Context(), h.Pool, userID, activities, definitions, completions, rewardIssues)
	if err != nil {
		h.Logger.Errorf("import failed: %v", err)
		api.WriteError(w, http.StatusInternalServerError, "import failed")
		return
	}

	json.NewEncoder(w).Encode(stats)
}
