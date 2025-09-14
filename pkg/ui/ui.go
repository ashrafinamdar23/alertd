package ui

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

//go:embed dist/*
var dist embed.FS

// Serves UI strictly under /app (no catch-all at root)
func Register(r *gin.Engine) {
	sub, err := fs.Sub(dist, "dist")
	if err != nil {
		panic(err)
	}

	// Static assets and runtime config under /app/*
	if assets, err := fs.Sub(dist, "dist/assets"); err == nil {
		r.StaticFS("/app/assets", http.FS(assets))
	}
	if cfg, err := fs.Sub(dist, "dist/config"); err == nil {
		r.StaticFS("/app/config", http.FS(cfg))
	}

	// Optional favicon
	r.GET("/app/favicon.ico", func(c *gin.Context) {
		data, err := fs.ReadFile(sub, "favicon.ico")
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		c.Data(http.StatusOK, "image/x-icon", data)
	})

	// Serve SPA shell at /app
	r.GET("/app", func(c *gin.Context) {
		data, err := fs.ReadFile(sub, "index.html")
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	})

	// SPA fallback only for /app/* routes
	r.NoRoute(func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}
		path := c.Request.URL.Path

		// never hijack API/health paths
		if strings.HasPrefix(path, "/api/") || path == "/healthz" || path == "/readyz" {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		// Only fallback for deep /app/* routes
		if strings.HasPrefix(path, "/app/") && strings.Contains(c.GetHeader("Accept"), "text/html") {
			data, err := fs.ReadFile(sub, "index.html")
			if err != nil {
				c.Status(http.StatusNotFound)
				return
			}
			c.Data(http.StatusOK, "text/html; charset=utf-8", data)
			return
		}

		c.Status(http.StatusNotFound)
	})
}
