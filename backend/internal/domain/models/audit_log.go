package models

import "github.com/google/uuid"

type AuditAction string

const (
	AuditActionRegister         AuditAction = "USER_REGISTERED"
	AuditActionLogin            AuditAction = "USER_LOGIN"
	AuditActionLogout           AuditAction = "USER_LOGOUT"
	AuditActionDocumentUpload   AuditAction = "DOCUMENT_UPLOAD"
	AuditActionDocumentDownload AuditAction = "DOCUMENT_DOWNLOAD"
	AuditActionDocumentDelete   AuditAction = "DOCUMENT_DELETE"
	AuditActionDocumentRestore  AuditAction = "DOCUMENT_RESTORE"
	AuditActionPermissionGrant  AuditAction = "PERMISSION_GRANT"
	AuditActionPermissionRevoke AuditAction = "PERMISSION_REVOKE"
	AuditActionCategoryCreate   AuditAction = "CATEGORY_CREATE"
	AuditActionEmailSent        AuditAction = "EMAIL_SENT"
)

type EntityType string

const (
	EntityUser         EntityType = "USER"
	EntityRole         EntityType = "ROLE"
	EntityCategory     EntityType = "CATEGORY"
	EntityDocument     EntityType = "DOCUMENT"
	EntityPermission   EntityType = "PERMISSION"
	EntityNotification EntityType = "NOTIFICATION"
)

type AuditLog struct {
	BaseModel
	UserID     *uuid.UUID  `gorm:"type:uuid;index" json:"user_id"`
	User       *User       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"user,omitempty"`
	Action     AuditAction `gorm:"type:varchar(80);not null;index" json:"action"`
	EntityType EntityType  `gorm:"type:varchar(60);not null;index" json:"entity_type"`
	EntityID   *uuid.UUID  `gorm:"type:uuid;index" json:"entity_id"`
	IPAddress  string      `gorm:"type:varchar(64)" json:"ip_address"`
	UserAgent  string      `gorm:"type:text" json:"user_agent"`
	Metadata   JSONMap     `gorm:"type:jsonb;not null;default:'{}'" json:"metadata"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}
