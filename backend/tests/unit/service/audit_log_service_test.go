package service_test

import (
	"context"
	"testing"
	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/service"
	repoMocks "docuvault-be/tests/mocks/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAuditLogService_Record(t *testing.T) {
	mockRepo := repoMocks.NewAuditLogRepository(t)
	svc := service.NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		userID := uuid.New()
		entityID := uuid.New()
		event := service.AuditEvent{
			UserID:     &userID,
			Action:     models.AuditActionLogin,
			EntityType: models.EntityUser,
			EntityID:   &entityID,
			IPAddress:  "127.0.0.1",
			UserAgent:  "TestAgent",
		}

		mockRepo.On("Create", ctx, mock.MatchedBy(func(l *models.AuditLog) bool {
			return l.Action == models.AuditActionLogin && l.IPAddress == "127.0.0.1"
		})).Return(nil).Once()

		err := svc.Record(ctx, event)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_List(t *testing.T) {
	mockRepo := repoMocks.NewAuditLogRepository(t)
	svc := service.NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		logs := []models.AuditLog{
			{BaseModel: models.BaseModel{ID: uuid.New()}, Action: models.AuditActionLogin},
		}
		req := dto.AuditLogListRequest{
			PaginationRequest: dto.PaginationRequest{Page: 1, PageSize: 10},
		}

		mockRepo.On("List", ctx, mock.AnythingOfType("repository.AuditLogFilter")).Return(logs, int64(1), nil).Once()

		resp, err := svc.List(ctx, req)

		assert.NoError(t, err)
		assert.Len(t, resp.Items, 1)
		assert.Equal(t, int64(1), resp.TotalItems)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_Recent(t *testing.T) {
	mockRepo := repoMocks.NewAuditLogRepository(t)
	svc := service.NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		logs := []models.AuditLog{
			{BaseModel: models.BaseModel{ID: uuid.New()}, Action: models.AuditActionLogin},
		}

		mockRepo.On("Recent", ctx, 10).Return(logs, nil).Once()

		resp, err := svc.Recent(ctx, 10)

		assert.NoError(t, err)
		assert.Len(t, resp, 1)
		mockRepo.AssertExpectations(t)
	})
}
