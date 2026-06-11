package config

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLoadUsesEnvironment(t *testing.T) {
	t.Setenv("APP_NAME", "Secure Document Management System")
	t.Setenv("APP_ENV", EnvTest)
	t.Setenv("APP_PORT", "9090")
	t.Setenv("DB_HOST", "localhost")
	t.Setenv("DB_PORT", "5433")
	t.Setenv("DB_USER", "postgres")
	t.Setenv("DB_PASSWORD", "postgres")
	t.Setenv("DB_NAME", "secure_docs_test")
	t.Setenv("DB_SSLMODE", "disable")
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("JWT_EXPIRES_HOURS", "12")
	t.Setenv("UPLOAD_MAX_SIZE_MB", "25")
	t.Setenv("UPLOAD_ALLOWED_EXTENSIONS", "pdf,.txt, JPG")
	t.Setenv("STORAGE_PATH", "./tmp/storage")

	cfg, err := Load()
	require.NoError(t, err)
	require.Equal(t, "9090", cfg.App.Port)
	require.Equal(t, 5433, cfg.Database.Port)
	require.Equal(t, "secure_docs_test", cfg.Database.Name)
	require.Equal(t, 12, cfg.JWT.ExpiresHours)
	require.Equal(t, int64(25), cfg.Upload.MaxSizeMB)
	require.Equal(t, []string{"pdf", "txt", "jpg"}, cfg.Upload.AllowedExtensions)
	require.Equal(t, int64(25*1024*1024), cfg.Upload.MaxSizeBytes())
}

func TestValidateRequiresJWTSecret(t *testing.T) {
	cfg := &Config{
		App: AppConfig{
			Name: "Secure Document Management System",
			Env:  EnvTest,
			Port: "8080",
		},
		Database: DatabaseConfig{
			Host:    "localhost",
			Port:    5432,
			User:    "postgres",
			Name:    "secure_docs",
			SSLMode: "disable",
		},
		JWT: JWTConfig{
			Secret:       "",
			ExpiresHours: 24,
		},
		Upload: UploadConfig{
			MaxSizeMB:         50,
			AllowedExtensions: []string{"pdf"},
		},
		Storage: StorageConfig{
			Path: "./storage/documents",
		},
	}

	err := cfg.Validate()
	require.ErrorContains(t, err, "JWT_SECRET is required")
}
