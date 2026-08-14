package auth

import (
	"fmt"
	"net/mail"
	"strings"
	"time"
)

// User represents an app user.
type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// SendCodeRequest is the request body for requesting a login code.
type SendCodeRequest struct {
	Email string `json:"email"`
}

// Validate checks the email format and normalizes it to lowercase.
func (r *SendCodeRequest) Validate() error {
	email, err := normalizeEmail(r.Email)
	if err != nil {
		return err
	}
	r.Email = email
	return nil
}

// VerifyCodeRequest is the request body for verifying a login code.
type VerifyCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// Validate normalizes the email to lowercase and checks the code format.
func (r *VerifyCodeRequest) Validate() error {
	email, err := normalizeEmail(r.Email)
	if err != nil {
		return err
	}
	r.Email = email
	r.Code = strings.TrimSpace(r.Code)
	if len(r.Code) != 6 {
		return fmt.Errorf("a valid code is required")
	}
	return nil
}

// VerifyResponse is the response body for a successful code verification.
type VerifyResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

// RefreshRequest is the request body for refreshing a session.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Validate checks that the refresh token is present.
func (r *RefreshRequest) Validate() error {
	if strings.TrimSpace(r.RefreshToken) == "" {
		return fmt.Errorf("refresh_token is required")
	}
	return nil
}

// normalizeEmail trims and lowercases the email and checks its format.
func normalizeEmail(email string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || len(email) > 255 {
		return "", fmt.Errorf("a valid email is required")
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email {
		return "", fmt.Errorf("a valid email is required")
	}
	return email, nil
}
