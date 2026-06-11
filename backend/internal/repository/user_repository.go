package repository

import (
	"context"
	"fmt"
	"os"

	"docuvault-be/internal/domain/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	List(ctx context.Context, filter UserFilter) ([]models.User, int64, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int64, error)
	FindByRoles(ctx context.Context, roles []string) ([]models.User, error)
}

type gormUserRepository struct {
	db *gorm.DB
}

var userSortColumns = map[string]string{
	"created_at": "users.created_at",
	"updated_at": "users.updated_at",
	"full_name":  "users.full_name",
	"email":      "users.email",
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &gormUserRepository{db: db}
}

func (r *gormUserRepository) Create(ctx context.Context, user *models.User) error {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *gormUserRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Preload("Role").Preload("Role.SystemPermissions").Preload("Department").First(&user, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return &user, nil
}

func (r *gormUserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Preload("Role").Preload("Role.SystemPermissions").Preload("Department").First(&user, "LOWER(email) = LOWER(?)", email).Error; err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}
	return &user, nil
}

func (r *gormUserRepository) FindByRoles(ctx context.Context, roles []string) ([]models.User, error) {
	var users []models.User
	if err := r.db.WithContext(ctx).Joins("JOIN roles ON roles.id = users.role_id").Where("roles.name IN ?", roles).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("find users by roles: %w", err)
	}
	return users, nil
}

func (r *gormUserRepository) List(ctx context.Context, filter UserFilter) ([]models.User, int64, error) {
	query := r.db.WithContext(ctx).
		Model(&models.User{}).
		Preload("Role").
		Preload("Department").
		Joins("JOIN roles ON roles.id = users.role_id")
	query = applyUserFilter(query, filter)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count users: %w", err)
	}

	var users []models.User
	if err := applyPaginationWithSortColumns(query, filter.Pagination, "created_at", userSortColumns).Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("list users: %w", err)
	}
	return users, total, nil
}

func (r *gormUserRepository) Update(ctx context.Context, user *models.User) error {
	if err := r.db.WithContext(ctx).Save(user).Error; err != nil {
		return fmt.Errorf("update user: %w", err)
	}
	return nil
}

func (r *gormUserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var categoryIDs []uuid.UUID
		if err := tx.Model(&models.Category{}).Where("created_by = ?", id).Pluck("id", &categoryIDs).Error; err != nil {
			return fmt.Errorf("find user categories: %w", err)
		}

		var docs []models.Document
		if err := documentsForUserDelete(tx, id, categoryIDs).Find(&docs).Error; err != nil {
			return fmt.Errorf("find user documents: %w", err)
		}

		docIDs := make([]uuid.UUID, 0, len(docs))
		for _, doc := range docs {
			docIDs = append(docIDs, doc.ID)
		}

		if err := tx.Where("user_id = ?", id).Delete(&models.Notification{}).Error; err != nil {
			return fmt.Errorf("delete notifications: %w", err)
		}

		permissionQuery := tx.Where("user_id = ? OR granted_by = ?", id, id)
		if len(docIDs) > 0 {
			permissionQuery = permissionQuery.Or("document_id IN ?", docIDs)
		}
		if err := permissionQuery.Delete(&models.Permission{}).Error; err != nil {
			return fmt.Errorf("delete permissions: %w", err)
		}

		if err := tx.Model(&models.AuditLog{}).Where("user_id = ?", id).Update("user_id", nil).Error; err != nil {
			return fmt.Errorf("clear audit logs: %w", err)
		}

		if err := documentsForUserDelete(tx, id, categoryIDs).Delete(&models.Document{}).Error; err != nil {
			return fmt.Errorf("delete documents: %w", err)
		}

		if err := tx.Where("created_by = ?", id).Delete(&models.Category{}).Error; err != nil {
			return fmt.Errorf("delete categories: %w", err)
		}

		if err := tx.Delete(&models.User{}, "id = ?", id).Error; err != nil {
			return fmt.Errorf("delete user row: %w", err)
		}

		for _, doc := range docs {
			_ = os.Remove(doc.FilePath)
		}

		return nil
	})
}

func documentsForUserDelete(tx *gorm.DB, userID uuid.UUID, categoryIDs []uuid.UUID) *gorm.DB {
	query := tx.Where("uploaded_by = ?", userID)
	if len(categoryIDs) > 0 {
		query = query.Or("category_id IN ?", categoryIDs)
	}
	return query
}

func (r *gormUserRepository) Count(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Count(&total).Error; err != nil {
		return 0, fmt.Errorf("count users: %w", err)
	}
	return total, nil
}

func applyUserFilter(query *gorm.DB, filter UserFilter) *gorm.DB {
	if filter.Keyword != "" {
		keyword := likeKeyword(filter.Keyword)
		query = query.Where("LOWER(users.full_name) LIKE ? OR LOWER(users.email) LIKE ?", keyword, keyword)
	}
	if filter.Role != "" {
		query = query.Where("roles.name = ?", filter.Role)
	}
	if filter.IsActive != nil {
		query = query.Where("users.is_active = ?", *filter.IsActive)
	}
	return query
}
