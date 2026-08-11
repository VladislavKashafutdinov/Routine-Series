package app

import "github.com/jackc/pgx/v5/pgxpool"

// App holds shared dependencies injected into handlers.
type App struct {
	Pool *pgxpool.Pool
}
