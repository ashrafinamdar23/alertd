package httpserver

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Server struct {
	srv *http.Server
}

func New(addr string) *Server {
	r := gin.New()
	// Middleware stack
	r.Use(gin.Recovery()) // panic safety
	r.Use(gin.Logger())   // basic request logs (swap to slog later)

	// Basic health
	r.GET("/healthz", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	// API versioning scaffold (we’ll add routes later)
	v1 := r.Group("/v1")
	_ = v1 // placeholder

	return &Server{
		srv: &http.Server{
			Addr:              addr,
			Handler:           r,
			ReadHeaderTimeout: 5 * time.Second,
		},
	}
}

func (s *Server) Start() error                   { return s.srv.ListenAndServe() }
func (s *Server) Stop(ctx context.Context) error { return s.srv.Shutdown(ctx) }
