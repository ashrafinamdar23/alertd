package httpserver

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/config"
	"github.com/ashrafinamdar23/alertd/pkg/logx"
	"github.com/ashrafinamdar23/alertd/pkg/ui"
	"github.com/ashrafinamdar23/alertd/pkg/version"
	"github.com/gin-gonic/gin"
)

type Server struct {
	srv *http.Server
}

func New(cfg *config.Config, logger *slog.Logger) *Server {
	// Gin mode from env
	if cfg.App.Env == "prod" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(logx.Gin(logger))

	// Health
	r.GET("/healthz", func(c *gin.Context) { c.String(http.StatusOK, "ok") })
	r.GET("/readyz", func(c *gin.Context) { c.String(http.StatusOK, "ready") })

	// --- Mount UI last (at "/") ---
	// ui.Register(r, "/")
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/app")
	})

	// Reserve API namespace now (we'll add handlers later)
	api := r.Group("/api/v1")
	_ = api // placeholder to avoid unused var for now

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
			Addr:              cfg.App.HTTPAddr,
			Handler:           r,
			ReadHeaderTimeout: 5 * time.Second,
		},
	}
}

func (s *Server) Start() error                   { return s.srv.ListenAndServe() }
func (s *Server) Stop(ctx context.Context) error { return s.srv.Shutdown(ctx) }
