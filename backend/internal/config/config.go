package config

import "os"

// Config holds server configuration.
type Config struct {
	Port string
}

// Load reads configuration from environment variables with defaults.
func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return Config{
		Port: port,
	}
}
