package service

import (
	"context"
	"time"

	"docuvault-be/internal/dto"
	"docuvault-be/internal/repository"
	"github.com/google/uuid"
)

type NotificationService interface {
	List(ctx context.Context, userID uuid.UUID, request dto.NotificationListRequest) (dto.PaginatedResponse[dto.NotificationResponse], error)
	MarkSent(ctx context.Context, id uuid.UUID) (dto.NotificationResponse, error)
	MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) (dto.NotificationResponse, error)
}

type notificationService struct {
	notifications repository.NotificationRepository
	now           func() time.Time
}

func NewNotificationService(notifications repository.NotificationRepository) NotificationService {
	return &notificationService{notifications: notifications, now: time.Now}
}

func (s *notificationService) List(ctx context.Context, userID uuid.UUID, request dto.NotificationListRequest) (dto.PaginatedResponse[dto.NotificationResponse], error) {
	notifications, total, err := s.notifications.List(ctx, repository.NotificationFilter{
		Pagination: toRepositoryPagination(request.PaginationRequest),
		UserID:     &userID,
		IsSent:     request.IsSent,
		Type:       request.Type,
	})
	if err != nil {
		return dto.PaginatedResponse[dto.NotificationResponse]{}, err
	}

	responses := make([]dto.NotificationResponse, 0, len(notifications))
	for _, notification := range notifications {
		responses = append(responses, ToNotificationResponse(notification))
	}
	return dto.NewPaginatedResponse(responses, request.PaginationRequest, total), nil
}

func (s *notificationService) MarkSent(ctx context.Context, id uuid.UUID) (dto.NotificationResponse, error) {
	if err := s.notifications.MarkSent(ctx, id, s.now()); err != nil {
		return dto.NotificationResponse{}, err
	}
	notification, err := s.notifications.FindByID(ctx, id)
	if err != nil {
		return dto.NotificationResponse{}, normalizeError(err)
	}
	return ToNotificationResponse(*notification), nil
}

func (s *notificationService) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) (dto.NotificationResponse, error) {
	if err := s.notifications.MarkRead(ctx, id, userID, s.now()); err != nil {
		return dto.NotificationResponse{}, err
	}
	notification, err := s.notifications.FindByID(ctx, id)
	if err != nil {
		return dto.NotificationResponse{}, normalizeError(err)
	}
	return ToNotificationResponse(*notification), nil
}
