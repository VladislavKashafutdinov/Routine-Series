package auth

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/api"
)

// Handlers holds shared dependencies for auth endpoints.
type Handlers struct {
	Pool   *pgxpool.Pool
	Config Config
}

// Me godoc
//
//	@Summary		Current user
//	@Description	Returns the authenticated user of the current session.
//	@Tags			auth
//	@Produce		json
//	@Success		200	{object}	User
//	@Failure		401	{object}	api.ErrorResponse
//	@Router			/auth/me [get]
func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := UserFromContext(r.Context())
	if !ok {
		api.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	json.NewEncoder(w).Encode(user)
}
