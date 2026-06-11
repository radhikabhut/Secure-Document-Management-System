package email

import (
	"context"
	"testing"

	"docuvault-be/internal/config"
	"github.com/stretchr/testify/require"
)

func TestNewSenderReturnsNoopWhenSMTPDisabled(t *testing.T) {
	sender := NewSender(config.SMTPConfig{})

	require.False(t, sender.Enabled())
	require.NoError(t, sender.Send(context.Background(), Message{}))
}

func TestValidateMessage(t *testing.T) {
	tests := []struct {
		name    string
		message Message
		wantErr bool
	}{
		{
			name: "valid message",
			message: Message{
				To:      "user@example.com",
				Subject: "Welcome",
				Body:    "Hello",
			},
		},
		{
			name: "missing recipient",
			message: Message{
				Subject: "Welcome",
				Body:    "Hello",
			},
			wantErr: true,
		},
		{
			name: "missing subject",
			message: Message{
				To:   "user@example.com",
				Body: "Hello",
			},
			wantErr: true,
		},
		{
			name: "missing body",
			message: Message{
				To:      "user@example.com",
				Subject: "Welcome",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate(tt.message)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
		})
	}
}
