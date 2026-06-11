package models

import (
	"time"

	"github.com/google/uuid"
)

type NotificationType string

const (
	NotificationWelcome           NotificationType = "WELCOME"
	NotificationDocumentShared    NotificationType = "DOCUMENT_SHARED"
	NotificationPermissionGranted NotificationType = "PERMISSION_GRANTED"
	NotificationPasswordReset     NotificationType = "PASSWORD_RESET"
)

type Notification struct {
	BaseModel
	UserID  uuid.UUID        `gorm:"type:uuid;not null;index" json:"user_id"`
	User    User             `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	Type    NotificationType `gorm:"type:varchar(60);not null;index" json:"type"`
	Subject string           `gorm:"type:varchar(255);not null" json:"subject"`
	Message string           `gorm:"type:text;not null" json:"message"`
	IsSent  bool             `gorm:"not null;default:false;index" json:"is_sent"`
	SentAt  *time.Time       `json:"sent_at"`
	IsRead  bool             `gorm:"not null;default:false;index" json:"is_read"`
	ReadAt  *time.Time       `json:"read_at"`
}

func (Notification) TableName() string {
	return "notifications"
}
