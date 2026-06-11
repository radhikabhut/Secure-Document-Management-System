package service

import (
	"context"
	"time"

	"docuvault-be/internal/dto"
	"docuvault-be/internal/repository"
)

type DashboardService interface {
	Stats(ctx context.Context) (dto.DashboardStatsResponse, error)
}

type dashboardService struct {
	dashboard repository.DashboardRepository
	auditLogs repository.AuditLogRepository
	now       func() time.Time
}

func NewDashboardService(dashboard repository.DashboardRepository, auditLogs repository.AuditLogRepository) DashboardService {
	return &dashboardService{dashboard: dashboard, auditLogs: auditLogs, now: time.Now}
}

func (s *dashboardService) Stats(ctx context.Context) (dto.DashboardStatsResponse, error) {
	now := s.now()
	totalUsers, err := s.dashboard.CountUsers(ctx)
	if err != nil {
		return dto.DashboardStatsResponse{}, err
	}
	totalDocuments, err := s.dashboard.CountDocuments(ctx)
	if err != nil {
		return dto.DashboardStatsResponse{}, err
	}
	totalCategories, err := s.dashboard.CountCategories(ctx)
	if err != nil {
		return dto.DashboardStatsResponse{}, err
	}
	uploadedToday, err := s.dashboard.CountDocumentsUploadedToday(ctx, now)
	if err != nil {
		return dto.DashboardStatsResponse{}, err
	}
	storageUsage, err := s.dashboard.StorageUsageBytes(ctx)
	if err != nil {
		return dto.DashboardStatsResponse{}, err
	}
	activeUsers, err := s.dashboard.MostActiveUsers(ctx, 5)
	if err != nil {
		return dto.DashboardStatsResponse{}, err
	}
	recentLogs, err := s.auditLogs.Recent(ctx, 10)
	if err != nil {
		return dto.DashboardStatsResponse{}, err
	}

	active := make([]dto.ActiveUserStat, 0, len(activeUsers))
	for _, stat := range activeUsers {
		active = append(active, ToActiveUserStat(stat))
	}
	recent := make([]dto.AuditLogResponse, 0, len(recentLogs))
	for _, log := range recentLogs {
		recent = append(recent, ToAuditLogResponse(log))
	}

	return dto.DashboardStatsResponse{
		TotalUsers:             totalUsers,
		TotalDocuments:         totalDocuments,
		TotalCategories:        totalCategories,
		DocumentsUploadedToday: uploadedToday,
		StorageUsageBytes:      storageUsage,
		MostActiveUsers:        active,
		RecentAuditEvents:      recent,
		GeneratedAt:            now,
	}, nil
}
