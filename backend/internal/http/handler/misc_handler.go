package handler

import (
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"
	"github.com/gin-gonic/gin"
)

type AuditLogHandler struct {
	auditLogs service.AuditLogService
	validator *validator.Validator
}

func NewAuditLogHandler(auditLogs service.AuditLogService, validator *validator.Validator) *AuditLogHandler {
	return &AuditLogHandler{auditLogs: auditLogs, validator: validator}
}

func (h *AuditLogHandler) List(c *gin.Context) {
	request, ok := bindQuery[dto.AuditLogListRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.auditLogs.List(c.Request.Context(), request)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Audit logs retrieved", result)
}

type NotificationHandler struct {
	notifications service.NotificationService
	validator     *validator.Validator
}

func NewNotificationHandler(notifications service.NotificationService, validator *validator.Validator) *NotificationHandler {
	return &NotificationHandler{notifications: notifications, validator: validator}
}

func (h *NotificationHandler) List(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	request, ok := bindQuery[dto.NotificationListRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.notifications.List(c.Request.Context(), user.ID, request)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Notifications retrieved", result)
}

func (h *NotificationHandler) MarkSent(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	result, err := h.notifications.MarkSent(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Notification marked sent", result)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	result, err := h.notifications.MarkRead(c.Request.Context(), id, user.ID)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Notification marked read", result)
}

type DashboardHandler struct {
	dashboard service.DashboardService
}

func NewDashboardHandler(dashboard service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboard: dashboard}
}

func (h *DashboardHandler) Stats(c *gin.Context) {
	result, err := h.dashboard.Stats(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Dashboard stats retrieved", result)
}
