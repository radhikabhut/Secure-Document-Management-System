package service

import (
	"context"
	"time"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/pkg/email"
	"docuvault-be/internal/repository"
	"github.com/google/uuid"
)

func createAndSendNotification(ctx context.Context, notifications repository.NotificationRepository, auditLogs AuditLogService, mailer email.Sender, notification *models.Notification, recipientEmail string) {
	if notifications == nil || notification == nil {
		return
	}
	if err := notifications.Create(ctx, notification); err != nil {
		return
	}
	if mailer == nil || !mailer.Enabled() || recipientEmail == "" {
		return
	}
	if err := mailer.Send(ctx, email.Message{
		To:      recipientEmail,
		Subject: notification.Subject,
		Body:    notification.Message,
	}); err != nil {
		return
	}
	_ = notifications.MarkSent(ctx, notification.ID, time.Now())
	if auditLogs != nil {
		_ = auditLogs.Record(ctx, AuditEvent{
			UserID:     notificationUserID(notification.UserID),
			Action:     models.AuditActionEmailSent,
			EntityType: models.EntityNotification,
			EntityID:   &notification.ID,
			Metadata: models.JSONMap{
				"type": notification.Type,
				"to":   recipientEmail,
			},
		})
	}
}

func notificationUserID(id uuid.UUID) *uuid.UUID {
	if id == uuid.Nil {
		return nil
	}
	return &id
}
