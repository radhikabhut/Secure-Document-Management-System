package dto

import (
	"time"

	"github.com/google/uuid"
)

type DepartmentResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateDepartmentRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"max=500"`
}

type UpdateDepartmentRequest struct {
	Name        *string `json:"name" validate:"omitempty,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
}
