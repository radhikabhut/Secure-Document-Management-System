package repository

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Pagination struct {
	Limit     int
	Offset    int
	SortBy    string
	SortOrder string
}

func (p Pagination) Normalize(defaultSort string, allowedSorts map[string]bool) Pagination {
	if p.Limit <= 0 {
		p.Limit = 20
	}
	if p.Limit > 100 {
		p.Limit = 100
	}
	if p.Offset < 0 {
		p.Offset = 0
	}
	if p.SortOrder != "asc" && p.SortOrder != "desc" {
		p.SortOrder = "desc"
	}
	if p.SortBy == "" || !allowedSorts[p.SortBy] {
		p.SortBy = defaultSort
	}
	return p
}

func applyPagination(db *gorm.DB, pagination Pagination, defaultSort string, allowedSorts map[string]bool) *gorm.DB {
	normalized := pagination.Normalize(defaultSort, allowedSorts)
	return db.Order(normalized.SortBy + " " + normalized.SortOrder).Limit(normalized.Limit).Offset(normalized.Offset)
}

func applyPaginationWithSortColumns(db *gorm.DB, pagination Pagination, defaultSort string, allowedSorts map[string]string) *gorm.DB {
	normalized := pagination.Normalize(defaultSort, allowedSortColumnNames(allowedSorts))
	sortBy := allowedSorts[normalized.SortBy]
	if sortBy == "" {
		sortBy = normalized.SortBy
	}
	return db.Order(sortBy + " " + normalized.SortOrder).Limit(normalized.Limit).Offset(normalized.Offset)
}

func allowedSortColumnNames(allowedSorts map[string]string) map[string]bool {
	allowed := make(map[string]bool, len(allowedSorts))
	for key := range allowedSorts {
		allowed[key] = true
	}
	return allowed
}

func likeKeyword(keyword string) string {
	return "%" + strings.ToLower(strings.TrimSpace(keyword)) + "%"
}

type DateRange struct {
	From *time.Time
	To   *time.Time
}

type UserFilter struct {
	Pagination
	Keyword  string
	Role     string
	IsActive *bool
}

type CategoryFilter struct {
	Pagination
	Keyword string
}

type DocumentFilter struct {
	Pagination
	Keyword    string
	CategoryID *uuid.UUID
	UploadedBy *uuid.UUID
	IsDeleted  *bool
	MimeType   string
	DateRange
}

type AuditLogFilter struct {
	Pagination
	UserID     *uuid.UUID
	Action     string
	EntityType string
	EntityID   *uuid.UUID
	DateRange
}

type NotificationFilter struct {
	Pagination
	UserID *uuid.UUID
	IsSent *bool
	Type   string
}

type ActiveUserStat struct {
	UserID      uuid.UUID
	FullName    string
	Email       string
	ActionCount int64
}

type DashboardRepository interface {
	CountUsers(ctx context.Context) (int64, error)
	CountDocuments(ctx context.Context) (int64, error)
	CountCategories(ctx context.Context) (int64, error)
	CountDocumentsUploadedToday(ctx context.Context, now time.Time) (int64, error)
	StorageUsageBytes(ctx context.Context) (int64, error)
	MostActiveUsers(ctx context.Context, limit int) ([]ActiveUserStat, error)
}
