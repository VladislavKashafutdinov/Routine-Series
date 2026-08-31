// @title           Routine Series API
// @version         0.1.0
// @description     REST API for tracking daily activities, completions, and rewards.
// @BasePath        /api/v1

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	httpSwagger "github.com/swaggo/http-swagger/v2"
	"github.com/swaggo/swag"

	_ "routine-series/backend/docs"
	"routine-series/backend/internal/activity"
	"routine-series/backend/internal/api"
	"routine-series/backend/internal/app"
	"routine-series/backend/internal/auth"
	"routine-series/backend/internal/completion"
	"routine-series/backend/internal/dataimport"
	"routine-series/backend/internal/dbpool"
	"routine-series/backend/internal/health"
	"routine-series/backend/internal/reward"
	"routine-series/backend/internal/seriesdefinition"
)

// requestTimeout caps how long an authenticated request may run. A stalled
// DB query fails within this window instead of hanging until TCP gives up.
const requestTimeout = 15 * time.Second

func main() {
	dbCfg, err := dbpool.LoadConfig()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	corsCfg, err := api.LoadCORSConfig()
	if err != nil {
		log.Fatalf("cors config error: %v", err)
	}

	authCfg, err := auth.LoadConfig()
	if err != nil {
		log.Fatalf("auth config error: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := dbpool.NewPool(ctx, dbCfg)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}
	defer pool.Close()

	if err := dbpool.RunMigrations(dbCfg, "migrations"); err != nil {
		log.Fatalf("migrations error: %v", err)
	}

	r := chi.NewRouter()

	logger := app.StdLogger{}

	// Middleware stack
	r.Use(chimw.Recoverer)
	r.Use(api.CORS(corsCfg.AllowedOrigins))
	r.Use(app.Log)
	r.Use(api.ContentTypeJSON)

	// Swagger
	r.Get("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/index.html", http.StatusMovedPermanently)
	})
	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/api/v1/swagger.json"),
	))
	r.Get("/api/v1/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		doc, _ := swag.ReadDoc()
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(doc))
	})

	// Health check
	healthH := &health.Handlers{Pool: pool}
	r.Get("/api/v1/health", healthH.HealthCheck)

	// Auth
	authH := auth.NewHandlers(pool, authCfg, logger)
	r.Post("/api/v1/auth/code", authH.SendCode)
	r.Post("/api/v1/auth/verify", authH.Verify)
	r.Post("/api/v1/auth/refresh", authH.Refresh)
	r.Post("/api/v1/auth/logout", authH.Logout)
	r.With(api.RequestTimeout(requestTimeout), auth.RequireAuth(pool, logger)).Get("/api/v1/auth/me", authH.Me)

	// Data API — everything under RequireAuth (health stays public for the host).
	// RequestTimeout runs before RequireAuth so the auth DB query is covered
	// by the deadline too.
	r.Group(func(r chi.Router) {
		r.Use(api.RequestTimeout(requestTimeout))
		r.Use(auth.RequireAuth(pool, logger))

		// Activities
		actH := &activity.Handlers{Pool: pool}
		r.Get("/api/v1/activities", actH.ListActivities)
		r.Get("/api/v1/activities/archived", actH.ListArchivedActivities)
		r.Get("/api/v1/activities/{id}", actH.GetActivity)
		r.Patch("/api/v1/activities/{id}", actH.UpdateActivity)
		r.Delete("/api/v1/activities/{id}", actH.DeleteActivity)
		r.Post("/api/v1/activities/{id}/archive", actH.ArchiveActivity)
		r.Post("/api/v1/activities/{id}/restore", actH.RestoreActivity)
		r.Post("/api/v1/activities", actH.CreateActivity)

		// Series definitions
		sdefH := &seriesdefinition.Handlers{Pool: pool}
		r.Post("/api/v1/activities/{id}/series-definitions", sdefH.Create)
		r.Get("/api/v1/activities/{id}/series-definitions", sdefH.List)
		r.Delete("/api/v1/activities/{id}/series-definitions/{defId}", sdefH.Delete)

		// Completions
		complH := &completion.Handlers{Pool: pool}
		r.Get("/api/v1/completions", complH.List)
		r.Post("/api/v1/completions/toggle", complH.Toggle)

		// Rewards
		rewardH := &reward.Handlers{Pool: pool}
		r.Get("/api/v1/reward-issues", rewardH.List)
		r.Post("/api/v1/reward-issues", rewardH.Create)
		r.Patch("/api/v1/reward-issues/{id}", rewardH.Update)
		r.Delete("/api/v1/reward-issues/{id}", rewardH.Delete)
	})

	// Import may legitimately take longer than a regular request. Registered
	// outside the timed group with its own chain — timeout still runs before auth.
	importH := &dataimport.Handlers{Pool: pool, Logger: logger}
	r.With(api.RequestTimeout(time.Minute), auth.RequireAuth(pool, logger)).Post("/api/v1/import", importH.ImportData)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:        ":" + port,
		Handler:     r,
		ReadTimeout: 30 * time.Second,
		// Raised during the Neon investigation: a slow DB call must still be
		// able to deliver its real 5xx. A shorter WriteTimeout drops the
		// response, the gateway retries, and the client sees a misleading 200.
		// Revisit after a DB-level query timeout is in place.
		WriteTimeout: 5 * time.Minute,
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("server starting on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}
	log.Println("server stopped")
}
