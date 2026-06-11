package dto

import (
	"time"

	"github.com/google/uuid"
)

type NotificationListRequest struct {
	PaginationRequest
	IsSent *bool  `form:"is_sent" json:"is_sent"`
	Type   string `form:"type" json:"type" validate:"omitempty,max=60"`
}

type NotificationResponse struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	Type      string     `json:"type"`
	Subject   string     `json:"subject"`
	Message   string     `json:"message"`
	IsSent    bool       `json:"is_sent"`
	SentAt    *time.Time `json:"sent_at"`
	IsRead    bool       `json:"is_read"`
	ReadAt    *time.Time `json:"read_at"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
