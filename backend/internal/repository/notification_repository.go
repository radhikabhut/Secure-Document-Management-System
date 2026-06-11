package repository

import (
	"context"
	"fmt"
	"time"

	"docuvault-be/internal/domain/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(ctx context.Context, notification *models.Notification) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Notification, error)
	List(ctx context.Context, filter NotificationFilter) ([]models.Notification, int64, error)
	MarkSent(ctx context.Context, id uuid.UUID, sentAt time.Time) error
	MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID, readAt time.Time) error
}

type gormNotificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &gormNotificationRepository{db: db}
}

func (r *gormNotificationRepository) Create(ctx context.Context, notification *models.Notification) error {
	if err := r.db.WithContext(ctx).Create(notification).Error; err != nil {
		return fmt.Errorf("create notification: %w", err)
	}
	return nil
}

func (r *gormNotificationRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Notification, error) {
	var notification models.Notification
	if err := r.db.WithContext(ctx).First(&notification, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("find notification by id: %w", err)
	}
	return &notification, nil
}

func (r *gormNotificationRepository) List(ctx context.Context, filter NotificationFilter) ([]models.Notification, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.Notification{})
	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}
	if filter.IsSent != nil {
		query = query.Where("is_sent = ?", *filter.IsSent)
	}
	if filter.Type != "" {
		query = query.Where("type = ?", filter.Type)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count notifications: %w", err)
	}

	var notifications []models.Notification
	allowedSorts := map[string]bool{"created_at": true, "updated_at": true, "type": true, "is_sent": true, "is_read": true}
	if err := applyPagination(query, filter.Pagination, "created_at", allowedSorts).Find(&notifications).Error; err != nil {
		return nil, 0, fmt.Errorf("list notifications: %w", err)
	}
	return notifications, total, nil
}

func (r *gormNotificationRepository) MarkSent(ctx context.Context, id uuid.UUID, sentAt time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.Notification{}).
		Where("id = ?", id).
		Updates(map[string]any{"is_sent": true, "sent_at": sentAt}).Error; err != nil {
		return fmt.Errorf("mark notification sent: %w", err)
	}
	return nil
}

func (r *gormNotificationRepository) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID, readAt time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]any{"is_read": true, "read_at": readAt}).Error; err != nil {
		return fmt.Errorf("mark notification read: %w", err)
	}
	return nil
}
