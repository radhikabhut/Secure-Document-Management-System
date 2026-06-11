package dto

import (
	"time"

	"github.com/google/uuid"
)

type DashboardStatsResponse struct {
	TotalUsers             int64              `json:"total_users"`
	TotalDocuments         int64              `json:"total_documents"`
	TotalCategories        int64              `json:"total_categories"`
	DocumentsUploadedToday int64              `json:"documents_uploaded_today"`
	StorageUsageBytes      int64              `json:"storage_usage_bytes"`
	MostActiveUsers        []ActiveUserStat   `json:"most_active_users"`
	RecentAuditEvents      []AuditLogResponse `json:"recent_audit_events"`
	GeneratedAt            time.Time          `json:"generated_at"`
}

type ActiveUserStat struct {
	UserID      uuid.UUID `json:"user_id"`
	FullName    string    `json:"full_name"`
	Email       string    `json:"email"`
	ActionCount int64     `json:"action_count"`
}
