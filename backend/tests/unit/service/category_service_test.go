package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/service"
	repoMocks "docuvault-be/tests/mocks/repository"
	svcMocks "docuvault-be/tests/mocks/service"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestCategoryService_Create(t *testing.T) {
	mockRepo := repoMocks.NewCategoryRepository(t)
	mockAudit := svcMocks.NewAuditLogService(t)
	svc := service.NewCategoryService(mockRepo, mockAudit)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		req := dto.CreateCategoryRequest{
			Name:        "Finance",
			Description: "Financial documents",
		}
		userID := uuid.New()

		mockRepo.On("Create", ctx, mock.MatchedBy(func(c *models.Category) bool {
			return c.Name == req.Name && c.Description == req.Description && c.CreatedBy == userID
		})).Run(func(args mock.Arguments) {
			c := args.Get(1).(*models.Category)
			c.ID = uuid.New()
			c.CreatedAt = time.Now()
			c.UpdatedAt = time.Now()
		}).Return(nil).Once()

		mockAudit.On("Record", ctx, mock.MatchedBy(func(evt service.AuditEvent) bool {
			return evt.Action == models.AuditActionCategoryCreate && *evt.UserID == userID
		})).Return(nil).Once()

		resp, err := svc.Create(ctx, req, userID)

		assert.NoError(t, err)
		assert.Equal(t, req.Name, resp.Name)
		assert.Equal(t, req.Description, resp.Description)
		assert.NotEqual(t, uuid.Nil, resp.ID)
		mockRepo.AssertExpectations(t)
		mockAudit.AssertExpectations(t)
	})
}

func TestCategoryService_Get(t *testing.T) {
	mockRepo := repoMocks.NewCategoryRepository(t)
	mockAudit := svcMocks.NewAuditLogService(t)
	svc := service.NewCategoryService(mockRepo, mockAudit)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		category := &models.Category{
			BaseModel:   models.BaseModel{ID: id},
			Name:        "Finance",
			Description: "Financial Docs",
		}
		mockRepo.On("FindByID", ctx, id).Return(category, nil).Once()

		resp, err := svc.Get(ctx, id)

		assert.NoError(t, err)
		assert.Equal(t, category.Name, resp.Name)
		assert.Equal(t, category.ID, resp.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		mockRepo.On("FindByID", ctx, id).Return(nil, errors.New("not found")).Once()

		resp, err := svc.Get(ctx, id)

		assert.Error(t, err)
		assert.Equal(t, dto.CategoryResponse{}, resp)
		mockRepo.AssertExpectations(t)
	})
}

func TestCategoryService_List(t *testing.T) {
	mockRepo := repoMocks.NewCategoryRepository(t)
	mockAudit := svcMocks.NewAuditLogService(t)
	svc := service.NewCategoryService(mockRepo, mockAudit)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		categories := []models.Category{
			{BaseModel: models.BaseModel{ID: uuid.New()}, Name: "Finance"},
			{BaseModel: models.BaseModel{ID: uuid.New()}, Name: "HR"},
		}
		req := dto.CategoryListRequest{
			PaginationRequest: dto.PaginationRequest{Page: 1, PageSize: 10},
			Keyword:           "",
		}

		mockRepo.On("List", ctx, mock.AnythingOfType("repository.CategoryFilter")).Return(categories, int64(2), nil).Once()

		resp, err := svc.List(ctx, req)

		assert.NoError(t, err)
		assert.Len(t, resp.Items, 2)
		assert.Equal(t, int64(2), resp.TotalItems)
		assert.Equal(t, "Finance", resp.Items[0].Name)
		mockRepo.AssertExpectations(t)
	})
}

func TestCategoryService_Update(t *testing.T) {
	mockRepo := repoMocks.NewCategoryRepository(t)
	mockAudit := svcMocks.NewAuditLogService(t)
	svc := service.NewCategoryService(mockRepo, mockAudit)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		category := &models.Category{BaseModel: models.BaseModel{ID: id}, Name: "Old Name"}
		newName := "New Name"
		req := dto.UpdateCategoryRequest{Name: &newName}

		mockRepo.On("FindByID", ctx, id).Return(category, nil).Once()
		mockRepo.On("Update", ctx, mock.MatchedBy(func(c *models.Category) bool {
			return c.Name == newName && c.ID == id
		})).Return(nil).Once()

		resp, err := svc.Update(ctx, id, req)

		assert.NoError(t, err)
		assert.Equal(t, newName, resp.Name)
		mockRepo.AssertExpectations(t)
	})
}

func TestCategoryService_Delete(t *testing.T) {
	mockRepo := repoMocks.NewCategoryRepository(t)
	mockAudit := svcMocks.NewAuditLogService(t)
	svc := service.NewCategoryService(mockRepo, mockAudit)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		category := &models.Category{BaseModel: models.BaseModel{ID: id}, Name: "Finance"}
		mockRepo.On("FindByID", ctx, id).Return(category, nil).Once()
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := svc.Delete(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}
