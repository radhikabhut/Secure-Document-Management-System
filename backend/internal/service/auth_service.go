package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/auth"
	"docuvault-be/internal/pkg/email"
	"docuvault-be/internal/pkg/password"
	"docuvault-be/internal/repository"

	"github.com/google/uuid"
)

type RequestInfo struct {
	IPAddress string
	UserAgent string
}

type AuthService interface {
	Register(ctx context.Context, request dto.RegisterRequest, info RequestInfo) (dto.LoginResponse, error)
	Login(ctx context.Context, request dto.LoginRequest, info RequestInfo) (dto.LoginResponse, error)
	Logout(ctx context.Context, user dto.AuthUser, info RequestInfo) error
	Me(ctx context.Context, userID uuid.UUID) (dto.MeResponse, error)
	ForgotPassword(ctx context.Context, request dto.ForgotPasswordRequest, info RequestInfo) error
	ResetPassword(ctx context.Context, request dto.ResetPasswordRequest, info RequestInfo) error
}

type authService struct {
	users         repository.UserRepository
	roles         repository.RoleRepository
	notifications repository.NotificationRepository
	auditLogs     AuditLogService
	jwt           *auth.JWTManager
	mailer        email.Sender
	now           func() time.Time
}

func NewAuthService(users repository.UserRepository, roles repository.RoleRepository, notifications repository.NotificationRepository, auditLogs AuditLogService, jwt *auth.JWTManager, mailer email.Sender) AuthService {
	return &authService{
		users:         users,
		roles:         roles,
		notifications: notifications,
		auditLogs:     auditLogs,
		jwt:           jwt,
		mailer:        mailer,
		now:           time.Now,
	}
}

func (s *authService) Register(ctx context.Context, request dto.RegisterRequest, info RequestInfo) (dto.LoginResponse, error) {
	email := strings.ToLower(strings.TrimSpace(request.Email))
	if existing, err := s.users.FindByEmail(ctx, email); err == nil && existing != nil {
		return dto.LoginResponse{}, ErrConflict
	} else if err != nil && !errors.Is(normalizeError(err), ErrNotFound) {
		return dto.LoginResponse{}, err
	}

	roleName := models.RoleEmployee
	count, err := s.users.Count(ctx)
	if err != nil {
		return dto.LoginResponse{}, err
	}
	if count == 0 {
		roleName = models.RoleAdmin
	}

	role, err := s.roles.FindByName(ctx, roleName)
	if err != nil {
		return dto.LoginResponse{}, normalizeError(err)
	}

	hashed, err := password.Hash(request.Password)
	if err != nil {
		return dto.LoginResponse{}, err
	}

	user := &models.User{
		FullName:     strings.TrimSpace(request.FullName),
		Email:        email,
		PasswordHash: hashed,
		RoleID:       role.ID,
		Role:         *role,
		IsActive:     true,
	}
	if err := s.users.Create(ctx, user); err != nil {
		return dto.LoginResponse{}, err
	}

	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &user.ID,
		Action:     models.AuditActionRegister,
		EntityType: models.EntityUser,
		EntityID:   &user.ID,
		IPAddress:  info.IPAddress,
		UserAgent:  info.UserAgent,
	})

	createAndSendNotification(ctx, s.notifications, s.auditLogs, s.mailer, &models.Notification{
		UserID:  user.ID,
		Type:    models.NotificationWelcome,
		Subject: "Welcome to Secure Document Management System",
		Message: "Hello " + user.FullName + ", your account has been created successfully.",
	}, user.Email)

	return s.loginResponse(user, s.now())
}

func (s *authService) Login(ctx context.Context, request dto.LoginRequest, info RequestInfo) (dto.LoginResponse, error) {
	user, err := s.users.FindByEmail(ctx, strings.TrimSpace(request.Email))
	if err != nil {
		if errors.Is(normalizeError(err), ErrNotFound) {
			return dto.LoginResponse{}, ErrUnauthorized
		}
		return dto.LoginResponse{}, err
	}
	if !user.IsActive || !password.Compare(user.PasswordHash, request.Password) {
		return dto.LoginResponse{}, ErrUnauthorized
	}

	now := s.now()
	user.LastLoginAt = &now
	if err := s.users.Update(ctx, user); err != nil {
		return dto.LoginResponse{}, err
	}

	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &user.ID,
		Action:     models.AuditActionLogin,
		EntityType: models.EntityUser,
		EntityID:   &user.ID,
		IPAddress:  info.IPAddress,
		UserAgent:  info.UserAgent,
	})

	return s.loginResponse(user, now)
}

func (s *authService) Logout(ctx context.Context, user dto.AuthUser, info RequestInfo) error {
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &user.ID,
		Action:     models.AuditActionLogout,
		EntityType: models.EntityUser,
		EntityID:   &user.ID,
		IPAddress:  info.IPAddress,
		UserAgent:  info.UserAgent,
	})
	return nil
}

func (s *authService) Me(ctx context.Context, userID uuid.UUID) (dto.MeResponse, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return dto.MeResponse{}, normalizeError(err)
	}
	return dto.MeResponse{User: ToUserResponse(*user)}, nil
}

func (s *authService) ForgotPassword(ctx context.Context, request dto.ForgotPasswordRequest, info RequestInfo) error {
	emailStr := strings.ToLower(strings.TrimSpace(request.Email))
	user, err := s.users.FindByEmail(ctx, emailStr)
	if err != nil {
		if errors.Is(normalizeError(err), ErrNotFound) {
			// Don't leak whether the email exists
			return nil
		}
		return err
	}
	if !user.IsActive {
		return nil
	}

	resetToken, err := s.jwt.GenerateResetToken(user.ID, user.Email, s.now())
	if err != nil {
		return err
	}

	createAndSendNotification(ctx, s.notifications, s.auditLogs, s.mailer, &models.Notification{
		UserID:  user.ID,
		Type:    models.NotificationPasswordReset,
		Subject: "Password Reset Request",
		Message: "A password reset has been requested. Use this token to reset your password: " + resetToken, // In a real app, send a link to the frontend
	}, user.Email)

	return nil
}

func (s *authService) ResetPassword(ctx context.Context, request dto.ResetPasswordRequest, info RequestInfo) error {
	claims, err := s.jwt.Validate(request.Token)
	if err != nil || claims.TokenType != "reset" {
		return ErrUnauthorized
	}

	user, err := s.users.FindByID(ctx, claims.UserID)
	if err != nil || !user.IsActive {
		return ErrUnauthorized
	}

	hashed, err := password.Hash(request.NewPassword)
	if err != nil {
		return err
	}

	user.PasswordHash = hashed
	if err := s.users.Update(ctx, user); err != nil {
		return err
	}

	// Optionally audit log this password reset
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &user.ID,
		Action:     "PASSWORD_RESET",
		EntityType: models.EntityUser,
		EntityID:   &user.ID,
		IPAddress:  info.IPAddress,
		UserAgent:  info.UserAgent,
	})

	return nil
}

func (s *authService) loginResponse(user *models.User, now time.Time) (dto.LoginResponse, error) {
	token, err := s.jwt.Generate(user.ID, user.Email, string(user.Role.Name), now)
	if err != nil {
		return dto.LoginResponse{}, err
	}
	return dto.LoginResponse{
		AccessToken: token.AccessToken,
		TokenType:   "Bearer",
		ExpiresAt:   token.ExpiresAt,
		User:        ToUserResponse(*user),
	}, nil
}
