package service_test

import (
	"context"
	"testing"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/service"
	mocks "docuvault-be/tests/mocks/service"
	repoMocks "docuvault-be/tests/mocks/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestPermissionService_Grant(t *testing.T) {
	mockPermRepo := repoMocks.NewPermissionRepository(t)
	mockDocRepo := repoMocks.NewDocumentRepository(t)
	mockUserRepo := repoMocks.NewUserRepository(t)
	mockRoleRepo := repoMocks.NewRoleRepository(t)
	mockDeptRepo := repoMocks.NewDepartmentRepository(t)
	mockAuditLogs := mocks.NewAuditLogService(t)
	mockNotifRepo := repoMocks.NewNotificationRepository(t)
	
	svc := service.NewPermissionService(mockPermRepo, mockDocRepo, mockUserRepo, mockRoleRepo, mockDeptRepo, mockAuditLogs, mockNotifRepo, nil)
	ctx := context.Background()

	t.Run("Success_User", func(t *testing.T) {
		docID := uuid.New()
		targetUserID := uuid.New()
		actor := dto.AuthUser{ID: uuid.New(), SystemPermissions: []string{"documents:read_all"}}
		
		doc := &models.Document{BaseModel: models.BaseModel{ID: docID}, Title: "Test Doc", UploadedBy: actor.ID}
		mockDocRepo.On("FindByID", ctx, docID).Return(doc, nil).Once()

		req := dto.GrantPermissionRequest{
			DocumentID:     docID,
			UserIDs:        []uuid.UUID{targetUserID},
			PermissionType: string(models.PermissionView),
		}

		targetUser := &models.User{BaseModel: models.BaseModel{ID: targetUserID}, Email: "target@example.com"}
		mockUserRepo.On("FindByID", ctx, targetUserID).Return(targetUser, nil).Once()

		mockPermRepo.On("Create", ctx, mock.AnythingOfType("*models.Permission")).Return(nil).Once()
		mockNotifRepo.On("Create", ctx, mock.AnythingOfType("*models.Notification")).Return(nil).Once()
		mockAuditLogs.On("Record", ctx, mock.AnythingOfType("service.AuditEvent")).Return(nil).Once()

		resp, err := svc.Grant(ctx, req, actor)

		assert.NoError(t, err)
		assert.Len(t, resp, 1)
		mockDocRepo.AssertExpectations(t)
		mockUserRepo.AssertExpectations(t)
		mockPermRepo.AssertExpectations(t)
	})
}

func TestPermissionService_ListByDocument(t *testing.T) {
	mockPermRepo := repoMocks.NewPermissionRepository(t)
	mockDocRepo := repoMocks.NewDocumentRepository(t)
	svc := service.NewPermissionService(mockPermRepo, mockDocRepo, nil, nil, nil, nil, nil, nil)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		docID := uuid.New()
		actor := dto.AuthUser{ID: uuid.New(), SystemPermissions: []string{"documents:read_all"}}

		doc := &models.Document{BaseModel: models.BaseModel{ID: docID}, UploadedBy: actor.ID}
		mockDocRepo.On("FindByID", ctx, docID).Return(doc, nil).Once()

		permissions := []models.Permission{
			{BaseModel: models.BaseModel{ID: uuid.New()}, DocumentID: docID, PermissionType: models.PermissionView},
		}
		mockPermRepo.On("ListByDocument", ctx, docID).Return(permissions, nil).Once()

		resp, err := svc.ListByDocument(ctx, docID, actor)

		assert.NoError(t, err)
		assert.Len(t, resp, 1)
		mockDocRepo.AssertExpectations(t)
		mockPermRepo.AssertExpectations(t)
	})
}

func TestPermissionService_Revoke(t *testing.T) {
	mockPermRepo := repoMocks.NewPermissionRepository(t)
	mockDocRepo := repoMocks.NewDocumentRepository(t)
	mockAuditLogs := mocks.NewAuditLogService(t)
	svc := service.NewPermissionService(mockPermRepo, mockDocRepo, nil, nil, nil, mockAuditLogs, nil, nil)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		docID := uuid.New()
		actor := dto.AuthUser{ID: uuid.New(), SystemPermissions: []string{"documents:read_all"}}

		permission := &models.Permission{BaseModel: models.BaseModel{ID: id}, DocumentID: docID}
		mockPermRepo.On("FindByID", ctx, id).Return(permission, nil).Once()

		doc := &models.Document{BaseModel: models.BaseModel{ID: docID}, UploadedBy: actor.ID}
		mockDocRepo.On("FindByID", ctx, docID).Return(doc, nil).Once()

		mockPermRepo.On("Delete", ctx, id).Return(nil).Once()
		mockAuditLogs.On("Record", ctx, mock.AnythingOfType("service.AuditEvent")).Return(nil).Once()

		err := svc.Revoke(ctx, id, actor)

		assert.NoError(t, err)
		mockPermRepo.AssertExpectations(t)
		mockDocRepo.AssertExpectations(t)
		mockAuditLogs.AssertExpectations(t)
	})
}
