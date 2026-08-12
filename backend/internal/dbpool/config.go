package dbpool

import (
	"fmt"
	"os"
)

// Config holds database connection configuration.
type Config struct {
	DatabaseURL string
	MaxConns    int32
	MinConns    int32
}

// LoadConfig reads database configuration from environment variables.
func LoadConfig() (Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL environment variable is required")
	}
	return Config{
		DatabaseURL: databaseURL,
		MaxConns:    10,
		MinConns:    1,
	}, nil
}
