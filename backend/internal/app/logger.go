package app

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// infoLog writes request lines for responses below 400 to stdout;
// warningLog and errorLog write 4xx and 5xx lines and internal errors
// to stderr, so hosts can classify them by severity.
var (
	infoLog    = log.New(os.Stdout, "INFO ", log.LstdFlags)
	warningLog = log.New(os.Stderr, "WARNING ", log.LstdFlags)
	errorLog   = log.New(os.Stderr, "ERROR ", log.LstdFlags)
)

// Log logs each request: method, path, status, duration.
// 5xx goes to stderr with an ERROR prefix, 4xx with a WARNING prefix,
// everything below 400 to stdout as INFO.
func Log(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wr := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(wr, r)
		line := fmt.Sprintf("%s %s %d %s", r.Method, r.URL.Path, wr.status, time.Since(start))
		switch {
		case wr.status >= 500:
			errorLog.Println(line)
		case wr.status >= 400:
			warningLog.Println(line)
		default:
			infoLog.Println(line)
		}
	})
}

type StdLogger struct{}

func (StdLogger) Errorf(format string, args ...any) {
	errorLog.Printf(format, args...)
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
