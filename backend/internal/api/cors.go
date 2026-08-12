package api

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"strings"
)

// DefaultAllowedOrigins is used when ALLOWED_ORIGINS is not set:
// localhost with any port and GitHub Pages.
const DefaultAllowedOrigins = "http://localhost:*,https://*.github.io"

// CORSConfig holds CORS configuration.
type CORSConfig struct {
	// AllowedOrigins is a list of origin patterns (path.Match syntax:
	// `*` matches any run of non-`/` characters).
	AllowedOrigins []string
}

// LoadCORSConfig reads ALLOWED_ORIGINS (comma-separated patterns).
// Falls back to DefaultAllowedOrigins when the variable is unset or empty.
func LoadCORSConfig() (CORSConfig, error) {
	raw := os.Getenv("ALLOWED_ORIGINS")
	if raw == "" {
		raw = DefaultAllowedOrigins
	}

	var origins []string
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimSpace(o)
		if o == "" {
			return CORSConfig{}, fmt.Errorf("ALLOWED_ORIGINS contains an empty entry")
		}
		if _, err := path.Match(o, "probe"); err != nil {
			return CORSConfig{}, fmt.Errorf("ALLOWED_ORIGINS: invalid pattern %q: %v", o, err)
		}
		origins = append(origins, o)
	}
	return CORSConfig{AllowedOrigins: origins}, nil
}

// CORS returns middleware that adds CORS headers for allowed origins and
// short-circuits preflight (OPTIONS) requests.
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			if originAllowed(origin, allowedOrigins) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func originAllowed(origin string, patterns []string) bool {
	if origin == "" {
		return false
	}
	for _, p := range patterns {
		if ok, err := path.Match(p, origin); err == nil && ok {
			return true
		}
	}
	return false
}
