package dto

import (
	"time"

	"github.com/google/uuid"
)

type AuditLogListRequest struct {
	PaginationRequest
	UserID     *uuid.UUID `form:"user_id" json:"user_id"`
	Action     string     `form:"action" json:"action" validate:"omitempty,max=80"`
	EntityType string     `form:"entity_type" json:"entity_type" validate:"omitempty,max=60"`
	EntityID   *uuid.UUID `form:"entity_id" json:"entity_id"`
	DateRangeFilter
}

type AuditLogResponse struct {
	ID         uuid.UUID      `json:"id"`
	UserID     *uuid.UUID     `json:"user_id"`
	Action     string         `json:"action"`
	EntityType string         `json:"entity_type"`
	EntityID   *uuid.UUID     `json:"entity_id"`
	IPAddress  string         `json:"ip_address"`
	UserAgent  string         `json:"user_agent"`
	Metadata   map[string]any `json:"metadata"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}
