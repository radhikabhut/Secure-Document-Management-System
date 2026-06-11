package service

import (
	"context"
	"strings"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/repository"
	"github.com/google/uuid"
)

type DepartmentService interface {
	Create(ctx context.Context, request dto.CreateDepartmentRequest) (dto.DepartmentResponse, error)
	Get(ctx context.Context, id uuid.UUID) (dto.DepartmentResponse, error)
	List(ctx context.Context) ([]dto.DepartmentResponse, error)
	Update(ctx context.Context, id uuid.UUID, request dto.UpdateDepartmentRequest) (dto.DepartmentResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type departmentService struct {
	departments repository.DepartmentRepository
}

func NewDepartmentService(departments repository.DepartmentRepository) DepartmentService {
	return &departmentService{departments: departments}
}

func (s *departmentService) Create(ctx context.Context, request dto.CreateDepartmentRequest) (dto.DepartmentResponse, error) {
	name := strings.TrimSpace(request.Name)
	if existing, _ := s.departments.FindByName(ctx, name); existing != nil {
		return dto.DepartmentResponse{}, ErrConflict
	}

	department := &models.Department{
		Name:        name,
		Description: strings.TrimSpace(request.Description),
	}

	if err := s.departments.Create(ctx, department); err != nil {
		return dto.DepartmentResponse{}, err
	}
	return ToDepartmentResponse(*department), nil
}

func (s *departmentService) Get(ctx context.Context, id uuid.UUID) (dto.DepartmentResponse, error) {
	department, err := s.departments.FindByID(ctx, id)
	if err != nil {
		return dto.DepartmentResponse{}, normalizeError(err)
	}
	return ToDepartmentResponse(*department), nil
}

func (s *departmentService) List(ctx context.Context) ([]dto.DepartmentResponse, error) {
	departments, err := s.departments.List(ctx)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.DepartmentResponse, len(departments))
	for i, dept := range departments {
		responses[i] = ToDepartmentResponse(dept)
	}
	return responses, nil
}

func (s *departmentService) Update(ctx context.Context, id uuid.UUID, request dto.UpdateDepartmentRequest) (dto.DepartmentResponse, error) {
	department, err := s.departments.FindByID(ctx, id)
	if err != nil {
		return dto.DepartmentResponse{}, normalizeError(err)
	}

	if request.Name != nil {
		name := strings.TrimSpace(*request.Name)
		if name != department.Name {
			if existing, _ := s.departments.FindByName(ctx, name); existing != nil {
				return dto.DepartmentResponse{}, ErrConflict
			}
			department.Name = name
		}
	}
	if request.Description != nil {
		department.Description = strings.TrimSpace(*request.Description)
	}

	if err := s.departments.Update(ctx, department); err != nil {
		return dto.DepartmentResponse{}, err
	}

	return ToDepartmentResponse(*department), nil
}

func (s *departmentService) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := s.departments.FindByID(ctx, id)
	if err != nil {
		return normalizeError(err)
	}
	return s.departments.Delete(ctx, id)
}
