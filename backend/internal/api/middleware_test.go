package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRequestTimeoutWrites504WhenDeadlineExceeded(t *testing.T) {
	handler := RequestTimeout(50 * time.Millisecond)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
		WriteError(w, http.StatusInternalServerError, "failed to authenticate")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusGatewayTimeout {
		t.Fatalf("expected status 504, got %d", rec.Code)
	}
	if want := "{\"error\":\"request timed out\"}\n"; rec.Body.String() != want {
		t.Fatalf("unexpected body: %q", rec.Body.String())
	}
}

func TestRequestTimeoutKeeps500WithoutDeadline(t *testing.T) {
	handler := RequestTimeout(time.Second)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		WriteError(w, http.StatusInternalServerError, "failed to authenticate")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rec.Code)
	}
	if want := "{\"error\":\"failed to authenticate\"}\n"; rec.Body.String() != want {
		t.Fatalf("unexpected body: %q", rec.Body.String())
	}
}
