package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrUnauthorized is returned when the token is unknown or expired.
var ErrUnauthorized = errors.New("unauthorized")

// ErrInvalidCode is returned when the login code is unknown, wrong, or expired.
var ErrInvalidCode = errors.New("invalid or expired code")

// maxCodeAttempts is the number of wrong-code attempts before the code
// becomes invalid.
const maxCodeAttempts = 5

// loginCodeTTL is how long a login code stays valid.
const loginCodeTTL = 10 * time.Minute

// hashToken returns the hex SHA-256 of the token — only hashes are stored in DB.
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// generateCode returns a random 6-digit login code as a zero-padded string.
func generateCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", fmt.Errorf("generate login code: %w", err)
	}
	return fmt.Sprintf("%06d", n), nil
}

// UpsertLoginCode stores the hash of a new code for the email, invalidating
// any previous codes for that email (one row per email).
func UpsertLoginCode(ctx context.Context, pool *pgxpool.Pool, email, codeHash string, ttl time.Duration) error {
	_, err := pool.Exec(ctx, `
		INSERT INTO login_codes (email, code_hash, expires_at, attempts)
		VALUES ($1, $2, now() + make_interval(secs => $3), 0)
		ON CONFLICT (email) DO UPDATE
		SET code_hash = EXCLUDED.code_hash,
		    expires_at = EXCLUDED.expires_at,
		    attempts = 0
	`, email, codeHash, int(ttl.Seconds()))
	return err
}

// FindUserByAccessToken returns the user that owns the session with the given
// access token, or ErrUnauthorized if the token is unknown or expired.
func FindUserByAccessToken(ctx context.Context, pool *pgxpool.Pool, token string) (User, error) {
	var u User
	err := pool.QueryRow(ctx, `
		SELECT u.id, u.email, u.created_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.access_token_hash = $1 AND s.access_expires_at > now()
	`, hashToken(token)).Scan(&u.ID, &u.Email, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrUnauthorized
	}
	if err != nil {
		return User{}, err
	}
	return u, nil
}

// RotateSession exchanges a valid refresh token for a new pair of tokens
// (rotation); ErrUnauthorized when the token is unknown or expired.
func RotateSession(ctx context.Context, pool *pgxpool.Pool, refreshToken string, accessTTL, refreshTTL time.Duration) (User, string, string, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return User{}, "", "", err
	}
	defer tx.Rollback(ctx)

	var (
		sessionID int
		userID    int
	)
	err = tx.QueryRow(ctx, `
		SELECT s.id, s.user_id
		FROM sessions s
		WHERE s.refresh_token_hash = $1 AND s.refresh_expires_at > now()
		FOR UPDATE
	`, hashToken(refreshToken)).Scan(&sessionID, &userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, "", "", ErrUnauthorized
	}
	if err != nil {
		return User{}, "", "", err
	}

	var u User
	if err := tx.QueryRow(ctx, `
		SELECT id, email, created_at FROM users WHERE id = $1
	`, userID).Scan(&u.ID, &u.Email, &u.CreatedAt); err != nil {
		return User{}, "", "", err
	}

	accessToken, err := generateToken()
	if err != nil {
		return User{}, "", "", err
	}
	refreshNew, err := generateToken()
	if err != nil {
		return User{}, "", "", err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE sessions
		SET access_token_hash = $1, refresh_token_hash = $2,
		    access_expires_at = now() + make_interval(secs => $3),
		    refresh_expires_at = now() + make_interval(secs => $4)
		WHERE id = $5
	`, hashToken(accessToken), hashToken(refreshNew), int(accessTTL.Seconds()), int(refreshTTL.Seconds()), sessionID); err != nil {
		return User{}, "", "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, "", "", err
	}

	return u, accessToken, refreshNew, nil
}

// DeleteSessionByAccessToken removes the session identified by the token.
func DeleteSessionByAccessToken(ctx context.Context, pool *pgxpool.Pool, token string) error {
	_, err := pool.Exec(ctx, `
		DELETE FROM sessions WHERE access_token_hash = $1
	`, hashToken(token))
	return err
}

// generateToken returns a random hex-encoded session token.
func generateToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	return hex.EncodeToString(buf), nil
}

// VerifyCodeAndCreateSession checks the login code for the email in a
// transaction: wrong codes count against the attempt limit (after which the
// code is invalidated), a valid code is single-use, the user is created on
// first login, and a new session returns fresh access/refresh tokens.
func VerifyCodeAndCreateSession(ctx context.Context, pool *pgxpool.Pool, email, code string, accessTTL, refreshTTL time.Duration) (User, string, string, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return User{}, "", "", err
	}
	defer tx.Rollback(ctx)

	var (
		codeHash  string
		expiresAt time.Time
		attempts  int
	)
	err = tx.QueryRow(ctx, `
		SELECT code_hash, expires_at, attempts
		FROM login_codes
		WHERE email = $1
		FOR UPDATE
	`, email).Scan(&codeHash, &expiresAt, &attempts)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, "", "", ErrInvalidCode
	}
	if err != nil {
		return User{}, "", "", err
	}

	if attempts >= maxCodeAttempts || time.Now().After(expiresAt) {
		return User{}, "", "", ErrInvalidCode
	}

	if hashToken(code) != codeHash {
		attempts++
		if attempts >= maxCodeAttempts {
			// Code exhausted — invalidate it.
			if _, err := tx.Exec(ctx, `DELETE FROM login_codes WHERE email = $1`, email); err != nil {
				return User{}, "", "", err
			}
		} else {
			if _, err := tx.Exec(ctx, `UPDATE login_codes SET attempts = $1 WHERE email = $2`, attempts, email); err != nil {
				return User{}, "", "", err
			}
		}
		return User{}, "", "", ErrInvalidCode
	}

	// The code is single-use — remove it.
	if _, err := tx.Exec(ctx, `DELETE FROM login_codes WHERE email = $1`, email); err != nil {
		return User{}, "", "", err
	}

	// First login creates the user.
	if _, err := tx.Exec(ctx, `
		INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING
	`, email); err != nil {
		return User{}, "", "", err
	}

	var u User
	if err := tx.QueryRow(ctx, `
		SELECT id, email, created_at FROM users WHERE email = $1
	`, email).Scan(&u.ID, &u.Email, &u.CreatedAt); err != nil {
		return User{}, "", "", err
	}

	accessToken, err := generateToken()
	if err != nil {
		return User{}, "", "", err
	}
	refreshToken, err := generateToken()
	if err != nil {
		return User{}, "", "", err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO sessions (user_id, access_token_hash, refresh_token_hash, access_expires_at, refresh_expires_at)
		VALUES ($1, $2, $3, now() + make_interval(secs => $4), now() + make_interval(secs => $5))
	`, u.ID, hashToken(accessToken), hashToken(refreshToken), int(accessTTL.Seconds()), int(refreshTTL.Seconds())); err != nil {
		return User{}, "", "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, "", "", err
	}

	return u, accessToken, refreshToken, nil
}
