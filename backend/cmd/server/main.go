// @title           Routine Series API
// @version         0.1.0
// @description     REST API for tracking daily activities, completions, and rewards.
// @host            localhost:8080
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

	_ "routine-series/backend/docs"
	"routine-series/backend/internal/app"
	"routine-series/backend/internal/config"
	"routine-series/backend/internal/db"
	"routine-series/backend/internal/handlers"
	"routine-series/backend/internal/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}
	defer pool.Close()

	if err := db.RunMigrations(cfg.DatabaseURL, "migrations"); err != nil {
		log.Fatalf("migrations error: %v", err)
	}

	application := &app.App{Pool: pool}

	r := chi.NewRouter()

	// Middleware stack
	r.Use(chimw.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.ContentTypeJSON)

	// Swagger
	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/api/v1/swagger.json"),
	))
	r.Get("/api/v1/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "docs/swagger.json")
	})

	// Health check
	r.Get("/api/v1/health", handlers.HealthCheck(application))

	// Activities
	r.Get("/api/v1/activities", handlers.ListActivities(application))
	r.Get("/api/v1/activities/archived", handlers.ListArchivedActivities(application))
	r.Get("/api/v1/activities/{id}", handlers.GetActivity(application))
	r.Post("/api/v1/activities", handlers.CreateActivity(application))

	// Import
	r.Post("/api/v1/import", handlers.ImportData(application))

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("server starting on :%s", cfg.Port)
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
