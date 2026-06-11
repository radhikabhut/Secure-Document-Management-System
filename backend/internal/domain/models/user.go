package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	BaseModel
	FullName     string     `gorm:"type:varchar(150);not null" json:"full_name"`
	Username     string     `gorm:"type:varchar(60)" json:"username"`
	Email        string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string     `gorm:"type:varchar(255);not null" json:"-"`
	RoleID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"role_id"`
	Role         Role       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"role"`
	DepartmentID *uuid.UUID `gorm:"type:uuid;index" json:"department_id"`
	Department   *Department `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"department"`
	IsActive     bool       `gorm:"not null;default:true" json:"is_active"`
	LastLoginAt  *time.Time `json:"last_login_at"`

	Categories    []Category     `gorm:"foreignKey:CreatedBy" json:"-"`
	Documents     []Document     `gorm:"foreignKey:UploadedBy" json:"-"`
	Permissions   []Permission   `gorm:"foreignKey:UserID" json:"-"`
	AuditLogs     []AuditLog     `gorm:"foreignKey:UserID" json:"-"`
	Notifications []Notification `gorm:"foreignKey:UserID" json:"-"`
}

func (User) TableName() string {
	return "users"
}
