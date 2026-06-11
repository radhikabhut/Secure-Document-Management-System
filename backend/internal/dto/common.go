package dto

import (
	"time"

	"github.com/google/uuid"
)

type PaginationRequest struct {
	Page      int    `form:"page" json:"page" validate:"omitempty,min=1"`
	PageSize  int    `form:"page_size" json:"page_size" validate:"omitempty,min=1,max=100"`
	SortBy    string `form:"sort_by" json:"sort_by" validate:"omitempty,max=60"`
	SortOrder string `form:"sort_order" json:"sort_order" validate:"omitempty,oneof=asc desc"`
}

func (r PaginationRequest) Normalize() PaginationRequest {
	if r.Page <= 0 {
		r.Page = 1
	}
	if r.PageSize <= 0 {
		r.PageSize = 20
	}
	if r.PageSize > 100 {
		r.PageSize = 100
	}
	if r.SortOrder == "" {
		r.SortOrder = "desc"
	}
	return r
}

func (r PaginationRequest) Offset() int {
	normalized := r.Normalize()
	return (normalized.Page - 1) * normalized.PageSize
}

type PaginatedResponse[T any] struct {
	Items      []T   `json:"items"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalItems int64 `json:"total_items"`
	TotalPages int   `json:"total_pages"`
}

func NewPaginatedResponse[T any](items []T, pagination PaginationRequest, totalItems int64) PaginatedResponse[T] {
	normalized := pagination.Normalize()
	totalPages := 0
	if totalItems > 0 {
		totalPages = int((totalItems + int64(normalized.PageSize) - 1) / int64(normalized.PageSize))
	}

	return PaginatedResponse[T]{
		Items:      items,
		Page:       normalized.Page,
		PageSize:   normalized.PageSize,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}
}

type DateRangeFilter struct {
	From *time.Time `form:"from" json:"from"`
	To   *time.Time `form:"to" json:"to"`
}

type IDResponse struct {
	ID uuid.UUID `json:"id"`
}
