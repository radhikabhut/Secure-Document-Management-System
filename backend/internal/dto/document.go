package dto

import (
	"time"

	"github.com/google/uuid"
)

type UploadDocumentRequest struct {
	Title      string `form:"title" binding:"required,min=2,max=200"`
	CategoryID string `form:"category_id" binding:"required,uuid"`
}

type UpdateDocumentRequest struct {
	Title      *string    `json:"title" validate:"omitempty,min=2,max=200"`
	CategoryID *uuid.UUID `json:"category_id" validate:"omitempty"`
}

type DocumentListRequest struct {
	PaginationRequest
	Keyword    string     `form:"keyword" json:"keyword" validate:"omitempty,max=120"`
	CategoryID *uuid.UUID `form:"category_id" json:"category_id"`
	UploadedBy *uuid.UUID `form:"uploaded_by" json:"uploaded_by"`
	IsDeleted  *bool      `form:"is_deleted" json:"is_deleted"`
	MimeType   string     `form:"mime_type" json:"mime_type" validate:"omitempty,max=120"`
	DateRangeFilter
}

type DocumentResponse struct {
	ID               uuid.UUID         `json:"id"`
	Title            string            `json:"title"`
	OriginalFilename string            `json:"original_filename"`
	MimeType         string            `json:"mime_type"`
	FileSize         int64             `json:"file_size"`
	ChecksumSHA256   string            `json:"checksum_sha256"`
	CategoryID       uuid.UUID         `json:"category_id"`
	Category         *CategoryResponse `json:"category,omitempty"`
	UploadedBy       uuid.UUID         `json:"uploaded_by"`
	Uploader         *UserResponse     `json:"uploader,omitempty"`
	Version          int               `json:"version"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`
	DeletedAt        *time.Time        `json:"deleted_at,omitempty"`
}

type DownloadDocumentResponse struct {
	Document DocumentResponse `json:"document"`
	FilePath string           `json:"file_path"`
}
