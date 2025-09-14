package logx

import (
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/config"
	"github.com/gin-gonic/gin"
)

func New(cfg *config.Config) *slog.Logger {
	lv := new(slog.LevelVar)
	switch cfg.Log.Level {
	case "debug":
		lv.Set(slog.LevelDebug)
	case "warn":
		lv.Set(slog.LevelWarn)
	case "error":
		lv.Set(slog.LevelError)
	default:
		lv.Set(slog.LevelInfo)
	}

	var h slog.Handler
	if cfg.Log.Format == "text" {
		h = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: lv})
	} else {
		h = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lv})
	}
	return slog.New(h)
}

// Gin middleware that logs requests via slog (single line per request)
func Gin(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next() // process

		lat := time.Since(start)
		if raw != "" {
			path = path + "?" + raw
		}
		logger.Info("http",
			"method", c.Request.Method,
			"path", path,
			"status", c.Writer.Status(),
			"size", c.Writer.Size(),
			"ip", c.ClientIP(),
			"ua", c.Request.UserAgent(),
			"latency_ms", lat.Milliseconds(),
		)
	}
}

// StdLogger adapts slog to an io.Writer-based std logger for GORM.
type stdLogger struct{ l *slog.Logger }

func StdLogger(l *slog.Logger) *log.Logger {
	return slog.NewLogLogger(l.Handler(), slog.LevelInfo)
}
