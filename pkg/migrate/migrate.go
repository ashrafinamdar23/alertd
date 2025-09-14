package migrate

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"log/slog"
	"sort"
	"strings"
	"time"

	appmigrations "github.com/ashrafinamdar23/alertd/migrations"
)

func Run(ctx context.Context, db *sql.DB, log *slog.Logger) error {
	if err := ensureTable(ctx, db); err != nil {
		return fmt.Errorf("ensure schema_migrations: %w", err)
	}

	// List *.sql files embedded in migrations/
	entries, err := fs.ReadDir(appmigrations.Files, ".")
	if err != nil {
		return err
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	applied, err := loadApplied(ctx, db)
	if err != nil {
		return err
	}

	for _, name := range files {
		if applied[name] {
			continue
		}

		b, err := fs.ReadFile(appmigrations.Files, name)
		if err != nil {
			return fmt.Errorf("read %s: %w", name, err)
		}
		sqlText := string(b)

		log.Info("applying migration", "version", name)

		// Execute each statement (avoid multiStatements DSN requirement)
		for _, stmt := range splitSQL(sqlText) {
			if stmt == "" {
				continue
			}
			if _, err := db.ExecContext(ctx, stmt); err != nil {
				return fmt.Errorf("exec %s: %w\nstmt: %s", name, err, stmt)
			}
		}

		if _, err := db.ExecContext(ctx,
			"INSERT INTO schema_migrations(version, applied_at) VALUES(?, ?)",
			name, time.Now().UTC(),
		); err != nil {
			return fmt.Errorf("record %s: %w", name, err)
		}
		log.Info("migration applied", "version", name)
	}
	return nil
}

func ensureTable(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
	return err
}

func loadApplied(ctx context.Context, db *sql.DB) (map[string]bool, error) {
	rows, err := db.QueryContext(ctx, `SELECT version FROM schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := make(map[string]bool)
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		m[v] = true
	}
	return m, rows.Err()
}

func splitSQL(s string) []string {
	raw := strings.Split(s, ";")
	out := make([]string, 0, len(raw))
	for _, r := range raw {
		stmt := strings.TrimSpace(r)
		if stmt != "" {
			out = append(out, stmt)
		}
	}
	return out
}
