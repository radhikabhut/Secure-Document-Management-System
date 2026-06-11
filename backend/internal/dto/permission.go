package dto

import (
	"time"

	"github.com/google/uuid"
)

type GrantPermissionRequest struct {
	DocumentID     uuid.UUID   `json:"document_id" validate:"required"`
	UserID         *uuid.UUID  `json:"user_id,omitempty"`
	UserIDs        []uuid.UUID `json:"user_ids,omitempty"`
	Roles          []string    `json:"roles,omitempty"`
	Departments    []string    `json:"departments,omitempty"`
	PermissionType string      `json:"permission_type" validate:"required,oneof=VIEW DOWNLOAD EDIT DELETE SHARE"`
}

type PermissionResponse struct {
	ID             uuid.UUID  `json:"id"`
	DocumentID     uuid.UUID  `json:"document_id"`
	UserID         *uuid.UUID `json:"user_id,omitempty"`
	RoleID         *uuid.UUID `json:"role_id,omitempty"`
	DepartmentID   *uuid.UUID `json:"department_id,omitempty"`
	PermissionType string     `json:"permission_type"`
	GrantedBy      uuid.UUID  `json:"granted_by"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
