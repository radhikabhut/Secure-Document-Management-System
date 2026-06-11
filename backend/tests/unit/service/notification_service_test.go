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

func TestNotificationService_List(t *testing.T) {
	mockRepo := repoMocks.NewNotificationRepository(t)
	svc := service.NewNotificationService(mockRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		userID := uuid.New()
		notifications := []models.Notification{
			{BaseModel: models.BaseModel{ID: uuid.New()}, UserID: userID, Subject: "Test subject"},
		}
		req := dto.NotificationListRequest{
			PaginationRequest: dto.PaginationRequest{Page: 1, PageSize: 10},
		}

		mockRepo.On("List", ctx, mock.AnythingOfType("repository.NotificationFilter")).Return(notifications, int64(1), nil).Once()

		resp, err := svc.List(ctx, userID, req)

		assert.NoError(t, err)
		assert.Len(t, resp.Items, 1)
		assert.Equal(t, int64(1), resp.TotalItems)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationService_MarkSent(t *testing.T) {
	mockRepo := repoMocks.NewNotificationRepository(t)
	svc := service.NewNotificationService(mockRepo)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		notification := &models.Notification{
			BaseModel: models.BaseModel{ID: id},
			Subject:   "Test subject",
		}

		mockRepo.On("MarkSent", ctx, id, mock.AnythingOfType("time.Time")).Return(nil).Once()
		mockRepo.On("FindByID", ctx, id).Return(notification, nil).Once()

		resp, err := svc.MarkSent(ctx, id)

		assert.NoError(t, err)
		assert.Equal(t, "Test subject", resp.Subject)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationService_MarkRead(t *testing.T) {
	mockRepo := repoMocks.NewNotificationRepository(t)
	svc := service.NewNotificationService(mockRepo)
	ctx := context.Background()
	id := uuid.New()
	userID := uuid.New()

	t.Run("Success", func(t *testing.T) {
		notification := &models.Notification{
			BaseModel: models.BaseModel{ID: id},
			UserID:    userID,
			Subject:   "Test subject",
		}

		mockRepo.On("MarkRead", ctx, id, userID, mock.AnythingOfType("time.Time")).Return(nil).Once()
		mockRepo.On("FindByID", ctx, id).Return(notification, nil).Once()

		resp, err := svc.MarkRead(ctx, id, userID)

		assert.NoError(t, err)
		assert.Equal(t, "Test subject", resp.Subject)
		mockRepo.AssertExpectations(t)
	})
}
