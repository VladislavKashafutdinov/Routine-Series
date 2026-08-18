package auth

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

// Gmail API (REST) sender — a separate implementation from the SMTP ones.
// Works from hosts where outbound SMTP to Google is blocked (datacenter IPs):
// everything goes over HTTPS 443. Used when GMAIL_API_* credentials are set.

const (
	gmailTokenURL = "https://oauth2.googleapis.com/token"
	gmailSendURL  = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
)

// gmailAPIConfig holds OAuth credentials for the Gmail API sender.
type gmailAPIConfig struct {
	clientID     string
	clientSecret string
	refreshToken string
}

// loadGmailAPIConfig reads Gmail API credentials from env and reports
// missing values with a clear error.
func loadGmailAPIConfig() (gmailAPIConfig, error) {
	cfg := gmailAPIConfig{
		clientID:     os.Getenv("GMAIL_API_CLIENT_ID"),
		clientSecret: os.Getenv("GMAIL_API_CLIENT_SECRET"),
		refreshToken: os.Getenv("GMAIL_API_REFRESH_TOKEN"),
	}
	var missing []string
	if cfg.clientID == "" {
		missing = append(missing, "GMAIL_API_CLIENT_ID")
	}
	if cfg.clientSecret == "" {
		missing = append(missing, "GMAIL_API_CLIENT_SECRET")
	}
	if cfg.refreshToken == "" {
		missing = append(missing, "GMAIL_API_REFRESH_TOKEN")
	}
	if len(missing) > 0 {
		return gmailAPIConfig{}, fmt.Errorf("gmailapi provider requires: %s", strings.Join(missing, ", "))
	}
	return cfg, nil
}

// Access token cache — the refresh token is exchanged for an access token
// (~1 hour lifetime) and cached between sends.
var (
	gmailTokenMu     sync.Mutex
	gmailAccessToken string
	gmailTokenExpiry time.Time
)

// gmailTokenValue returns a valid access token, refreshing it when expired.
func gmailTokenValue(cfg gmailAPIConfig) (string, error) {
	gmailTokenMu.Lock()
	defer gmailTokenMu.Unlock()

	if gmailAccessToken != "" && time.Now().Before(gmailTokenExpiry) {
		return gmailAccessToken, nil
	}

	form := url.Values{
		"client_id":     {cfg.clientID},
		"client_secret": {cfg.clientSecret},
		"grant_type":    {"refresh_token"},
		"refresh_token": {cfg.refreshToken},
	}
	res, err := http.PostForm(gmailTokenURL, form)
	if err != nil {
		return "", fmt.Errorf("gmail api token request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(res.Body, 512))
		return "", fmt.Errorf("gmail api token: HTTP %d: %s", res.StatusCode, string(body))
	}

	var payload struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("gmail api token decode: %w", err)
	}

	gmailAccessToken = payload.AccessToken
	// Refresh a minute early to avoid racing the expiry.
	gmailTokenExpiry = time.Now().Add(time.Duration(payload.ExpiresIn-60) * time.Second)
	return gmailAccessToken, nil
}

// sendCodeEmailGmailAPI delivers the login code via the Gmail API.
func sendCodeEmailGmailAPI(cfg gmailAPIConfig, to, code, from string) error {
	token, err := gmailTokenValue(cfg)
	if err != nil {
		return err
	}

	msg := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: Routine Series login code\r\n"+
			"Content-Type: text/plain; charset=utf-8\r\n"+
			"\r\n"+
			"Your login code: %s\r\n"+
			"It is valid for 10 minutes.\r\n",
		from, to, code,
	)
	raw := base64.RawURLEncoding.EncodeToString([]byte(msg))

	body, _ := json.Marshal(map[string]string{"raw": raw})
	req, err := http.NewRequest(http.MethodPost, gmailSendURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("gmail api send: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("gmail api send request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(io.LimitReader(res.Body, 512))
		return fmt.Errorf("gmail api send: HTTP %d: %s", res.StatusCode, string(respBody))
	}
	return nil
}
