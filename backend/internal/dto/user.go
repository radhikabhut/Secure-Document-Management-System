package dto

import (
	"time"

	"github.com/google/uuid"
)

type UserResponse struct {
	ID           uuid.UUID  `json:"id"`
	FullName     string     `json:"full_name"`
	Username     string     `json:"username"`
	Email        string     `json:"email"`
	RoleID       uuid.UUID  `json:"role_id"`
	Role         string     `json:"role"`
	DepartmentID *uuid.UUID `json:"department_id,omitempty"`
	Department   *string    `json:"department,omitempty"`
	IsActive     bool       `json:"is_active"`
	LastLoginAt  *time.Time `json:"last_login_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type UserListRequest struct {
	PaginationRequest
	Keyword  string `form:"keyword" json:"keyword" validate:"omitempty,max=120"`
	Role     string `form:"role" json:"role" validate:"omitempty,oneof=ADMIN MANAGER EMPLOYEE VIEWER"`
	IsActive *bool  `form:"is_active" json:"is_active"`
}

type UpdateUserRequest struct {
	FullName *string `json:"full_name" validate:"omitempty,min=2,max=150"`
	Username *string `json:"username" validate:"omitempty,max=60"`
	Role     *string `json:"role" validate:"omitempty,oneof=ADMIN MANAGER EMPLOYEE VIEWER"`
	DepartmentID *uuid.UUID `json:"department_id,omitempty"`
	IsActive *bool   `json:"is_active"`
}

type CreateUserRequest struct {
	FullName string `json:"full_name" validate:"required,min=2,max=150"`
	Username string `json:"username" validate:"omitempty,max=60"`
	Email    string `json:"email" validate:"required,email,max=255"`
	Password     string     `json:"password" validate:"required,min=8,max=72,strong_password"`
	Role         string     `json:"role" validate:"omitempty,oneof=ADMIN MANAGER EMPLOYEE VIEWER"`
	DepartmentID *uuid.UUID `json:"department_id,omitempty"`
}
