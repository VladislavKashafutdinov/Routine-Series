package config

import (
	"fmt"
	"os"
)

// Config holds server configuration.
type Config struct {
	Port        string
	DatabaseURL string
}

// Load reads configuration from environment variables with defaults.
// Returns an error if DATABASE_URL is not set.
func Load() (Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return Config{
		Port:        port,
		DatabaseURL: databaseURL,
	}, nil
}
