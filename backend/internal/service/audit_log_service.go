package service

import (
	"context"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/repository"
	"github.com/google/uuid"
)

type AuditEvent struct {
	UserID     *uuid.UUID
	Action     models.AuditAction
	EntityType models.EntityType
	EntityID   *uuid.UUID
	IPAddress  string
	UserAgent  string
	Metadata   models.JSONMap
}

type AuditLogService interface {
	Record(ctx context.Context, event AuditEvent) error
	List(ctx context.Context, request dto.AuditLogListRequest) (dto.PaginatedResponse[dto.AuditLogResponse], error)
	Recent(ctx context.Context, limit int) ([]dto.AuditLogResponse, error)
}

type auditLogService struct {
	auditLogs repository.AuditLogRepository
}

func NewAuditLogService(auditLogs repository.AuditLogRepository) AuditLogService {
	return &auditLogService{auditLogs: auditLogs}
}

func (s *auditLogService) Record(ctx context.Context, event AuditEvent) error {
	auditLog := &models.AuditLog{
		UserID:     event.UserID,
		Action:     event.Action,
		EntityType: event.EntityType,
		EntityID:   event.EntityID,
		IPAddress:  event.IPAddress,
		UserAgent:  event.UserAgent,
		Metadata:   event.Metadata,
	}
	if auditLog.Metadata == nil {
		auditLog.Metadata = models.JSONMap{}
	}
	return s.auditLogs.Create(ctx, auditLog)
}

func (s *auditLogService) List(ctx context.Context, request dto.AuditLogListRequest) (dto.PaginatedResponse[dto.AuditLogResponse], error) {
	logs, total, err := s.auditLogs.List(ctx, repository.AuditLogFilter{
		Pagination: toRepositoryPagination(request.PaginationRequest),
		UserID:     request.UserID,
		Action:     request.Action,
		EntityType: request.EntityType,
		EntityID:   request.EntityID,
		DateRange: repository.DateRange{
			From: request.From,
			To:   request.To,
		},
	})
	if err != nil {
		return dto.PaginatedResponse[dto.AuditLogResponse]{}, err
	}

	responses := make([]dto.AuditLogResponse, 0, len(logs))
	for _, log := range logs {
		responses = append(responses, ToAuditLogResponse(log))
	}
	return dto.NewPaginatedResponse(responses, request.PaginationRequest, total), nil
}

func (s *auditLogService) Recent(ctx context.Context, limit int) ([]dto.AuditLogResponse, error) {
	logs, err := s.auditLogs.Recent(ctx, limit)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.AuditLogResponse, 0, len(logs))
	for _, log := range logs {
		responses = append(responses, ToAuditLogResponse(log))
	}
	return responses, nil
}
