package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/api"
)

// RequireAuth returns middleware that validates the Bearer token, loads the
// session user from DB and puts the user into the request context. Requests
// without a valid token get 401.
func RequireAuth(pool *pgxpool.Pool, logger Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, ok := bearerToken(r.Header.Get("Authorization"))
			if !ok {
				api.WriteError(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			user, err := FindUserByAccessToken(r.Context(), pool, token)
			if errors.Is(err, ErrUnauthorized) {
				api.WriteError(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			if err != nil {
				logger.Errorf("authenticate %s %s: %v", r.Method, r.URL.Path, err)
				api.WriteError(w, http.StatusInternalServerError, "failed to authenticate")
				return
			}

			next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), user)))
		})
	}
}

// bearerToken extracts the token from a "Bearer <token>" header.
func bearerToken(header string) (string, bool) {
	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
		return "", false
	}
	return parts[1], true
}
