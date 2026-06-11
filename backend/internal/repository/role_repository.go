package repository

import (
	"context"
	"fmt"

	"docuvault-be/internal/domain/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RoleRepository interface {
	Create(ctx context.Context, role *models.Role) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Role, error)
	FindByName(ctx context.Context, name models.RoleName) (*models.Role, error)
	List(ctx context.Context) ([]models.Role, error)
	SeedDefaults(ctx context.Context) error
}

type gormRoleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &gormRoleRepository{db: db}
}

func (r *gormRoleRepository) Create(ctx context.Context, role *models.Role) error {
	if err := r.db.WithContext(ctx).Create(role).Error; err != nil {
		return fmt.Errorf("create role: %w", err)
	}
	return nil
}

func (r *gormRoleRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	var role models.Role
	if err := r.db.WithContext(ctx).First(&role, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("find role by id: %w", err)
	}
	return &role, nil
}

func (r *gormRoleRepository) FindByName(ctx context.Context, name models.RoleName) (*models.Role, error) {
	var role models.Role
	if err := r.db.WithContext(ctx).First(&role, "name = ?", name).Error; err != nil {
		return nil, fmt.Errorf("find role by name: %w", err)
	}
	return &role, nil
}

func (r *gormRoleRepository) List(ctx context.Context) ([]models.Role, error) {
	var roles []models.Role
	if err := r.db.WithContext(ctx).Order("name asc").Find(&roles).Error; err != nil {
		return nil, fmt.Errorf("list roles: %w", err)
	}
	return roles, nil
}

func (r *gormRoleRepository) SeedDefaults(ctx context.Context) error {
	// 1. Define all available system permissions
	systemPerms := []models.SystemPermission{
		{Name: "documents:create", Description: "Can upload new documents"},
		{Name: "documents:read_all", Description: "Can read all documents in the system"},
		{Name: "documents:delete_any", Description: "Can delete any document"},
		{Name: "categories:manage", Description: "Can create, update, and delete categories/folders"},
		{Name: "users:manage", Description: "Can create, update, and manage users and roles"},
		{Name: "audit:view", Description: "Can view system audit logs"},
	}

	// Upsert System Permissions
	for i := range systemPerms {
		if err := r.db.WithContext(ctx).
			Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "name"}},
				DoUpdates: clause.AssignmentColumns([]string{"description"}),
			}).
			Create(&systemPerms[i]).Error; err != nil {
			return fmt.Errorf("seed system permission %s: %w", systemPerms[i].Name, err)
		}
	}

	// 2. Define Roles WITHOUT permissions attached to avoid GORM auto-association bugs during upsert
	roles := []models.Role{
		{Name: models.RoleAdmin, Description: "Full system access"},
		{Name: models.RoleManager, Description: "Manage documents, categories, and analytics"},
		{Name: models.RoleEmployee, Description: "Upload and manage own documents"},
		{Name: models.RoleViewer, Description: "Read-only document access"},
	}

	for i := range roles {
		if err := r.db.WithContext(ctx).
			Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "name"}},
				DoUpdates: clause.AssignmentColumns([]string{"description"}),
			}).
			Create(&roles[i]).Error; err != nil {
			return fmt.Errorf("seed role %s: %w", roles[i].Name, err)
		}
	}

	// 3. Retrieve definitive database models and map permissions
	var dbAdmin, dbManager, dbEmployee, dbViewer models.Role
	r.db.WithContext(ctx).First(&dbAdmin, "name = ?", models.RoleAdmin)
	r.db.WithContext(ctx).First(&dbManager, "name = ?", models.RoleManager)
	r.db.WithContext(ctx).First(&dbEmployee, "name = ?", models.RoleEmployee)
	r.db.WithContext(ctx).First(&dbViewer, "name = ?", models.RoleViewer)

	var dbPerms []models.SystemPermission
	r.db.WithContext(ctx).Find(&dbPerms)
	
	permMap := make(map[string]models.SystemPermission)
	for _, p := range dbPerms {
		permMap[p.Name] = p
	}

	// Admin gets everything
	_ = r.db.WithContext(ctx).Model(&dbAdmin).Association("SystemPermissions").Replace(dbPerms)
	// Manager gets read_all, create, delete_any, categories, and audit_view (for dashboard)
	_ = r.db.WithContext(ctx).Model(&dbManager).Association("SystemPermissions").Replace([]models.SystemPermission{
		permMap["documents:create"], permMap["documents:read_all"], permMap["documents:delete_any"], permMap["categories:manage"], permMap["audit:view"],
	})
	// Employee gets create
	_ = r.db.WithContext(ctx).Model(&dbEmployee).Association("SystemPermissions").Replace([]models.SystemPermission{permMap["documents:create"]})
	// Viewer gets nothing global
	_ = r.db.WithContext(ctx).Model(&dbViewer).Association("SystemPermissions").Replace([]models.SystemPermission{})

	return nil
}
