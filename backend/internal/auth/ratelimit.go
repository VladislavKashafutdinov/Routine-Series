package auth

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Code request limits (in-memory fixed windows).
const (
	codeLimitPerEmail = 1
	codeEmailWindow   = time.Minute
	codeLimitPerIP    = 10
	codeIPWindow      = time.Hour
)

// rateLimiter is an in-memory fixed-window limiter — enough for a handful of
// users; the state is lost on restart, which is acceptable at this scale.
type rateLimiter struct {
	mu      sync.Mutex
	entries map[string]limitEntry
}

type limitEntry struct {
	windowStart time.Time
	count       int
}

// limit defines the window and max requests for one key.
type limit struct {
	window time.Duration
	max    int
}

func newRateLimiter() *rateLimiter {
	return &rateLimiter{entries: make(map[string]limitEntry)}
}

// allow reports whether the request is within the limit and records it.
func (rl *rateLimiter) allow(key string, l limit) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	e, ok := rl.entries[key]
	if !ok || now.Sub(e.windowStart) >= l.window {
		rl.entries[key] = limitEntry{windowStart: now, count: 1}
		return true
	}
	if e.count >= l.max {
		return false
	}
	e.count++
	rl.entries[key] = e
	return true
}

// clientIP returns the client IP: the first X-Forwarded-For entry (the app
// runs behind a proxy) or the RemoteAddr host.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if i := strings.IndexByte(xff, ','); i != -1 {
			return strings.TrimSpace(xff[:i])
		}
		return strings.TrimSpace(xff)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
