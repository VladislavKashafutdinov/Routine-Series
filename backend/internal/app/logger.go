package app

import (
	"log"
	"net/http"
	"time"
)

// Log logs each request: method, path, status, duration.
func Log(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wr := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(wr, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, wr.status, time.Since(start))
	})
}

type StdLogger struct{}

func (StdLogger) Errorf(format string, args ...any) {
	log.Printf(format, args...)
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
