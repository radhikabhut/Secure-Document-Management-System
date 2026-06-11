package service

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/storage"
	"docuvault-be/internal/repository"

	"github.com/google/uuid"
)

type DocumentService interface {
	Upload(ctx context.Context, request dto.UploadDocumentRequest, fileHeader *multipart.FileHeader, actor dto.AuthUser) (dto.DocumentResponse, error)
	Get(ctx context.Context, id uuid.UUID, actor dto.AuthUser) (dto.DocumentResponse, error)
	List(ctx context.Context, request dto.DocumentListRequest, actor dto.AuthUser) (dto.PaginatedResponse[dto.DocumentResponse], error)
	Update(ctx context.Context, id uuid.UUID, request dto.UpdateDocumentRequest, actor dto.AuthUser) (dto.DocumentResponse, error)
	Download(ctx context.Context, id uuid.UUID, actor dto.AuthUser) (dto.DownloadDocumentResponse, error)
	Delete(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error
	Restore(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error
	HardDelete(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error
}

type documentService struct {
	documents   repository.DocumentRepository
	categories  repository.CategoryRepository
	permissions repository.PermissionRepository
	auditLogs   AuditLogService
	storage     *storage.Manager
	now         func() time.Time
}

func NewDocumentService(documents repository.DocumentRepository, categories repository.CategoryRepository, permissions repository.PermissionRepository, auditLogs AuditLogService, storage *storage.Manager) DocumentService {
	return &documentService{
		documents:   documents,
		categories:  categories,
		permissions: permissions,
		auditLogs:   auditLogs,
		storage:     storage,
		now:         time.Now,
	}
}

// ... unchanged parts omitted for brevity, but I will do a precise replace

func (s *documentService) Delete(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error {
	document, err := s.documents.FindByID(ctx, id)
	if err != nil {
		return normalizeError(err)
	}
	if err := ensureDocumentAccess(ctx, s.permissions, *document, actor, models.PermissionDelete); err != nil {
		return err
	}
	if err := s.documents.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &actor.ID,
		Action:     models.AuditActionDocumentDelete,
		EntityType: models.EntityDocument,
		EntityID:   &document.ID,
	})
	return nil
}

func (s *documentService) Restore(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error {
	document, err := s.documents.FindByID(ctx, id)
	if err != nil {
		return normalizeError(err)
	}
	if err := ensureDocumentAccess(ctx, s.permissions, *document, actor, models.PermissionDelete); err != nil {
		return err
	}
	if err := s.documents.Restore(ctx, id); err != nil {
		return err
	}
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &actor.ID,
		Action:     models.AuditActionDocumentRestore,
		EntityType: models.EntityDocument,
		EntityID:   &document.ID,
	})
	return nil
}

func (s *documentService) HardDelete(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error {
	document, err := s.documents.FindByID(ctx, id)
	if err != nil {
		return normalizeError(err)
	}
	if err := ensureDocumentAccess(ctx, s.permissions, *document, actor, models.PermissionDelete); err != nil {
		return err
	}
	if err := s.documents.HardDelete(ctx, id); err != nil {
		return err
	}
	_ = os.Remove(document.FilePath)
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &actor.ID,
		Action:     models.AuditActionDocumentDelete, // Permanent delete
		EntityType: models.EntityDocument,
		EntityID:   &document.ID,
	})
	return nil
}

func (s *documentService) Upload(ctx context.Context, request dto.UploadDocumentRequest, fileHeader *multipart.FileHeader, actor dto.AuthUser) (dto.DocumentResponse, error) {
	if actor.Role == string(models.RoleViewer) {
		return dto.DocumentResponse{}, ErrForbidden
	}

	// Convert category_id string to UUID
	categoryID, err := uuid.Parse(request.CategoryID)
	if err != nil {
		return dto.DocumentResponse{}, fmt.Errorf("%w: invalid category_id", ErrBadRequest)
	}

	// Verify category exists
	if _, err := s.categories.FindByID(ctx, categoryID); err != nil {
		return dto.DocumentResponse{}, normalizeError(err)
	}

	// Validate uploaded file
	if err := s.storage.ValidateHeader(fileHeader); err != nil {
		return dto.DocumentResponse{}, fmt.Errorf("%w: %s", ErrBadRequest, err.Error())
	}

	// Build storage path and save file
	storedPath, storedName := s.storage.BuildStoragePath(s.now(), fileHeader.Filename)
	checksum, err := saveUploadedFile(fileHeader, storedPath)
	if err != nil {
		return dto.DocumentResponse{}, err
	}

	// Create document model
	document := &models.Document{
		Title:            strings.TrimSpace(request.Title),
		OriginalFilename: storage.SanitizeFilename(fileHeader.Filename),
		StoredFilename:   storedName,
		MimeType:         contentType(fileHeader),
		FileSize:         fileHeader.Size,
		FilePath:         storedPath,
		ChecksumSHA256:   checksum,
		CategoryID:       categoryID,
		UploadedBy:       actor.ID,
		Version:          1,
	}

	// Save document in database
	if err := s.documents.Create(ctx, document); err != nil {
		_ = os.Remove(storedPath)
		return dto.DocumentResponse{}, err
	}

	// Record audit log
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &actor.ID,
		Action:     models.AuditActionDocumentUpload,
		EntityType: models.EntityDocument,
		EntityID:   &document.ID,
	})

	// Reload with relations
	created, err := s.documents.FindByID(ctx, document.ID)
	if err != nil {
		return ToDocumentResponse(*document), nil
	}

	return ToDocumentResponse(*created), nil
}

func (s *documentService) Get(ctx context.Context, id uuid.UUID, actor dto.AuthUser) (dto.DocumentResponse, error) {
	document, err := s.documents.FindByID(ctx, id)
	if err != nil {
		return dto.DocumentResponse{}, normalizeError(err)
	}
	if err := ensureDocumentAccess(ctx, s.permissions, *document, actor, models.PermissionView); err != nil {
		return dto.DocumentResponse{}, err
	}
	return ToDocumentResponse(*document), nil
}

func (s *documentService) List(ctx context.Context, request dto.DocumentListRequest, actor dto.AuthUser) (dto.PaginatedResponse[dto.DocumentResponse], error) {
	filter := repository.DocumentFilter{
		Pagination: toRepositoryPagination(request.PaginationRequest),
		Keyword:    request.Keyword,
		CategoryID: request.CategoryID,
		UploadedBy: request.UploadedBy,
		IsDeleted:  request.IsDeleted,
		MimeType:   request.MimeType,
		DateRange: repository.DateRange{
			From: request.From,
			To:   request.To,
		},
	}
	if !actor.HasSystemPermission("documents:read_all") {
		filter.UploadedBy = &actor.ID
	}

	documents, total, err := s.documents.List(ctx, filter)
	if err != nil {
		return dto.PaginatedResponse[dto.DocumentResponse]{}, err
	}

	responses := make([]dto.DocumentResponse, 0, len(documents))
	for _, document := range documents {
		responses = append(responses, ToDocumentResponse(document))
	}
	return dto.NewPaginatedResponse(responses, request.PaginationRequest, total), nil
}

func (s *documentService) Update(ctx context.Context, id uuid.UUID, request dto.UpdateDocumentRequest, actor dto.AuthUser) (dto.DocumentResponse, error) {
	document, err := s.documents.FindByID(ctx, id)
	if err != nil {
		return dto.DocumentResponse{}, normalizeError(err)
	}
	if err := ensureDocumentAccess(ctx, s.permissions, *document, actor, models.PermissionEdit); err != nil {
		return dto.DocumentResponse{}, err
	}

	if request.Title != nil {
		document.Title = strings.TrimSpace(*request.Title)
	}
	if request.CategoryID != nil {
		if _, err := s.categories.FindByID(ctx, *request.CategoryID); err != nil {
			return dto.DocumentResponse{}, normalizeError(err)
		}
		document.CategoryID = *request.CategoryID
	}
	if err := s.documents.Update(ctx, document); err != nil {
		return dto.DocumentResponse{}, err
	}

	updated, err := s.documents.FindByID(ctx, id)
	if err != nil {
		return ToDocumentResponse(*document), nil
	}
	return ToDocumentResponse(*updated), nil
}

func (s *documentService) Download(ctx context.Context, id uuid.UUID, actor dto.AuthUser) (dto.DownloadDocumentResponse, error) {
	document, err := s.documents.FindByID(ctx, id)
	if err != nil {
		return dto.DownloadDocumentResponse{}, normalizeError(err)
	}
	if err := ensureDocumentAccess(ctx, s.permissions, *document, actor, models.PermissionDownload); err != nil {
		return dto.DownloadDocumentResponse{}, err
	}
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &actor.ID,
		Action:     models.AuditActionDocumentDownload,
		EntityType: models.EntityDocument,
		EntityID:   &document.ID,
	})
	return dto.DownloadDocumentResponse{Document: ToDocumentResponse(*document), FilePath: document.FilePath}, nil
}



func saveUploadedFile(fileHeader *multipart.FileHeader, destination string) (string, error) {
	source, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("open uploaded file: %w", err)
	}
	defer source.Close()

	if err := os.MkdirAll(filepath.Dir(destination), 0750); err != nil {
		return "", fmt.Errorf("create upload directory: %w", err)
	}

	target, err := os.OpenFile(destination, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0640)
	if err != nil {
		return "", fmt.Errorf("create stored file: %w", err)
	}
	defer target.Close()

	reader, writer := io.Pipe()
	var checksum string
	var checksumErr error
	done := make(chan struct{})
	go func() {
		defer close(done)
		checksum, checksumErr = storage.SHA256(reader)
	}()

	_, copyErr := io.Copy(target, io.TeeReader(source, writer))
	closeErr := writer.Close()
	<-done

	if copyErr != nil {
		return "", fmt.Errorf("store uploaded file: %w", copyErr)
	}
	if closeErr != nil {
		return "", fmt.Errorf("close checksum writer: %w", closeErr)
	}
	if checksumErr != nil {
		return "", fmt.Errorf("checksum uploaded file: %w", checksumErr)
	}
	return checksum, nil
}

func contentType(fileHeader *multipart.FileHeader) string {
	value := strings.TrimSpace(fileHeader.Header.Get("Content-Type"))
	if value == "" {
		return "application/octet-stream"
	}
	return value
}
