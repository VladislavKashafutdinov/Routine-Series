package auth

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Session TTL defaults: access 10 days, refresh 30 days.
const (
	defaultSMTPHost   = "smtp.gmail.com"
	defaultSMTPPort   = 587
	defaultAccessTTL  = 240 * time.Hour
	defaultRefreshTTL = 720 * time.Hour
)

// Config holds SMTP and session lifetime configuration.
type Config struct {
	// SMTPHost and SMTPPort point at the mail relay (Gmail by default).
	SMTPHost string
	SMTPPort int
	// SMTPUser is the Gmail address — SMTP login and From.
	SMTPUser string
	// SMTPPass is the Gmail app password.
	SMTPPass string
	// AccessTTL and RefreshTTL are session token lifetimes.
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

// LoadConfig reads auth configuration from environment variables.
// SMTP_HOST/SMTP_PORT fall back to Gmail's relay; GMAIL_ADDRESS and
// GMAIL_APP_PASSWORD are required.
func LoadConfig() (Config, error) {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		host = defaultSMTPHost
	}

	port := defaultSMTPPort
	if raw := os.Getenv("SMTP_PORT"); raw != "" {
		p, err := strconv.Atoi(raw)
		if err != nil {
			return Config{}, fmt.Errorf("SMTP_PORT must be a number: %v", err)
		}
		port = p
	}

	user := os.Getenv("GMAIL_ADDRESS")
	if user == "" {
		return Config{}, fmt.Errorf("GMAIL_ADDRESS environment variable is required")
	}

	pass := os.Getenv("GMAIL_APP_PASSWORD")
	if pass == "" {
		return Config{}, fmt.Errorf("GMAIL_APP_PASSWORD environment variable is required")
	}

	accessTTL, err := ttlFromEnv("SESSION_ACCESS_TTL", defaultAccessTTL)
	if err != nil {
		return Config{}, err
	}

	refreshTTL, err := ttlFromEnv("SESSION_REFRESH_TTL", defaultRefreshTTL)
	if err != nil {
		return Config{}, err
	}

	return Config{
		SMTPHost:   host,
		SMTPPort:   port,
		SMTPUser:   user,
		SMTPPass:   pass,
		AccessTTL:  accessTTL,
		RefreshTTL: refreshTTL,
	}, nil
}

// ttlFromEnv reads a Go duration (e.g. "240h") from the given variable,
// falling back to def when the variable is unset.
func ttlFromEnv(name string, def time.Duration) (time.Duration, error) {
	raw := os.Getenv(name)
	if raw == "" {
		return def, nil
	}
	ttl, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("%s must be a Go duration (e.g. \"240h\"): %v", name, err)
	}
	if ttl <= 0 {
		return 0, fmt.Errorf("%s must be positive", name)
	}
	return ttl, nil
}
