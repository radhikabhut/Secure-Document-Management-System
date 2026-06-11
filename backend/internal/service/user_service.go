package service

import (
	"context"

	"errors"
	"strings"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/password"
	"docuvault-be/internal/repository"
	"github.com/google/uuid"
)

type UserService interface {
	Create(ctx context.Context, request dto.CreateUserRequest) (dto.UserResponse, error)
	Get(ctx context.Context, id uuid.UUID) (dto.UserResponse, error)
	List(ctx context.Context, request dto.UserListRequest) (dto.PaginatedResponse[dto.UserResponse], error)
	Update(ctx context.Context, id uuid.UUID, request dto.UpdateUserRequest) (dto.UserResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type userService struct {
	users       repository.UserRepository
	roles       repository.RoleRepository
	departments repository.DepartmentRepository
}

func NewUserService(users repository.UserRepository, roles repository.RoleRepository, departments repository.DepartmentRepository) UserService {
	return &userService{users: users, roles: roles, departments: departments}
}

func (s *userService) Create(ctx context.Context, request dto.CreateUserRequest) (dto.UserResponse, error) {
	email := strings.ToLower(strings.TrimSpace(request.Email))
	if existing, err := s.users.FindByEmail(ctx, email); err == nil && existing != nil {
		return dto.UserResponse{}, ErrConflict
	} else if err != nil && !errors.Is(normalizeError(err), ErrNotFound) {
		return dto.UserResponse{}, err
	}

	var role *models.Role
	var err error
	if request.Role != "" {
		role, err = s.roles.FindByName(ctx, models.RoleName(request.Role))
	} else {
		role, err = s.roles.FindByName(ctx, models.RoleEmployee)
	}
	if err != nil {
		return dto.UserResponse{}, normalizeError(err)
	}

	hashed, err := password.Hash(request.Password)
	if err != nil {
		return dto.UserResponse{}, err
	}

	user := &models.User{
		FullName:     strings.TrimSpace(request.FullName),
		Username:     strings.TrimSpace(request.Username),
		Email:        email,
		PasswordHash: hashed,
		RoleID:       role.ID,
		Role:         *role,
		DepartmentID: request.DepartmentID,
		IsActive:     true,
	}
	if err := s.users.Create(ctx, user); err != nil {
		return dto.UserResponse{}, err
	}

	return ToUserResponse(*user), nil
}

func (s *userService) Get(ctx context.Context, id uuid.UUID) (dto.UserResponse, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return dto.UserResponse{}, normalizeError(err)
	}
	return ToUserResponse(*user), nil
}

func (s *userService) List(ctx context.Context, request dto.UserListRequest) (dto.PaginatedResponse[dto.UserResponse], error) {
	users, total, err := s.users.List(ctx, repository.UserFilter{
		Pagination: toRepositoryPagination(request.PaginationRequest),
		Keyword:    request.Keyword,
		Role:       request.Role,
		IsActive:   request.IsActive,
	})
	if err != nil {
		return dto.PaginatedResponse[dto.UserResponse]{}, err
	}

	responses := make([]dto.UserResponse, 0, len(users))
	for _, user := range users {
		responses = append(responses, ToUserResponse(user))
	}
	return dto.NewPaginatedResponse(responses, request.PaginationRequest, total), nil
}

func (s *userService) Update(ctx context.Context, id uuid.UUID, request dto.UpdateUserRequest) (dto.UserResponse, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return dto.UserResponse{}, normalizeError(err)
	}
	if request.FullName != nil {
		user.FullName = *request.FullName
	}
	if request.Username != nil {
		user.Username = *request.Username
	}
	if request.Role != nil {
		role, err := s.roles.FindByName(ctx, models.RoleName(*request.Role))
		if err != nil {
			return dto.UserResponse{}, normalizeError(err)
		}
		user.RoleID = role.ID
		user.Role = *role
	}
	if request.DepartmentID != nil {
		// Verify department exists
		if _, err := s.departments.FindByID(ctx, *request.DepartmentID); err != nil {
			return dto.UserResponse{}, normalizeError(err)
		}
		user.DepartmentID = request.DepartmentID
	}
	if request.IsActive != nil {
		user.IsActive = *request.IsActive
	}
	if err := s.users.Update(ctx, user); err != nil {
		return dto.UserResponse{}, err
	}
	return ToUserResponse(*user), nil
}

func (s *userService) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := s.users.FindByID(ctx, id); err != nil {
		return normalizeError(err)
	}
	return s.users.Delete(ctx, id)
}
