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
	"routine-series/backend/internal/config"
	"routine-series/backend/internal/middleware"
)

func main() {
	cfg := config.Load()

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

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}
	log.Println("server stopped")
}
