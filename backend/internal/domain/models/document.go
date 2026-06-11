package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Document struct {
	BaseModel
	Title            string       `gorm:"type:varchar(200);not null;index" json:"title"`
	OriginalFilename string       `gorm:"type:varchar(255);not null" json:"original_filename"`
	StoredFilename   string       `gorm:"type:varchar(255);not null;uniqueIndex" json:"stored_filename"`
	MimeType         string       `gorm:"type:varchar(120);not null" json:"mime_type"`
	FileSize         int64        `gorm:"not null" json:"file_size"`
	FilePath         string       `gorm:"type:text;not null" json:"file_path"`
	ChecksumSHA256   string       `gorm:"type:char(64);not null;index" json:"checksum_sha256"`
	CategoryID       uuid.UUID    `gorm:"type:uuid;not null;index" json:"category_id"`
	Category         Category     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"category,omitempty"`
	UploadedBy       uuid.UUID    `gorm:"type:uuid;not null;index" json:"uploaded_by"`
	Uploader         User         `gorm:"foreignKey:UploadedBy;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"uploader,omitempty"`
	Version          int          `gorm:"not null;default:1" json:"version"`
	Permissions      []Permission `gorm:"foreignKey:DocumentID" json:"-"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (Document) TableName() string {
	return "documents"
}
