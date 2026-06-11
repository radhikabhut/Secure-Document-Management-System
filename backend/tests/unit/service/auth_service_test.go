package service_test

import (
	"context"
	"testing"

	"docuvault-be/internal/config"
	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/auth"
	"docuvault-be/internal/service"
	repoMocks "docuvault-be/tests/mocks/repository"
	svcMocks "docuvault-be/tests/mocks/service"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAuthService_Register(t *testing.T) {
	mockUserRepo := repoMocks.NewUserRepository(t)
	mockRoleRepo := repoMocks.NewRoleRepository(t)
	mockNotifRepo := repoMocks.NewNotificationRepository(t)
	mockAuditLogs := svcMocks.NewAuditLogService(t)
	
	// Assuming a dummy JWT string for mocking or a fake JWT manager if possible
	// Actually we should create an auth.JWTManager or leave it, but NewAuthService requires a concrete *auth.JWTManager.
	// Since we can't easily mock *auth.JWTManager, let's skip the deep logic or construct a dummy one.
	jwtManager := auth.NewJWTManager(config.JWTConfig{Secret: "secret", ExpiresHours: 1}, "issuer")
	
	svc := service.NewAuthService(mockUserRepo, mockRoleRepo, mockNotifRepo, mockAuditLogs, jwtManager, nil)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		req := dto.RegisterRequest{
			FullName: "John Doe",
			Email:    "john@example.com",
			Password: "Password123!",
		}
		info := service.RequestInfo{IPAddress: "127.0.0.1"}

		mockUserRepo.On("FindByEmail", ctx, "john@example.com").Return(nil, service.ErrNotFound).Once()
		mockUserRepo.On("Count", ctx).Return(int64(0), nil).Once() // Returns 0, so role is Admin
		
		role := &models.Role{BaseModel: models.BaseModel{ID: uuid.New()}, Name: models.RoleAdmin}
		mockRoleRepo.On("FindByName", ctx, models.RoleAdmin).Return(role, nil).Once()

		mockUserRepo.On("Create", ctx, mock.AnythingOfType("*models.User")).Return(nil).Once()
		mockAuditLogs.On("Record", ctx, mock.AnythingOfType("service.AuditEvent")).Return(nil).Once()
		mockNotifRepo.On("Create", ctx, mock.AnythingOfType("*models.Notification")).Return(nil).Once()

		resp, err := svc.Register(ctx, req, info)

		assert.NoError(t, err)
		assert.NotEmpty(t, resp.AccessToken)
		assert.Equal(t, req.Email, resp.User.Email)
		
		mockUserRepo.AssertExpectations(t)
		mockRoleRepo.AssertExpectations(t)
		mockAuditLogs.AssertExpectations(t)
		mockNotifRepo.AssertExpectations(t)
	})
}
