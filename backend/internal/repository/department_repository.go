package repository

import (
	"context"
	"fmt"

	"docuvault-be/internal/domain/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DepartmentRepository interface {
	Create(ctx context.Context, department *models.Department) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Department, error)
	FindByName(ctx context.Context, name string) (*models.Department, error)
	List(ctx context.Context) ([]models.Department, error)
	Update(ctx context.Context, department *models.Department) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type gormDepartmentRepository struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &gormDepartmentRepository{db: db}
}

func (r *gormDepartmentRepository) Create(ctx context.Context, department *models.Department) error {
	if err := r.db.WithContext(ctx).Create(department).Error; err != nil {
		return fmt.Errorf("create department: %w", err)
	}
	return nil
}

func (r *gormDepartmentRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Department, error) {
	var department models.Department
	if err := r.db.WithContext(ctx).First(&department, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("find department by id: %w", err)
	}
	return &department, nil
}

func (r *gormDepartmentRepository) FindByName(ctx context.Context, name string) (*models.Department, error) {
	var department models.Department
	if err := r.db.WithContext(ctx).First(&department, "name = ?", name).Error; err != nil {
		return nil, fmt.Errorf("find department by name: %w", err)
	}
	return &department, nil
}

func (r *gormDepartmentRepository) List(ctx context.Context) ([]models.Department, error) {
	var departments []models.Department
	if err := r.db.WithContext(ctx).Order("name asc").Find(&departments).Error; err != nil {
		return nil, fmt.Errorf("list departments: %w", err)
	}
	return departments, nil
}

func (r *gormDepartmentRepository) Update(ctx context.Context, department *models.Department) error {
	if err := r.db.WithContext(ctx).Save(department).Error; err != nil {
		return fmt.Errorf("update department: %w", err)
	}
	return nil
}

func (r *gormDepartmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Department{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("delete department: %w", err)
	}
	return nil
}
