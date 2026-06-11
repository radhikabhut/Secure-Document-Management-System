package service_test

import (
	"context"
	"testing"


	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/repository"
	"docuvault-be/internal/service"
	repoMocks "docuvault-be/tests/mocks/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestDashboardService_Stats(t *testing.T) {
	mockDashboardRepo := repoMocks.NewDashboardRepository(t)
	mockAuditRepo := repoMocks.NewAuditLogRepository(t)
	svc := service.NewDashboardService(mockDashboardRepo, mockAuditRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		mockDashboardRepo.On("CountUsers", ctx).Return(int64(10), nil).Once()
		mockDashboardRepo.On("CountDocuments", ctx).Return(int64(100), nil).Once()
		mockDashboardRepo.On("CountCategories", ctx).Return(int64(5), nil).Once()
		mockDashboardRepo.On("CountDocumentsUploadedToday", ctx, mock.AnythingOfType("time.Time")).Return(int64(2), nil).Once()
		mockDashboardRepo.On("StorageUsageBytes", ctx).Return(int64(2048), nil).Once()
		
		activeUsers := []repository.ActiveUserStat{
			{UserID: uuid.New(), FullName: "John Doe", Email: "john@example.com", ActionCount: 50},
		}
		mockDashboardRepo.On("MostActiveUsers", ctx, 5).Return(activeUsers, nil).Once()

		recentLogs := []models.AuditLog{
			{BaseModel: models.BaseModel{ID: uuid.New()}, Action: models.AuditActionLogin},
		}
		mockAuditRepo.On("Recent", ctx, 10).Return(recentLogs, nil).Once()

		resp, err := svc.Stats(ctx)

		assert.NoError(t, err)
		assert.Equal(t, int64(10), resp.TotalUsers)
		assert.Equal(t, int64(100), resp.TotalDocuments)
		assert.Equal(t, int64(5), resp.TotalCategories)
		assert.Equal(t, int64(2), resp.DocumentsUploadedToday)
		assert.Equal(t, int64(2048), resp.StorageUsageBytes)
		assert.Len(t, resp.MostActiveUsers, 1)
		assert.Len(t, resp.RecentAuditEvents, 1)

		mockDashboardRepo.AssertExpectations(t)
		mockAuditRepo.AssertExpectations(t)
	})
}
