package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrUnauthorized is returned when the token is unknown or expired.
var ErrUnauthorized = errors.New("unauthorized")

// hashToken returns the hex SHA-256 of the token — only hashes are stored in DB.
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
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
