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
