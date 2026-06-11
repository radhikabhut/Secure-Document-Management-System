package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateCategoryRequest struct {
	Name        string     `json:"name" validate:"required,min=2,max=120"`
	Description string     `json:"description" validate:"omitempty,max=1000"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
}

type UpdateCategoryRequest struct {
	Name        *string `json:"name" validate:"omitempty,min=2,max=120"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
}

type CategoryListRequest struct {
	PaginationRequest
	Keyword string `form:"keyword" json:"keyword" validate:"omitempty,max=120"`
}

type CategoryResponse struct {
	ID            uuid.UUID  `json:"id"`
	Name          string     `json:"name"`
	Description   string     `json:"description"`
	ParentID      *uuid.UUID `json:"parent_id,omitempty"`
	DocumentCount int64      `json:"document_count"`
	CreatedBy     uuid.UUID  `json:"created_by"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
