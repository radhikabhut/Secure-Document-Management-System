package auth

import (
	"testing"
	"time"

	"docuvault-be/internal/config"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

func TestJWTGenerateAndValidate(t *testing.T) {
	manager := NewJWTManager(config.JWTConfig{Secret: "test-secret", ExpiresHours: 24}, "docuvault-test")
	userID := uuid.New()
	now := time.Now().UTC().Add(-time.Hour).Truncate(time.Second)

	token, err := manager.Generate(userID, "admin@example.com", "ADMIN", now)
	require.NoError(t, err)
	require.NotEmpty(t, token.AccessToken)
	require.Equal(t, now.Add(24*time.Hour), token.ExpiresAt)

	claims, err := manager.Validate(token.AccessToken)
	require.NoError(t, err)
	require.Equal(t, userID, claims.UserID)
	require.Equal(t, "admin@example.com", claims.Email)
	require.Equal(t, "ADMIN", claims.Role)
}

func TestJWTRejectsInvalidToken(t *testing.T) {
	manager := NewJWTManager(config.JWTConfig{Secret: "test-secret", ExpiresHours: 24}, "docuvault-test")
	_, err := manager.Validate("not-a-token")
	require.Error(t, err)
}
