package password

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestHashAndCompare(t *testing.T) {
	hash, err := Hash("Secure@123")
	require.NoError(t, err)
	require.NotEqual(t, "Secure@123", hash)
	require.True(t, Compare(hash, "Secure@123"))
	require.False(t, Compare(hash, "wrong-password"))
}

func TestValidateStrong(t *testing.T) {
	require.NoError(t, ValidateStrong("Secure@123"))
	require.Error(t, ValidateStrong("weak"))
	require.Error(t, ValidateStrong("secure@123"))
	require.Error(t, ValidateStrong("SECURE@123"))
	require.Error(t, ValidateStrong("SecurePass"))
	require.Error(t, ValidateStrong("Secure123"))
}
