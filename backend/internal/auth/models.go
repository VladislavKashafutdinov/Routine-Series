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
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
	if r.Email == "" || len(r.Email) > 255 {
		return fmt.Errorf("a valid email is required")
	}
	addr, err := mail.ParseAddress(r.Email)
	if err != nil || addr.Address != r.Email {
		return fmt.Errorf("a valid email is required")
	}
	return nil
}
