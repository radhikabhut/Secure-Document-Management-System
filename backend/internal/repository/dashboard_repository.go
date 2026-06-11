package repository

import (
	"context"
	"fmt"
	"time"

	"docuvault-be/internal/domain/models"
	"gorm.io/gorm"
)

type gormDashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &gormDashboardRepository{db: db}
}

func (r *gormDashboardRepository) CountUsers(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count dashboard users: %w", err)
	}
	return total, nil
}

func (r *gormDashboardRepository) CountDocuments(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Document{}).Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count dashboard documents: %w", err)
	}
	return total, nil
}

func (r *gormDashboardRepository) CountCategories(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Category{}).Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count dashboard categories: %w", err)
	}
	return total, nil
}

func (r *gormDashboardRepository) CountDocumentsUploadedToday(ctx context.Context, now time.Time) (int64, error) {
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	end := start.Add(24 * time.Hour)

	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Document{}).
		Where("created_at >= ? AND created_at < ?", start, end).
		Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count dashboard documents uploaded today: %w", err)
	}
	return total, nil
}

func (r *gormDashboardRepository) StorageUsageBytes(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Document{}).
		Select("COALESCE(SUM(file_size), 0)").
		Scan(&total).Error; err != nil {
		return 0, fmt.Errorf("dashboard storage usage: %w", err)
	}
	return total, nil
}

func (r *gormDashboardRepository) MostActiveUsers(ctx context.Context, limit int) ([]ActiveUserStat, error) {
	return NewAuditLogRepository(r.db).MostActiveUsers(ctx, limit)
}
