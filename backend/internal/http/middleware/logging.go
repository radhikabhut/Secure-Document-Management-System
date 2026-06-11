package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func RequestLogger(log *zap.Logger) gin.HandlerFunc {
	if log == nil {
		log = zap.NewNop()
	}

	return func(c *gin.Context) {
		startedAt := time.Now()
		c.Next()

		log.Info("http request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", time.Since(startedAt)),
			zap.String("client_ip", c.ClientIP()),
		)
	}
}

func Recovery(log *zap.Logger) gin.HandlerFunc {
	if log == nil {
		log = zap.NewNop()
	}

	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		log.Error("panic recovered", zap.Any("panic", recovered))
		c.AbortWithStatusJSON(500, gin.H{
			"success": false,
			"message": "Internal server error",
		})
	})
}
