package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/service"
	mocks "docuvault-be/tests/mocks/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestDepartmentService_Create(t *testing.T) {
	mockRepo := mocks.NewDepartmentRepository(t)
	svc := service.NewDepartmentService(mockRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		req := dto.CreateDepartmentRequest{
			Name:        "IT",
			Description: "Information Technology",
		}

		mockRepo.On("FindByName", ctx, req.Name).Return(nil, nil).Once()

		mockRepo.On("Create", ctx, mock.MatchedBy(func(d *models.Department) bool {
			return d.Name == req.Name && d.Description == req.Description
		})).Run(func(args mock.Arguments) {
			d := args.Get(1).(*models.Department)
			d.ID = uuid.New()
			d.CreatedAt = time.Now()
			d.UpdatedAt = time.Now()
		}).Return(nil).Once()

		resp, err := svc.Create(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, req.Name, resp.Name)
		assert.Equal(t, req.Description, resp.Description)
		assert.NotEqual(t, uuid.Nil, resp.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Conflict", func(t *testing.T) {
		req := dto.CreateDepartmentRequest{Name: "IT"}
		mockRepo.On("FindByName", ctx, req.Name).Return(&models.Department{}, nil).Once()

		resp, err := svc.Create(ctx, req)

		assert.ErrorIs(t, err, service.ErrConflict)
		assert.Equal(t, dto.DepartmentResponse{}, resp)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_Get(t *testing.T) {
	mockRepo := mocks.NewDepartmentRepository(t)
	svc := service.NewDepartmentService(mockRepo)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		dept := &models.Department{
			BaseModel:   models.BaseModel{ID: id},
			Name:        "HR",
			Description: "Human Resources",
		}
		mockRepo.On("FindByID", ctx, id).Return(dept, nil).Once()

		resp, err := svc.Get(ctx, id)

		assert.NoError(t, err)
		assert.Equal(t, dept.Name, resp.Name)
		assert.Equal(t, dept.ID, resp.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		mockRepo.On("FindByID", ctx, id).Return(nil, errors.New("not found")).Once()

		resp, err := svc.Get(ctx, id)

		assert.Error(t, err)
		assert.Equal(t, dto.DepartmentResponse{}, resp)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_List(t *testing.T) {
	mockRepo := mocks.NewDepartmentRepository(t)
	svc := service.NewDepartmentService(mockRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		departments := []models.Department{
			{BaseModel: models.BaseModel{ID: uuid.New()}, Name: "HR"},
			{BaseModel: models.BaseModel{ID: uuid.New()}, Name: "IT"},
		}
		mockRepo.On("List", ctx).Return(departments, nil).Once()

		resp, err := svc.List(ctx)

		assert.NoError(t, err)
		assert.Len(t, resp, 2)
		assert.Equal(t, "HR", resp[0].Name)
		assert.Equal(t, "IT", resp[1].Name)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_Update(t *testing.T) {
	mockRepo := mocks.NewDepartmentRepository(t)
	svc := service.NewDepartmentService(mockRepo)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		dept := &models.Department{BaseModel: models.BaseModel{ID: id}, Name: "HR"}
		newName := "Human Resources"
		req := dto.UpdateDepartmentRequest{Name: &newName}

		mockRepo.On("FindByID", ctx, id).Return(dept, nil).Once()
		mockRepo.On("FindByName", ctx, newName).Return(nil, nil).Once()
		mockRepo.On("Update", ctx, mock.MatchedBy(func(d *models.Department) bool {
			return d.Name == newName && d.ID == id
		})).Return(nil).Once()

		resp, err := svc.Update(ctx, id, req)

		assert.NoError(t, err)
		assert.Equal(t, newName, resp.Name)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_Delete(t *testing.T) {
	mockRepo := mocks.NewDepartmentRepository(t)
	svc := service.NewDepartmentService(mockRepo)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		dept := &models.Department{BaseModel: models.BaseModel{ID: id}, Name: "HR"}
		mockRepo.On("FindByID", ctx, id).Return(dept, nil).Once()
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := svc.Delete(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}
