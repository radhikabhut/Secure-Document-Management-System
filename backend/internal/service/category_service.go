package service

import (
	"context"
	"strings"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/repository"
	"github.com/google/uuid"
)

type CategoryService interface {
	Create(ctx context.Context, request dto.CreateCategoryRequest, createdBy uuid.UUID) (dto.CategoryResponse, error)
	Get(ctx context.Context, id uuid.UUID) (dto.CategoryResponse, error)
	List(ctx context.Context, request dto.CategoryListRequest) (dto.PaginatedResponse[dto.CategoryResponse], error)
	Update(ctx context.Context, id uuid.UUID, request dto.UpdateCategoryRequest) (dto.CategoryResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type categoryService struct {
	categories repository.CategoryRepository
	auditLogs  AuditLogService
}

func NewCategoryService(categories repository.CategoryRepository, auditLogs AuditLogService) CategoryService {
	return &categoryService{categories: categories, auditLogs: auditLogs}
}

func (s *categoryService) Create(ctx context.Context, request dto.CreateCategoryRequest, createdBy uuid.UUID) (dto.CategoryResponse, error) {
	category := &models.Category{
		Name:        strings.TrimSpace(request.Name),
		Description: strings.TrimSpace(request.Description),
		CreatedBy:   createdBy,
	}
	if err := s.categories.Create(ctx, category); err != nil {
		return dto.CategoryResponse{}, err
	}
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &createdBy,
		Action:     models.AuditActionCategoryCreate,
		EntityType: models.EntityCategory,
		EntityID:   &category.ID,
	})
	return ToCategoryResponse(*category), nil
}

func (s *categoryService) Get(ctx context.Context, id uuid.UUID) (dto.CategoryResponse, error) {
	category, err := s.categories.FindByID(ctx, id)
	if err != nil {
		return dto.CategoryResponse{}, normalizeError(err)
	}
	return ToCategoryResponse(*category), nil
}

func (s *categoryService) List(ctx context.Context, request dto.CategoryListRequest) (dto.PaginatedResponse[dto.CategoryResponse], error) {
	categories, total, err := s.categories.List(ctx, repository.CategoryFilter{
		Pagination: toRepositoryPagination(request.PaginationRequest),
		Keyword:    request.Keyword,
	})
	if err != nil {
		return dto.PaginatedResponse[dto.CategoryResponse]{}, err
	}

	responses := make([]dto.CategoryResponse, 0, len(categories))
	for _, category := range categories {
		responses = append(responses, ToCategoryResponse(category))
	}
	return dto.NewPaginatedResponse(responses, request.PaginationRequest, total), nil
}

func (s *categoryService) Update(ctx context.Context, id uuid.UUID, request dto.UpdateCategoryRequest) (dto.CategoryResponse, error) {
	category, err := s.categories.FindByID(ctx, id)
	if err != nil {
		return dto.CategoryResponse{}, normalizeError(err)
	}
	if request.Name != nil {
		category.Name = strings.TrimSpace(*request.Name)
	}
	if request.Description != nil {
		category.Description = strings.TrimSpace(*request.Description)
	}
	if err := s.categories.Update(ctx, category); err != nil {
		return dto.CategoryResponse{}, err
	}
	return ToCategoryResponse(*category), nil
}

func (s *categoryService) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := s.categories.FindByID(ctx, id); err != nil {
		return normalizeError(err)
	}
	return s.categories.Delete(ctx, id)
}
