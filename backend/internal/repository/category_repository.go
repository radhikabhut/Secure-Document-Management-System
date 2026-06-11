package repository

import (
	"context"
	"fmt"

	"docuvault-be/internal/domain/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *models.Category) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Category, error)
	List(ctx context.Context, filter CategoryFilter) ([]models.Category, int64, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int64, error)
}

type gormCategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &gormCategoryRepository{db: db}
}

func (r *gormCategoryRepository) Create(ctx context.Context, category *models.Category) error {
	if err := r.db.WithContext(ctx).Create(category).Error; err != nil {
		return fmt.Errorf("create category: %w", err)
	}
	return nil
}

func (r *gormCategoryRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	var category models.Category
	if err := r.db.WithContext(ctx).Preload("Creator").First(&category, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("find category by id: %w", err)
	}
	return &category, nil
}

func (r *gormCategoryRepository) List(ctx context.Context, filter CategoryFilter) ([]models.Category, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.Category{}).
		Select("categories.*, (SELECT count(id) FROM documents WHERE documents.category_id = categories.id) as document_count").
		Preload("Creator")
	if filter.Keyword != "" {
		keyword := likeKeyword(filter.Keyword)
		query = query.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ?", keyword, keyword)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count categories: %w", err)
	}

	var categories []models.Category
	allowedSorts := map[string]bool{"created_at": true, "updated_at": true, "name": true}
	if err := applyPagination(query, filter.Pagination, "created_at", allowedSorts).Find(&categories).Error; err != nil {
		return nil, 0, fmt.Errorf("list categories: %w", err)
	}
	return categories, total, nil
}

func (r *gormCategoryRepository) Update(ctx context.Context, category *models.Category) error {
	if err := r.db.WithContext(ctx).Save(category).Error; err != nil {
		return fmt.Errorf("update category: %w", err)
	}
	return nil
}

func (r *gormCategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Category{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	return nil
}

func (r *gormCategoryRepository) Count(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Category{}).Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count categories: %w", err)
	}
	return total, nil
}
