package service_test

import (
	"context"
	"testing"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/service"
	repoMocks "docuvault-be/tests/mocks/repository"
	svcMocks "docuvault-be/tests/mocks/service"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestDocumentService_Get(t *testing.T) {
	mockDocRepo := repoMocks.NewDocumentRepository(t)
	mockPermRepo := repoMocks.NewPermissionRepository(t)
	
	// Create service
	svc := service.NewDocumentService(mockDocRepo, nil, mockPermRepo, nil, nil)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		docID := uuid.New()
		actor := dto.AuthUser{ID: uuid.New(), SystemPermissions: []string{"documents:read_all"}}

		doc := &models.Document{
			BaseModel: models.BaseModel{ID: docID},
			Title:     "Test Document",
		}
		
		mockDocRepo.On("FindByID", ctx, docID).Return(doc, nil).Once()

		resp, err := svc.Get(ctx, docID, actor)

		assert.NoError(t, err)
		assert.Equal(t, "Test Document", resp.Title)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestDocumentService_Delete(t *testing.T) {
	mockDocRepo := repoMocks.NewDocumentRepository(t)
	mockPermRepo := repoMocks.NewPermissionRepository(t)
	mockAuditLogs := svcMocks.NewAuditLogService(t)

	svc := service.NewDocumentService(mockDocRepo, nil, mockPermRepo, mockAuditLogs, nil)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		docID := uuid.New()
		actor := dto.AuthUser{ID: uuid.New(), SystemPermissions: []string{"documents:delete_any"}}

		doc := &models.Document{
			BaseModel:  models.BaseModel{ID: docID},
			UploadedBy: actor.ID,
		}

		mockDocRepo.On("FindByID", ctx, docID).Return(doc, nil).Once()
		mockDocRepo.On("Delete", ctx, docID).Return(nil).Once()
		mockAuditLogs.On("Record", ctx, mock.AnythingOfType("service.AuditEvent")).Return(nil).Once()

		err := svc.Delete(ctx, docID, actor)

		assert.NoError(t, err)
		mockDocRepo.AssertExpectations(t)
		mockAuditLogs.AssertExpectations(t)
	})
}
