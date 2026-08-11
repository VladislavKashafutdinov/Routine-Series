package middleware

import (
	"log"
	"net/http"
	"time"
)

// Logger logs each request: method, path, status, duration.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wr := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(wr, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, wr.status, time.Since(start))
	})
}

// ContentTypeJSON sets Content-Type: application/json on all responses.
func ContentTypeJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture the status code.
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
