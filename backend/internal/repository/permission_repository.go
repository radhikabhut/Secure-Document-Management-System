package repository

import (
	"context"
	"fmt"

	"docuvault-be/internal/domain/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PermissionRepository interface {
	Create(ctx context.Context, permission *models.Permission) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Permission, error)
	FindForUser(ctx context.Context, documentID, userID uuid.UUID, permissionType models.PermissionType) (*models.Permission, error)
	ListByDocument(ctx context.Context, documentID uuid.UUID) ([]models.Permission, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Permission, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type gormPermissionRepository struct {
	db *gorm.DB
}

func NewPermissionRepository(db *gorm.DB) PermissionRepository {
	return &gormPermissionRepository{db: db}
}

func (r *gormPermissionRepository) Create(ctx context.Context, permission *models.Permission) error {
	if err := r.db.WithContext(ctx).Create(permission).Error; err != nil {
		return fmt.Errorf("create permission: %w", err)
	}
	return nil
}

func (r *gormPermissionRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Permission, error) {
	var permission models.Permission
	if err := r.db.WithContext(ctx).First(&permission, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("find permission by id: %w", err)
	}
	return &permission, nil
}

func (r *gormPermissionRepository) FindForUser(ctx context.Context, documentID, userID uuid.UUID, permissionType models.PermissionType) (*models.Permission, error) {
	var permission models.Permission
	
	err := r.db.WithContext(ctx).
		Where("document_id = ? AND permission_type = ?", documentID, permissionType).
		Where("user_id = ? OR role_id = (SELECT role_id FROM users WHERE id = ?) OR department_id = (SELECT department_id FROM users WHERE id = ? AND department_id IS NOT NULL)", userID, userID, userID).
		First(&permission).Error

	if err != nil {
		return nil, fmt.Errorf("find user permission: %w", err)
	}
	return &permission, nil
}

func (r *gormPermissionRepository) ListByDocument(ctx context.Context, documentID uuid.UUID) ([]models.Permission, error) {
	var permissions []models.Permission
	if err := r.db.WithContext(ctx).Preload("User").Preload("Role").Preload("Department").Where("document_id = ?", documentID).Find(&permissions).Error; err != nil {
		return nil, fmt.Errorf("list document permissions: %w", err)
	}
	return permissions, nil
}

func (r *gormPermissionRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Permission, error) {
	var permissions []models.Permission
	if err := r.db.WithContext(ctx).Preload("Document").
		Where("user_id = ? OR role_id = (SELECT role_id FROM users WHERE id = ?) OR department_id = (SELECT department_id FROM users WHERE id = ? AND department_id IS NOT NULL)", userID, userID, userID).
		Find(&permissions).Error; err != nil {
		return nil, fmt.Errorf("list user permissions: %w", err)
	}
	return permissions, nil
}

func (r *gormPermissionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Permission{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("delete permission: %w", err)
	}
	return nil
}
