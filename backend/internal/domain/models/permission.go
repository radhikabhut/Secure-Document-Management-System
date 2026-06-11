package models

import "github.com/google/uuid"

type PermissionType string

const (
	PermissionView     PermissionType = "VIEW"
	PermissionDownload PermissionType = "DOWNLOAD"
	PermissionEdit     PermissionType = "EDIT"
	PermissionDelete   PermissionType = "DELETE"
	PermissionShare    PermissionType = "SHARE"
)

type Permission struct {
	BaseModel
	DocumentID     uuid.UUID      `gorm:"type:uuid;not null;index" json:"document_id"`
	Document       Document       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"document,omitempty"`
	UserID         *uuid.UUID     `gorm:"type:uuid;index" json:"user_id,omitempty"`
	User           *User          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	RoleID         *uuid.UUID     `gorm:"type:uuid;index" json:"role_id,omitempty"`
	Role           *Role          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"role,omitempty"`
	DepartmentID   *uuid.UUID     `gorm:"type:uuid;index" json:"department_id,omitempty"`
	Department     *Department    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"department,omitempty"`
	PermissionType PermissionType `gorm:"type:varchar(30);not null" json:"permission_type"`
	GrantedBy      uuid.UUID      `gorm:"type:uuid;not null;index" json:"granted_by"`
	Granter        User           `gorm:"foreignKey:GrantedBy;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"granter,omitempty"`
}

func (Permission) TableName() string {
	return "permissions"
}
