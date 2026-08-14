package auth

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"routine-series/backend/internal/api"
)

// Handlers holds shared dependencies for auth endpoints.
type Handlers struct {
	Pool   *pgxpool.Pool
	Config Config
}

// Me godoc
//
//	@Summary		Current user
//	@Description	Returns the authenticated user of the current session.
//	@Tags			auth
//	@Produce		json
//	@Success		200	{object}	User
//	@Failure		401	{object}	api.ErrorResponse
//	@Router			/auth/me [get]
func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := UserFromContext(r.Context())
	if !ok {
		api.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	json.NewEncoder(w).Encode(user)
}

// SendCode godoc
//
//	@Summary		Request login code
//	@Description	Sends a 6-digit login code to the given email. Always responds 200 for valid emails to not reveal whether the email is registered.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		SendCodeRequest	true	"Email"
//	@Success		200		{object}	map[string]string
//	@Failure		400		{object}	api.ErrorResponse
//	@Failure		500		{object}	api.ErrorResponse
//	@Router			/auth/code [post]
func (h *Handlers) SendCode(w http.ResponseWriter, r *http.Request) {
	var req SendCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	code, err := generateCode()
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to generate code")
		return
	}

	if err := UpsertLoginCode(r.Context(), h.Pool, req.Email, hashToken(code), loginCodeTTL); err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to store code")
		return
	}

	if err := h.Config.sendCodeEmail(req.Email, code); err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to send code")
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// Verify godoc
//
//	@Summary		Verify login code
//	@Description	Checks the login code, creates the user on first login and a new session, and returns access/refresh tokens with the user.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		VerifyCodeRequest	true	"Email and code"
//	@Success		200		{object}	VerifyResponse
//	@Failure		400		{object}	api.ErrorResponse
//	@Failure		500		{object}	api.ErrorResponse
//	@Router			/auth/verify [post]
func (h *Handlers) Verify(w http.ResponseWriter, r *http.Request) {
	var req VerifyCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := req.Validate(); err != nil {
		api.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, accessToken, refreshToken, err := VerifyCodeAndCreateSession(
		r.Context(), h.Pool, req.Email, req.Code, h.Config.AccessTTL, h.Config.RefreshTTL)
	if errors.Is(err, ErrInvalidCode) {
		api.WriteError(w, http.StatusBadRequest, ErrInvalidCode.Error())
		return
	}
	if err != nil {
		api.WriteError(w, http.StatusInternalServerError, "failed to verify code")
		return
	}

	json.NewEncoder(w).Encode(VerifyResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}
