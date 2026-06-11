package service

import (
	"context"
	"fmt"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/email"
	"docuvault-be/internal/repository"
	"github.com/google/uuid"
)

type PermissionService interface {
	Grant(ctx context.Context, request dto.GrantPermissionRequest, actor dto.AuthUser) ([]dto.PermissionResponse, error)
	ListByDocument(ctx context.Context, documentID uuid.UUID, actor dto.AuthUser) ([]dto.PermissionResponse, error)
	Revoke(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error
}

type permissionService struct {
	permissions   repository.PermissionRepository
	documents     repository.DocumentRepository
	users         repository.UserRepository
	roles         repository.RoleRepository
	departments   repository.DepartmentRepository
	auditLogs     AuditLogService
	notifications repository.NotificationRepository
	mailer        email.Sender
}

func NewPermissionService(permissions repository.PermissionRepository, documents repository.DocumentRepository, users repository.UserRepository, roles repository.RoleRepository, departments repository.DepartmentRepository, auditLogs AuditLogService, notifications repository.NotificationRepository, mailer email.Sender) PermissionService {
	return &permissionService{
		permissions:   permissions,
		documents:     documents,
		users:         users,
		roles:         roles,
		departments:   departments,
		auditLogs:     auditLogs,
		notifications: notifications,
		mailer:        mailer,
	}
}

func (s *permissionService) Grant(ctx context.Context, request dto.GrantPermissionRequest, actor dto.AuthUser) ([]dto.PermissionResponse, error) {
	document, err := s.documents.FindByID(ctx, request.DocumentID)
	if err != nil {
		return nil, normalizeError(err)
	}
	if !actor.HasSystemPermission("documents:read_all") && document.UploadedBy != actor.ID {
		if err := ensureDocumentAccess(ctx, s.permissions, *document, actor, models.PermissionShare); err != nil {
			return nil, err
		}
	}

	targetUserMap := make(map[uuid.UUID]models.User)

	if request.UserID != nil {
		if *request.UserID == actor.ID {
			return nil, fmt.Errorf("cannot share document with yourself: %w", ErrBadRequest)
		}
		u, err := s.users.FindByID(ctx, *request.UserID)
		if err == nil {
			targetUserMap[u.ID] = *u
		}
	}

	for _, id := range request.UserIDs {
		if id == actor.ID {
			continue // skip self
		}
		u, err := s.users.FindByID(ctx, id)
		if err == nil {
			targetUserMap[u.ID] = *u
		}
	}

	targetRoleMap := make(map[uuid.UUID]models.Role)
	for _, roleNameStr := range request.Roles {
		roleName := models.RoleName(roleNameStr)
		role, err := s.roles.FindByName(ctx, roleName)
		if err == nil {
			targetRoleMap[role.ID] = *role
		}
	}

	targetDeptMap := make(map[uuid.UUID]models.Department)
	for _, deptName := range request.Departments {
		dept, err := s.departments.FindByName(ctx, deptName)
		if err == nil {
			targetDeptMap[dept.ID] = *dept
		}
	}

	if len(targetUserMap) == 0 && len(targetRoleMap) == 0 && len(targetDeptMap) == 0 {
		return nil, fmt.Errorf("no valid users, roles, or departments to share with: %w", ErrBadRequest)
	}

	var responses []dto.PermissionResponse
	for _, targetUser := range targetUserMap {
		uID := targetUser.ID
		permission := &models.Permission{
			DocumentID:     request.DocumentID,
			UserID:         &uID,
			PermissionType: models.PermissionType(request.PermissionType),
			GrantedBy:      actor.ID,
		}
		if err := s.permissions.Create(ctx, permission); err != nil {
			continue // skip if failed to create (e.g. already exists)
		}

		createAndSendNotification(ctx, s.notifications, s.auditLogs, s.mailer, &models.Notification{
			UserID:  targetUser.ID,
			Type:    models.NotificationPermissionGranted,
			Subject: "Document permission granted",
			Message: "You have been granted " + request.PermissionType + " access to " + document.Title + ".",
		}, targetUser.Email)
		_ = s.auditLogs.Record(ctx, AuditEvent{
			UserID:     &actor.ID,
			Action:     models.AuditActionPermissionGrant,
			EntityType: models.EntityPermission,
			EntityID:   &permission.ID,
		})

		responses = append(responses, ToPermissionResponse(*permission))
	}

	for _, targetRole := range targetRoleMap {
		rID := targetRole.ID
		permission := &models.Permission{
			DocumentID:     request.DocumentID,
			RoleID:         &rID,
			PermissionType: models.PermissionType(request.PermissionType),
			GrantedBy:      actor.ID,
		}
		if err := s.permissions.Create(ctx, permission); err != nil {
			continue
		}
		_ = s.auditLogs.Record(ctx, AuditEvent{
			UserID:     &actor.ID,
			Action:     models.AuditActionPermissionGrant,
			EntityType: models.EntityPermission,
			EntityID:   &permission.ID,
		})
		responses = append(responses, ToPermissionResponse(*permission))
	}

	for _, targetDept := range targetDeptMap {
		dID := targetDept.ID
		permission := &models.Permission{
			DocumentID:     request.DocumentID,
			DepartmentID:   &dID,
			PermissionType: models.PermissionType(request.PermissionType),
			GrantedBy:      actor.ID,
		}
		if err := s.permissions.Create(ctx, permission); err != nil {
			continue
		}
		_ = s.auditLogs.Record(ctx, AuditEvent{
			UserID:     &actor.ID,
			Action:     models.AuditActionPermissionGrant,
			EntityType: models.EntityPermission,
			EntityID:   &permission.ID,
		})
		responses = append(responses, ToPermissionResponse(*permission))
	}

	if len(responses) == 0 {
		return nil, fmt.Errorf("failed to grant permissions")
	}

	return responses, nil
}

func (s *permissionService) ListByDocument(ctx context.Context, documentID uuid.UUID, actor dto.AuthUser) ([]dto.PermissionResponse, error) {
	document, err := s.documents.FindByID(ctx, documentID)
	if err != nil {
		return nil, normalizeError(err)
	}
	if !actor.HasSystemPermission("documents:read_all") && document.UploadedBy != actor.ID {
		return nil, ErrForbidden
	}

	permissions, err := s.permissions.ListByDocument(ctx, documentID)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.PermissionResponse, 0, len(permissions))
	for _, permission := range permissions {
		responses = append(responses, ToPermissionResponse(permission))
	}
	return responses, nil
}

func (s *permissionService) Revoke(ctx context.Context, id uuid.UUID, actor dto.AuthUser) error {
	permission, err := s.permissions.FindByID(ctx, id)
	if err != nil {
		return normalizeError(err)
	}
	document, err := s.documents.FindByID(ctx, permission.DocumentID)
	if err != nil {
		return normalizeError(err)
	}
	if !actor.HasSystemPermission("documents:read_all") && document.UploadedBy != actor.ID {
		return ErrForbidden
	}
	if err := s.permissions.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditLogs.Record(ctx, AuditEvent{
		UserID:     &actor.ID,
		Action:     models.AuditActionPermissionRevoke,
		EntityType: models.EntityPermission,
		EntityID:   &permission.ID,
	})
	return nil
}
