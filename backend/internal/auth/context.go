package auth

import "context"

type userContextKey struct{}

// WithUser returns a context carrying the authenticated user.
func WithUser(ctx context.Context, u User) context.Context {
	return context.WithValue(ctx, userContextKey{}, u)
}

// UserFromContext returns the user set by WithUser.
func UserFromContext(ctx context.Context) (User, bool) {
	u, ok := ctx.Value(userContextKey{}).(User)
	return u, ok
}

// CurrentUserID returns the authenticated user's ID from the request context.
func CurrentUserID(ctx context.Context) (int, bool) {
	u, ok := UserFromContext(ctx)
	if !ok {
		return 0, false
	}
	return u.ID, true
}
