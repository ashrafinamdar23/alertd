package deps

import (
	"context"
	"database/sql"
	"log/slog"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/config"
	"github.com/ashrafinamdar23/alertd/pkg/db"
	"github.com/ashrafinamdar23/alertd/pkg/logx"
	"github.com/ashrafinamdar23/alertd/pkg/migrate"

	gmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	glogger "gorm.io/gorm/logger"
)

type Deps struct {
	Cfg  *config.Config
	Log  *slog.Logger
	DB   *sql.DB  // raw driver if needed
	Gorm *gorm.DB // ORM
}

func New(ctx context.Context, cfg *config.Config) (*Deps, error) {
	logger := logx.New(cfg)

	// Open raw DB (ping + pool)
	sqlDB, err := db.Open(ctx, cfg)
	if err != nil {
		return nil, err
	}
	logger.Info("db connected", "driver", cfg.DB.Driver)

	// Migrations
	if err := migrate.Run(ctx, sqlDB, logger); err != nil {
		return nil, err
	}
	logger.Info("db migrations complete")

	// Open GORM on top of DSN
	gormLogger := glogger.New(
		// use standard log.Default() binding through slog output
		logx.StdLogger(logger), // helper below or replace with glogger.Default.LogMode
		glogger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  glogger.Warn, // dev: Info, prod: Warn
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)
	gdb, err := gorm.Open(gmysql.Open(cfg.DB.DSN), &gorm.Config{Logger: gormLogger})
	if err != nil {
		return nil, err
	}
	// Pool from GORM
	if sqlDB2, err := gdb.DB(); err == nil {
		sqlDB2.SetMaxOpenConns(cfg.DB.MaxOpenConns)
		sqlDB2.SetMaxIdleConns(cfg.DB.MaxIdleConns)
		sqlDB2.SetConnMaxLifetime(cfg.DBConnMaxLifetime)
		sqlDB2.SetConnMaxIdleTime(cfg.DBConnMaxIdleTime)
	}

	return &Deps{
		Cfg:  cfg,
		Log:  logger,
		DB:   sqlDB,
		Gorm: gdb,
	}, nil
}

func (d *Deps) Close() error {
	if d.DB != nil {
		return d.DB.Close()
	}
	return nil
}
