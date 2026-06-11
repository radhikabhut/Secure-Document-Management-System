package repository

import (
	"context"
	"fmt"

	"docuvault-be/internal/domain/models"
	"gorm.io/gorm"
)

type AuditLogRepository interface {
	Create(ctx context.Context, auditLog *models.AuditLog) error
	List(ctx context.Context, filter AuditLogFilter) ([]models.AuditLog, int64, error)
	Recent(ctx context.Context, limit int) ([]models.AuditLog, error)
	MostActiveUsers(ctx context.Context, limit int) ([]ActiveUserStat, error)
}

type gormAuditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &gormAuditLogRepository{db: db}
}

func (r *gormAuditLogRepository) Create(ctx context.Context, auditLog *models.AuditLog) error {
	if err := r.db.WithContext(ctx).Create(auditLog).Error; err != nil {
		return fmt.Errorf("create audit log: %w", err)
	}
	return nil
}

func (r *gormAuditLogRepository) List(ctx context.Context, filter AuditLogFilter) ([]models.AuditLog, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Preload("User.Role")
	query = applyAuditLogFilter(query, filter)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count audit logs: %w", err)
	}

	var logs []models.AuditLog
	allowedSorts := map[string]bool{"created_at": true, "updated_at": true, "action": true, "entity_type": true}
	if err := applyPagination(query, filter.Pagination, "created_at", allowedSorts).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("list audit logs: %w", err)
	}
	return logs, total, nil
}

func (r *gormAuditLogRepository) Recent(ctx context.Context, limit int) ([]models.AuditLog, error) {
	if limit <= 0 {
		limit = 10
	}
	var logs []models.AuditLog
	if err := r.db.WithContext(ctx).Order("created_at desc").Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("recent audit logs: %w", err)
	}
	return logs, nil
}

func (r *gormAuditLogRepository) MostActiveUsers(ctx context.Context, limit int) ([]ActiveUserStat, error) {
	if limit <= 0 {
		limit = 5
	}

	var stats []ActiveUserStat
	if err := r.db.WithContext(ctx).
		Table("audit_logs").
		Select("users.id AS user_id, users.full_name, users.email, COUNT(audit_logs.id) AS action_count").
		Joins("JOIN users ON users.id = audit_logs.user_id").
		Where("audit_logs.user_id IS NOT NULL").
		Group("users.id, users.full_name, users.email").
		Order("action_count desc").
		Limit(limit).
		Scan(&stats).Error; err != nil {
		return nil, fmt.Errorf("most active users: %w", err)
	}
	return stats, nil
}

func applyAuditLogFilter(query *gorm.DB, filter AuditLogFilter) *gorm.DB {
	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}
	if filter.Action != "" {
		query = query.Where("action = ?", filter.Action)
	}
	if filter.EntityType != "" {
		query = query.Where("entity_type = ?", filter.EntityType)
	}
	if filter.EntityID != nil {
		query = query.Where("entity_id = ?", *filter.EntityID)
	}
	if filter.From != nil {
		query = query.Where("created_at >= ?", *filter.From)
	}
	if filter.To != nil {
		query = query.Where("created_at <= ?", *filter.To)
	}
	return query
}
