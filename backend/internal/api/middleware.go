package api

import (
	"net/http"
	"strings"
)

// ContentTypeJSON sets Content-Type: application/json on all responses.
func ContentTypeJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// CORS adds CORS headers for localhost (any port) and GitHub Pages origins.
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if isAllowedOrigin(origin) {
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

func isAllowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}

	// localhost with any port
	if strings.HasPrefix(origin, "http://localhost:") {
		return true
	}

	// GitHub Pages
	if strings.HasSuffix(origin, ".github.io") && (strings.HasPrefix(origin, "https://") || strings.HasPrefix(origin, "http://")) {
		return true
	}

	return false
}
