package logger

import (
	"docuvault-be/internal/config"
	"go.uber.org/zap"
)

func New(appEnv string) (*zap.Logger, error) {
	if appEnv == config.EnvProduction {
		return zap.NewProduction()
	}
	return zap.NewDevelopment()
}
