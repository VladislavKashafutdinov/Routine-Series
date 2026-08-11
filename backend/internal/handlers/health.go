package handlers

import (
	"encoding/json"
	"net/http"

	"routine-series/backend/internal/app"
)

// HealthCheck godoc
//
//	@Summary		Health check
//	@Description	Returns ok if the server and database are reachable.
//	@Tags			system
//	@Success		200	{object}	map[string]string
//	@Router			/health [get]
func HealthCheck(a *app.App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := a.Pool.Ping(r.Context()); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(map[string]string{
				"status": "error",
				"error":  "database unreachable",
			})
			return
		}

		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
		})
	}
}
