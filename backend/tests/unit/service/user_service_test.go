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

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestUserService_Create(t *testing.T) {
	mockUserRepo := repoMocks.NewUserRepository(t)
	mockRoleRepo := repoMocks.NewRoleRepository(t)
	mockDeptRepo := repoMocks.NewDepartmentRepository(t)
	svc := service.NewUserService(mockUserRepo, mockRoleRepo, mockDeptRepo)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		req := dto.CreateUserRequest{
			FullName: "John Doe",
			Email:    "john@example.com",
			Password: "Password123!",
			Role:     string(models.RoleEmployee),
		}

		mockUserRepo.On("FindByEmail", ctx, "john@example.com").Return(nil, service.ErrNotFound).Once()
		role := &models.Role{BaseModel: models.BaseModel{ID: uuid.New()}, Name: models.RoleEmployee}
		mockRoleRepo.On("FindByName", ctx, models.RoleEmployee).Return(role, nil).Once()

		mockUserRepo.On("Create", ctx, mock.MatchedBy(func(u *models.User) bool {
			return u.Email == "john@example.com" && u.FullName == "John Doe" && u.RoleID == role.ID
		})).Run(func(args mock.Arguments) {
			u := args.Get(1).(*models.User)
			u.ID = uuid.New()
			u.CreatedAt = time.Now()
			u.UpdatedAt = time.Now()
		}).Return(nil).Once()

		resp, err := svc.Create(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, req.FullName, resp.FullName)
		assert.Equal(t, req.Email, resp.Email)
		assert.NotEqual(t, uuid.Nil, resp.ID)
		mockUserRepo.AssertExpectations(t)
		mockRoleRepo.AssertExpectations(t)
	})

	t.Run("Conflict", func(t *testing.T) {
		req := dto.CreateUserRequest{Email: "john@example.com"}
		mockUserRepo.On("FindByEmail", ctx, "john@example.com").Return(&models.User{}, nil).Once()

		resp, err := svc.Create(ctx, req)

		assert.ErrorIs(t, err, service.ErrConflict)
		assert.Equal(t, dto.UserResponse{}, resp)
		mockUserRepo.AssertExpectations(t)
	})
}

func TestUserService_Get(t *testing.T) {
	mockUserRepo := repoMocks.NewUserRepository(t)
	svc := service.NewUserService(mockUserRepo, nil, nil)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		user := &models.User{
			BaseModel: models.BaseModel{ID: id},
			FullName:  "John Doe",
			Email:     "john@example.com",
		}
		mockUserRepo.On("FindByID", ctx, id).Return(user, nil).Once()

		resp, err := svc.Get(ctx, id)

		assert.NoError(t, err)
		assert.Equal(t, user.FullName, resp.FullName)
		assert.Equal(t, user.ID, resp.ID)
		mockUserRepo.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		mockUserRepo.On("FindByID", ctx, id).Return(nil, errors.New("not found")).Once()

		resp, err := svc.Get(ctx, id)

		assert.Error(t, err)
		assert.Equal(t, dto.UserResponse{}, resp)
		mockUserRepo.AssertExpectations(t)
	})
}

func TestUserService_List(t *testing.T) {
	mockUserRepo := repoMocks.NewUserRepository(t)
	svc := service.NewUserService(mockUserRepo, nil, nil)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		users := []models.User{
			{BaseModel: models.BaseModel{ID: uuid.New()}, FullName: "John Doe"},
			{BaseModel: models.BaseModel{ID: uuid.New()}, FullName: "Jane Doe"},
		}
		req := dto.UserListRequest{
			PaginationRequest: dto.PaginationRequest{Page: 1, PageSize: 10},
		}

		mockUserRepo.On("List", ctx, mock.AnythingOfType("repository.UserFilter")).Return(users, int64(2), nil).Once()

		resp, err := svc.List(ctx, req)

		assert.NoError(t, err)
		assert.Len(t, resp.Items, 2)
		assert.Equal(t, int64(2), resp.TotalItems)
		assert.Equal(t, "John Doe", resp.Items[0].FullName)
		mockUserRepo.AssertExpectations(t)
	})
}

func TestUserService_Update(t *testing.T) {
	mockUserRepo := repoMocks.NewUserRepository(t)
	mockRoleRepo := repoMocks.NewRoleRepository(t)
	svc := service.NewUserService(mockUserRepo, mockRoleRepo, nil)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		user := &models.User{BaseModel: models.BaseModel{ID: id}, FullName: "Old Name"}
		newName := "New Name"
		req := dto.UpdateUserRequest{FullName: &newName}

		mockUserRepo.On("FindByID", ctx, id).Return(user, nil).Once()
		mockUserRepo.On("Update", ctx, mock.MatchedBy(func(u *models.User) bool {
			return u.FullName == newName && u.ID == id
		})).Return(nil).Once()

		resp, err := svc.Update(ctx, id, req)

		assert.NoError(t, err)
		assert.Equal(t, newName, resp.FullName)
		mockUserRepo.AssertExpectations(t)
	})
}

func TestUserService_Delete(t *testing.T) {
	mockUserRepo := repoMocks.NewUserRepository(t)
	svc := service.NewUserService(mockUserRepo, nil, nil)
	ctx := context.Background()
	id := uuid.New()

	t.Run("Success", func(t *testing.T) {
		user := &models.User{BaseModel: models.BaseModel{ID: id}, FullName: "John Doe"}
		mockUserRepo.On("FindByID", ctx, id).Return(user, nil).Once()
		mockUserRepo.On("Delete", ctx, id).Return(nil).Once()

		err := svc.Delete(ctx, id)

		assert.NoError(t, err)
		mockUserRepo.AssertExpectations(t)
	})
}
