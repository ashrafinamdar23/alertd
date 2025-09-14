package config

import (
	"errors"
	"os"

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
