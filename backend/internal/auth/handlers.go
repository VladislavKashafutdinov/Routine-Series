package auth

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handlers holds shared dependencies for auth endpoints.
type Handlers struct {
	Pool   *pgxpool.Pool
	Config Config
}
