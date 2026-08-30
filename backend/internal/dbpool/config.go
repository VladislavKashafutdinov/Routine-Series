package dbpool

import (
	"fmt"
	"os"
	"time"
)

// Config holds database connection configuration.
type Config struct {
	DatabaseURL string
	MaxConns    int32
	MinConns    int32
	// ConnectTimeout bounds how long establishing a TCP connection to the DB may take.
	ConnectTimeout time.Duration
	// HealthCheckPeriod is how often idle connections are pinged and broken ones replaced.
	HealthCheckPeriod time.Duration
}

// LoadConfig reads database configuration from environment variables.
func LoadConfig() (Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL environment variable is required")
	}
	return Config{
		DatabaseURL:       databaseURL,
		MaxConns:          10,
		MinConns:          1,
		ConnectTimeout:    5 * time.Second,
		HealthCheckPeriod: 30 * time.Second,
	}, nil
}
