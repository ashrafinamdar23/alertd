package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/httpserver"
)

func main() {
	// Graceful shutdown with SIGINT/SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	srv := httpserver.New(":8080")

	// Start HTTP
	go func() {
		if err := srv.Start(); err != nil && err.Error() != "http: Server closed" {
			log.Fatalf("http server error: %v", err)
		}
	}()

	// Wait for signal
	<-ctx.Done()
	log.Println("shutdown signal received")

	// Graceful stop
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Stop(shutdownCtx); err != nil {
		log.Printf("graceful stop error: %v", err)
	}
	log.Println("bye 👋")
}
