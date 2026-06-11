package service

import (
	"time"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/repository"
)

func toRepositoryPagination(request dto.PaginationRequest) repository.Pagination {
	normalized := request.Normalize()
	return repository.Pagination{
		Limit:     normalized.PageSize,
		Offset:    normalized.Offset(),
		SortBy:    normalized.SortBy,
		SortOrder: normalized.SortOrder,
	}
}

func ToUserResponse(user models.User) dto.UserResponse {
	resp := dto.UserResponse{
		ID:           user.ID,
		FullName:     user.FullName,
		Username:     user.Username,
		Email:        user.Email,
		RoleID:       user.RoleID,
		Role:         string(user.Role.Name),
		DepartmentID: user.DepartmentID,
		IsActive:     user.IsActive,
		LastLoginAt:  user.LastLoginAt,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}
	if user.Department != nil {
		resp.Department = &user.Department.Name
	}
	return resp
}

func ToDepartmentResponse(department models.Department) dto.DepartmentResponse {
	return dto.DepartmentResponse{
		ID:          department.ID,
		Name:        department.Name,
		Description: department.Description,
		CreatedAt:   department.CreatedAt,
		UpdatedAt:   department.UpdatedAt,
	}
}

func ToCategoryResponse(category models.Category) dto.CategoryResponse {
	return dto.CategoryResponse{
		ID:            category.ID,
		Name:          category.Name,
		Description:   category.Description,
		ParentID:      category.ParentID,
		DocumentCount: category.DocumentCount,
		CreatedBy:     category.CreatedBy,
		CreatedAt:     category.CreatedAt,
		UpdatedAt:     category.UpdatedAt,
	}
}

func ToDocumentResponse(document models.Document) dto.DocumentResponse {
	var deletedAt *time.Time
	if document.DeletedAt.Valid {
		deletedAt = &document.DeletedAt.Time
	}

	response := dto.DocumentResponse{
		ID:               document.ID,
		Title:            document.Title,
		OriginalFilename: document.OriginalFilename,
		MimeType:         document.MimeType,
		FileSize:         document.FileSize,
		ChecksumSHA256:   document.ChecksumSHA256,
		CategoryID:       document.CategoryID,
		UploadedBy:       document.UploadedBy,
		Version:          document.Version,
		CreatedAt:        document.CreatedAt,
		UpdatedAt:        document.UpdatedAt,
		DeletedAt:        deletedAt,
	}

	if document.Category.ID != zeroUUID {
		category := ToCategoryResponse(document.Category)
		response.Category = &category
	}
	if document.Uploader.ID != zeroUUID {
		uploader := ToUserResponse(document.Uploader)
		response.Uploader = &uploader
	}

	return response
}

func ToAuditLogResponse(auditLog models.AuditLog) dto.AuditLogResponse {
	return dto.AuditLogResponse{
		ID:         auditLog.ID,
		UserID:     auditLog.UserID,
		Action:     string(auditLog.Action),
		EntityType: string(auditLog.EntityType),
		EntityID:   auditLog.EntityID,
		IPAddress:  auditLog.IPAddress,
		UserAgent:  auditLog.UserAgent,
		Metadata:   map[string]any(auditLog.Metadata),
		CreatedAt:  auditLog.CreatedAt,
		UpdatedAt:  auditLog.UpdatedAt,
	}
}

func ToPermissionResponse(permission models.Permission) dto.PermissionResponse {
	return dto.PermissionResponse{
		ID:             permission.ID,
		DocumentID:     permission.DocumentID,
		UserID:         permission.UserID,
		RoleID:         permission.RoleID,
		DepartmentID:   permission.DepartmentID,
		PermissionType: string(permission.PermissionType),
		GrantedBy:      permission.GrantedBy,
		CreatedAt:      permission.CreatedAt,
		UpdatedAt:      permission.UpdatedAt,
	}
}

func ToNotificationResponse(notification models.Notification) dto.NotificationResponse {
	return dto.NotificationResponse{
		ID:        notification.ID,
		UserID:    notification.UserID,
		Type:      string(notification.Type),
		Subject:   notification.Subject,
		Message:   notification.Message,
		IsSent:    notification.IsSent,
		SentAt:    notification.SentAt,
		IsRead:    notification.IsRead,
		ReadAt:    notification.ReadAt,
		CreatedAt: notification.CreatedAt,
		UpdatedAt: notification.UpdatedAt,
	}
}

func ToActiveUserStat(stat repository.ActiveUserStat) dto.ActiveUserStat {
	return dto.ActiveUserStat{
		UserID:      stat.UserID,
		FullName:    stat.FullName,
		Email:       stat.Email,
		ActionCount: stat.ActionCount,
	}
}
