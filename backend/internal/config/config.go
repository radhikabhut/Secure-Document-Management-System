package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

const (
	EnvDevelopment = "development"
	EnvProduction  = "production"
	EnvTest        = "test"
)

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Upload   UploadConfig
	SMTP     SMTPConfig
	Storage  StorageConfig
}

type AppConfig struct {
	Name string
	Env  string
	Port string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	Secret       string
	ExpiresHours int
}

func (c JWTConfig) Expiration() time.Duration {
	return time.Duration(c.ExpiresHours) * time.Hour
}

type UploadConfig struct {
	MaxSizeMB         int64
	AllowedExtensions []string
}

func (c UploadConfig) MaxSizeBytes() int64 {
	return c.MaxSizeMB * 1024 * 1024
}

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

func (c SMTPConfig) Enabled() bool {
	return c.Host != "" && c.Port > 0 && c.Username != "" && c.Password != "" && c.From != ""
}

type StorageConfig struct {
	Path string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		App: AppConfig{
			Name: getEnv("APP_NAME", "Secure Document Management System"),
			Env:  getEnv("APP_ENV", EnvDevelopment),
			Port: getEnv("APP_PORT", "8080"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "password"),
			Name:     getEnv("DB_NAME", "secure_docs"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:       getEnv("JWT_SECRET", ""),
			ExpiresHours: getEnvAsInt("JWT_EXPIRES_HOURS", 24),
		},
		Upload: UploadConfig{
			MaxSizeMB:         getEnvAsInt64("UPLOAD_MAX_SIZE_MB", 50),
			AllowedExtensions: getEnvAsStringSlice("UPLOAD_ALLOWED_EXTENSIONS", []string{"pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "txt"}),
		},
		SMTP: SMTPConfig{
			Host:     getEnv("SMTP_HOST", ""),
			Port:     getEnvAsInt("SMTP_PORT", 587),
			Username: getEnv("SMTP_USERNAME", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", ""),
		},
		Storage: StorageConfig{
			Path: getEnv("STORAGE_PATH", "./storage/documents"),
		},
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	var validationErrors []string

	if strings.TrimSpace(c.App.Name) == "" {
		validationErrors = append(validationErrors, "APP_NAME is required")
	}
	if !isSupportedEnvironment(c.App.Env) {
		validationErrors = append(validationErrors, "APP_ENV must be one of development, production, test")
	}
	if _, err := strconv.Atoi(c.App.Port); err != nil {
		validationErrors = append(validationErrors, "APP_PORT must be a valid TCP port")
	}

	if strings.TrimSpace(c.Database.Host) == "" {
		validationErrors = append(validationErrors, "DB_HOST is required")
	}
	if c.Database.Port <= 0 || c.Database.Port > 65535 {
		validationErrors = append(validationErrors, "DB_PORT must be between 1 and 65535")
	}
	if strings.TrimSpace(c.Database.User) == "" {
		validationErrors = append(validationErrors, "DB_USER is required")
	}
	if strings.TrimSpace(c.Database.Name) == "" {
		validationErrors = append(validationErrors, "DB_NAME is required")
	}
	if strings.TrimSpace(c.Database.SSLMode) == "" {
		validationErrors = append(validationErrors, "DB_SSLMODE is required")
	}

	if strings.TrimSpace(c.JWT.Secret) == "" {
		validationErrors = append(validationErrors, "JWT_SECRET is required")
	}
	if c.App.Env == EnvProduction && len(c.JWT.Secret) < 32 {
		validationErrors = append(validationErrors, "JWT_SECRET must be at least 32 characters in production")
	}
	if c.JWT.ExpiresHours <= 0 {
		validationErrors = append(validationErrors, "JWT_EXPIRES_HOURS must be greater than zero")
	}

	if c.Upload.MaxSizeMB <= 0 {
		validationErrors = append(validationErrors, "UPLOAD_MAX_SIZE_MB must be greater than zero")
	}
	if len(c.Upload.AllowedExtensions) == 0 {
		validationErrors = append(validationErrors, "UPLOAD_ALLOWED_EXTENSIONS must contain at least one extension")
	}

	if strings.TrimSpace(c.Storage.Path) == "" {
		validationErrors = append(validationErrors, "STORAGE_PATH is required")
	}

	if len(validationErrors) > 0 {
		return errors.New(strings.Join(validationErrors, "; "))
	}

	return nil
}

func (c DatabaseConfig) DSN() string {
	dsn := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(c.User, c.Password),
		Host:   fmt.Sprintf("%s:%d", c.Host, c.Port),
		Path:   c.Name,
	}
	query := dsn.Query()
	query.Set("sslmode", c.SSLMode)
	dsn.RawQuery = query.Encode()

	return dsn.String()
}

func (c AppConfig) Address() string {
	return ":" + c.Port
}

func isSupportedEnvironment(env string) bool {
	switch env {
	case EnvDevelopment, EnvProduction, EnvTest:
		return true
	default:
		return false
	}
}

func getEnv(key, fallback string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		return fallback
	}
	return strings.TrimSpace(value)
}

func getEnvAsInt(key string, fallback int) int {
	value, exists := os.LookupEnv(key)
	if !exists {
		return fallback
	}

	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}

	return parsed
}

func getEnvAsInt64(key string, fallback int64) int64 {
	value, exists := os.LookupEnv(key)
	if !exists {
		return fallback
	}

	parsed, err := strconv.ParseInt(strings.TrimSpace(value), 10, 64)
	if err != nil {
		return fallback
	}

	return parsed
}

func getEnvAsStringSlice(key string, fallback []string) []string {
	value, exists := os.LookupEnv(key)
	if !exists {
		return fallback
	}

	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		normalized := strings.ToLower(strings.TrimSpace(strings.TrimPrefix(part, ".")))
		if normalized != "" {
			result = append(result, normalized)
		}
	}

	if len(result) == 0 {
		return fallback
	}

	return result
}
