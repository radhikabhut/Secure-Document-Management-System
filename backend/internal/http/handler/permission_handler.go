package handler

import (
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"
	"github.com/gin-gonic/gin"
)

type PermissionHandler struct {
	permissions service.PermissionService
	validator   *validator.Validator
}

func NewPermissionHandler(permissions service.PermissionService, validator *validator.Validator) *PermissionHandler {
	return &PermissionHandler{permissions: permissions, validator: validator}
}

func (h *PermissionHandler) Grant(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	request, ok := bindJSON[dto.GrantPermissionRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.permissions.Grant(c.Request.Context(), request, user)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Created(c, "Permissions granted", result)
}

func (h *PermissionHandler) ListByDocument(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	documentID, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	result, err := h.permissions.ListByDocument(c.Request.Context(), documentID, user)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Permissions retrieved", result)
}

func (h *PermissionHandler) Revoke(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.permissions.Revoke(c.Request.Context(), id, user); err != nil {
		handleError(c, err)
		return
	}
	response.NoContent(c, "Permission revoked")
}
