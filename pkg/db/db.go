package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/config"
	_ "github.com/go-sql-driver/mysql" // mysql driver
)

func Open(ctx context.Context, cfg *config.Config) (*sql.DB, error) {
	dsn := cfg.DB.DSN
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	// Pooling
	db.SetMaxOpenConns(cfg.DB.MaxOpenConns)
	db.SetMaxIdleConns(cfg.DB.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.DBConnMaxLifetime)
	db.SetConnMaxIdleTime(cfg.DBConnMaxIdleTime)

	// Liveness
	ctxPing, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctxPing); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("db ping: %w", err)
	}
	return db, nil
}
