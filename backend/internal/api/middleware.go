package api

import (
	"context"
	"net/http"
	"time"
)

// ContentTypeJSON sets Content-Type: application/json on all responses.
func ContentTypeJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// timeoutResponseWriter converts a 500 written after the request deadline
// into a 504, so clients can tell "timed out waiting for the DB" apart from
// a genuine internal error. The handler's original 500 body is discarded.
type timeoutResponseWriter struct {
	http.ResponseWriter
	ctx         context.Context
	intercepted bool
}

func (w *timeoutResponseWriter) WriteHeader(code int) {
	if code == http.StatusInternalServerError && w.ctx.Err() == context.DeadlineExceeded {
		w.intercepted = true
		WriteError(w.ResponseWriter, http.StatusGatewayTimeout, "request timed out")
		return
	}
	w.ResponseWriter.WriteHeader(code)
}

func (w *timeoutResponseWriter) Write(b []byte) (int, error) {
	if w.intercepted {
		return len(b), nil
	}
	return w.ResponseWriter.Write(b)
}

// RequestTimeout caps how long a request may run by canceling its context
// after the timeout. DB calls wrapped by the canceled context fail fast
// instead of hanging until the network resets the connection.
func RequestTimeout(timeout time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), timeout)
			defer cancel()
			next.ServeHTTP(&timeoutResponseWriter{ResponseWriter: w, ctx: ctx}, r.WithContext(ctx))
		})
	}
}
