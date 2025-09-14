package deps

import (
	"context"
	"database/sql"
	"log/slog"

	"github.com/ashrafinamdar23/alertd/pkg/config"
	"github.com/ashrafinamdar23/alertd/pkg/db"
	"github.com/ashrafinamdar23/alertd/pkg/logx"
)

type Deps struct {
	Cfg *config.Config
	Log *slog.Logger
	DB  *sql.DB
}

// New builds all shared dependencies (logger, DB, etc.).
func New(ctx context.Context, cfg *config.Config) (*Deps, error) {
	logger := logx.New(cfg)

	sqlDB, err := db.Open(ctx, cfg)
	if err != nil {
		return nil, err
	}
	logger.Info("db connected", "driver", cfg.DB.Driver)

	return &Deps{
		Cfg: cfg,
		Log: logger,
		DB:  sqlDB,
	}, nil
}

// Close releases resources (DB, clients, etc.).
func (d *Deps) Close() error {
	if d.DB != nil {
		return d.DB.Close()
	}
	return nil
}
