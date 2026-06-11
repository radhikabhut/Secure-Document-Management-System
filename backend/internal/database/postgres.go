package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"docuvault-be/internal/config"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DB struct {
	Gorm *gorm.DB
	SQL  *sql.DB
}

func Connect(ctx context.Context, cfg config.DatabaseConfig, appEnv string, log *zap.Logger) (*DB, error) {
	if log == nil {
		log = zap.NewNop()
	}

	gormDB, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: gormLogger(appEnv),
	})
	if err != nil {
		return nil, fmt.Errorf("open postgres connection: %w", err)
	}

	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql database handle: %w", err)
	}

	configurePool(sqlDB)

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(pingCtx); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	log.Info("connected to postgres",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
		zap.String("database", cfg.Name),
	)

	return &DB{
		Gorm: gormDB,
		SQL:  sqlDB,
	}, nil
}

func (db *DB) Close() error {
	if db == nil || db.SQL == nil {
		return nil
	}
	return db.SQL.Close()
}

func configurePool(db *sql.DB) {
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxIdleTime(5 * time.Minute)
	db.SetConnMaxLifetime(30 * time.Minute)
}

func gormLogger(appEnv string) logger.Interface {
	if appEnv == config.EnvProduction {
		return logger.Default.LogMode(logger.Warn)
	}
	return logger.Default.LogMode(logger.Info)
}
