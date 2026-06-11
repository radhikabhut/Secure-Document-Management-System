package service

import (
	"context"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/repository"
)

func canAccessDocument(ctx context.Context, permissions repository.PermissionRepository, document models.Document, actor dto.AuthUser, permission models.PermissionType) bool {
	if actor.HasSystemPermission("documents:read_all") || document.UploadedBy == actor.ID {
		return true
	}
	_, err := permissions.FindForUser(ctx, document.ID, actor.ID, permission)
	return err == nil
}

func ensureDocumentAccess(ctx context.Context, permissions repository.PermissionRepository, document models.Document, actor dto.AuthUser, permission models.PermissionType) error {
	if canAccessDocument(ctx, permissions, document, actor, permission) {
		return nil
	}
	return ErrForbidden
}
