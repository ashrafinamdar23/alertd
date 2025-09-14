package main

import (
	"context"
	"flag"
	"log"
	"os/signal"
	"syscall"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/config"
	"github.com/ashrafinamdar23/alertd/pkg/deps"
	"github.com/ashrafinamdar23/alertd/pkg/httpserver"
	"github.com/ashrafinamdar23/alertd/pkg/logx"
)

func main() {

	var cfgPath string
	flag.StringVar(&cfgPath, "config", "config.yaml", "path to config.yaml")
	flag.Parse()

	cfg, err := config.Load(cfgPath)
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	logger := logx.New(cfg)
	logger.Info("starting alertd", "env", cfg.App.Env, "addr", cfg.App.HTTPAddr)

	// Graceful shutdown with SIGINT/SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	d, err := deps.New(ctx, cfg)
	if err != nil {
		log.Fatalf("deps init: %v", err)
	}
	defer d.Close()

	d.Log.Info("starting alertd", "env", d.Cfg.App.Env, "addr", d.Cfg.App.HTTPAddr)

	srv := httpserver.New(d)

	// Start HTTP
	go func() {
		if err := srv.Start(); err != nil && err.Error() != "http: Server closed" {
			logger.Error("http server error", "err", err)
		}
	}()

	// Wait for signal
	<-ctx.Done()
	logger.Info("shutdown signal received")

	// Graceful stop
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Stop(shutdownCtx); err != nil {
		logger.Error("graceful stop error", "err", err)
	}
	logger.Info("alertd has been stopped")
}
