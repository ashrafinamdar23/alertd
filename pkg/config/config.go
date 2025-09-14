package config

import (
	"errors"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	App struct {
		Env      string `yaml:"env"`       // dev|prod
		HTTPAddr string `yaml:"http_addr"` // ":8080"
	} `yaml:"app"`
	Log struct {
		Level  string `yaml:"level"`  // debug|info|warn|error
		Format string `yaml:"format"` // json|text
	} `yaml:"log"`
	DB struct {
		Driver          string `yaml:"driver"` // mysql
		DSN             string `yaml:"dsn"`
		MaxOpenConns    int    `yaml:"max_open_conns"`
		MaxIdleConns    int    `yaml:"max_idle_conns"`
		ConnMaxLifetime string `yaml:"conn_max_lifetime"`  // e.g. "30m"
		ConnMaxIdleTime string `yaml:"conn_max_idle_time"` // e.g. "10m"
	} `yaml:"db"`
	// Parsed durations (not in YAML)
	DBConnMaxLifetime time.Duration `yaml:"-"`
	DBConnMaxIdleTime time.Duration `yaml:"-"`
}

func defaults(c *Config) {
	if c.App.Env == "" {
		c.App.Env = "dev"
	}
	if c.App.HTTPAddr == "" {
		c.App.HTTPAddr = ":8080"
	}
	if c.Log.Level == "" {
		c.Log.Level = "info"
	}
	if c.Log.Format == "" {
		c.Log.Format = "json"
	}
	if c.DB.Driver == "" {
		c.DB.Driver = "mysql"
	}
	if c.DB.DSN == "" {
		c.DB.DSN = "alertd:alertd@tcp(127.0.0.1:3306)/alertd?parseTime=true&charset=utf8mb4&loc=UTC"
	}
	if c.DB.MaxOpenConns == 0 {
		c.DB.MaxOpenConns = 25
	}
	if c.DB.MaxIdleConns == 0 {
		c.DB.MaxIdleConns = 25
	}
	if c.DB.ConnMaxLifetime == "" {
		c.DB.ConnMaxLifetime = "30m"
	}
	if c.DB.ConnMaxIdleTime == "" {
		c.DB.ConnMaxIdleTime = "10m"
	}
}

func validate(c *Config) error {
	switch c.Log.Level {
	case "debug", "info", "warn", "error":
	default:
		return errors.New("log.level must be one of: debug|info|warn|error")
	}
	switch c.Log.Format {
	case "json", "text":
	default:
		return errors.New("log.format must be one of: json|text")
	}

	if c.DB.Driver != "mysql" {
		return errors.New("db.driver must be 'mysql'")
	}
	lft, err := time.ParseDuration(c.DB.ConnMaxLifetime)
	if err != nil {
		return err
	}
	idt, err := time.ParseDuration(c.DB.ConnMaxIdleTime)
	if err != nil {
		return err
	}
	c.DBConnMaxLifetime = lft
	c.DBConnMaxIdleTime = idt
	return nil
}

// Load reads YAML config from path. If path == "", uses "config.yaml".
func Load(path string) (*Config, error) {
	if path == "" {
		path = "config.yaml"
	}
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var c Config
	if err := yaml.NewDecoder(f).Decode(&c); err != nil {
		return nil, err
	}
	defaults(&c)
	if err := validate(&c); err != nil {
		return nil, err
	}
	return &c, nil
}
