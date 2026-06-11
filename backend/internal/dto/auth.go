package dto

import (
	"time"

	"github.com/google/uuid"
)

type RegisterRequest struct {
	FullName string `json:"full_name" validate:"required,min=2,max=150"`
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=8,max=72,strong_password"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	ExpiresAt   time.Time    `json:"expires_at"`
	User        UserResponse `json:"user"`
}

type MeResponse struct {
	User UserResponse `json:"user"`
}

type AuthUser struct {
	ID                uuid.UUID `json:"id"`
	Email             string     `json:"email"`
	Role              string     `json:"role"`
	DepartmentID      *uuid.UUID `json:"department_id,omitempty"`
	Active            bool       `json:"active"`
	SystemPermissions []string  `json:"system_permissions"`
}

func (u AuthUser) HasSystemPermission(permission string) bool {
	for _, p := range u.SystemPermissions {
		if p == permission {
			return true
		}
	}
	return false
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email,max=255"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=72,strong_password"`
}
