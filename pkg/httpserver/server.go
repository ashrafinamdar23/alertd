package httpserver

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/config"
	"github.com/ashrafinamdar23/alertd/pkg/deps"
	"github.com/ashrafinamdar23/alertd/pkg/logx"
	"github.com/ashrafinamdar23/alertd/pkg/ui"
	"github.com/ashrafinamdar23/alertd/pkg/version"
	"github.com/gin-gonic/gin"
)

type Server struct {
	srv *http.Server
	log *slog.Logger   // <- add this
	cfg *config.Config // <- and this
}

func New(d *deps.Deps) *Server {
	// Gin mode from env
	if d.Cfg.App.Env == "prod" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(logx.Gin(d.Log))

	// Health
	r.GET("/healthz", func(c *gin.Context) { c.String(http.StatusOK, "ok") })
	r.GET("/readyz", func(c *gin.Context) { c.String(http.StatusOK, "ready") })

	d.Log.Info("health endpoints registered", "paths", []string{"/healthz", "/readyz"})

	// --- Mount UI last (at "/") ---
	// ui.Register(r, "/")
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/app")
	})

	// Reserve API namespace now (we'll add handlers later)
	api := r.Group("/api/v1")
	_ = api // placeholder to avoid unused var for now
	d.Log.Info("api group ready", "base", "/api/v1")

	api.GET("/version", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"version": version.Version,
			"commit":  version.Commit,
			"builtAt": version.BuiltAt,
		})
	})

	ui.Register(r)

	return &Server{
		srv: &http.Server{
			Addr:              d.Cfg.App.HTTPAddr,
			Handler:           r,
			ReadHeaderTimeout: 5 * time.Second,
		},
		log: d.Log, // now valid
		cfg: d.Cfg, // now valid
	}
}

func (s *Server) Start() error {
	s.log.Info("http server listening", "addr", s.srv.Addr)
	if err := s.srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		s.log.Error("http server error", "err", err)
		return err
	}
	return nil
}

func (s *Server) Stop(ctx context.Context) error {
	s.log.Info("http server shutting down")
	return s.srv.Shutdown(ctx)
}
