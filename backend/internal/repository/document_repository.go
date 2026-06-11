package repository

import (
	"context"
	"fmt"
	"time"

	"docuvault-be/internal/domain/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DocumentRepository interface {
	Create(ctx context.Context, document *models.Document) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Document, error)
	List(ctx context.Context, filter DocumentFilter) ([]models.Document, int64, error)
	Update(ctx context.Context, document *models.Document) error
	Delete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int64, error)
	CountUploadedToday(ctx context.Context, now time.Time) (int64, error)
	StorageUsageBytes(ctx context.Context) (int64, error)
}

type gormDocumentRepository struct {
	db *gorm.DB
}

func NewDocumentRepository(db *gorm.DB) DocumentRepository {
	return &gormDocumentRepository{db: db}
}

func (r *gormDocumentRepository) Create(ctx context.Context, document *models.Document) error {
	if err := r.db.WithContext(ctx).Create(document).Error; err != nil {
		return fmt.Errorf("create document: %w", err)
	}
	return nil
}

func (r *gormDocumentRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Document, error) {
	var document models.Document
	if err := r.db.WithContext(ctx).
		Unscoped().
		Preload("Category").
		Preload("Uploader.Role").
		First(&document, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("find document by id: %w", err)
	}
	return &document, nil
}

func (r *gormDocumentRepository) List(ctx context.Context, filter DocumentFilter) ([]models.Document, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.Document{}).Preload("Category").Preload("Uploader.Role")
	query = applyDocumentFilter(query, filter)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count documents: %w", err)
	}

	var documents []models.Document
	allowedSorts := map[string]bool{"created_at": true, "updated_at": true, "title": true, "file_size": true}
	if err := applyPagination(query, filter.Pagination, "created_at", allowedSorts).Find(&documents).Error; err != nil {
		return nil, 0, fmt.Errorf("list documents: %w", err)
	}
	return documents, total, nil
}

func (r *gormDocumentRepository) Update(ctx context.Context, document *models.Document) error {
	if err := r.db.WithContext(ctx).Save(document).Error; err != nil {
		return fmt.Errorf("update document: %w", err)
	}
	return nil
}

func (r *gormDocumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Document{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("delete document: %w", err)
	}
	return nil
}

func (r *gormDocumentRepository) Restore(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Unscoped().Model(&models.Document{}).Where("id = ?", id).Update("deleted_at", nil).Error; err != nil {
		return fmt.Errorf("restore document: %w", err)
	}
	return nil
}

func (r *gormDocumentRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Unscoped().Delete(&models.Document{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("hard delete document: %w", err)
	}
	return nil
}

func (r *gormDocumentRepository) Count(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Document{}).Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count documents: %w", err)
	}
	return total, nil
}

func (r *gormDocumentRepository) CountUploadedToday(ctx context.Context, now time.Time) (int64, error) {
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	end := start.Add(24 * time.Hour)

	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Document{}).
		Where("created_at >= ? AND created_at < ?", start, end).
		Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count documents uploaded today: %w", err)
	}
	return total, nil
}

func (r *gormDocumentRepository) StorageUsageBytes(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Document{}).
		Select("COALESCE(SUM(file_size), 0)").
		Scan(&total).Error; err != nil {
		return 0, fmt.Errorf("storage usage bytes: %w", err)
	}
	return total, nil
}

func applyDocumentFilter(query *gorm.DB, filter DocumentFilter) *gorm.DB {
	if filter.IsDeleted != nil && *filter.IsDeleted {
		query = query.Unscoped().Where("deleted_at IS NOT NULL")
	}

	if filter.Keyword != "" {
		keyword := likeKeyword(filter.Keyword)
		query = query.Where("LOWER(title) LIKE ? OR LOWER(original_filename) LIKE ?", keyword, keyword)
	}
	if filter.CategoryID != nil {
		query = query.Where("category_id = ?", *filter.CategoryID)
	}
	if filter.UploadedBy != nil {
		query = query.Where("uploaded_by = ?", *filter.UploadedBy)
	}
	if filter.MimeType != "" {
		mimeType := likeKeyword(filter.MimeType)
		query = query.Where("LOWER(mime_type) LIKE ?", mimeType)
	}
	if filter.From != nil {
		query = query.Where("created_at >= ?", *filter.From)
	}
	if filter.To != nil {
		query = query.Where("created_at <= ?", *filter.To)
	}
	return query
}
