package handler

import (
	"errors"
	"net/http"

	"docuvault-be/internal/dto"
	appmiddleware "docuvault-be/internal/http/middleware"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/google/uuid"
)

func bindJSON[T any](c *gin.Context, validator *validator.Validator) (T, bool) {
	var request T
	if err := c.ShouldBindJSON(&request); err != nil {
		response.BadRequest(c, "Invalid request body", err.Error())
		return request, false
	}
	return validate(c, validator, request)
}

func bindQuery[T any](c *gin.Context, validator *validator.Validator) (T, bool) {
	var request T
	if err := c.ShouldBindQuery(&request); err != nil {
		response.BadRequest(c, "Invalid query parameters", err.Error())
		return request, false
	}
	return validate(c, validator, request)
}

func bindForm[T any](c *gin.Context, validator *validator.Validator) (T, bool) {
	var request T
	if err := c.ShouldBindWith(&request, binding.FormMultipart); err != nil {
		response.BadRequest(c, "Invalid form data", err.Error())
		return request, false
	}

	return validate(c, validator, request)
}

func validate[T any](c *gin.Context, validator *validator.Validator, request T) (T, bool) {
	if errorsByField := validator.Struct(request); errorsByField != nil {
		response.BadRequest(c, "Validation failed", errorsByField)
		return request, false
	}
	return request, true
}

func parseIDParam(c *gin.Context, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(name))
	if err != nil {
		response.BadRequest(c, "Invalid "+name, nil)
		return uuid.Nil, false
	}
	return id, true
}

func currentUser(c *gin.Context) (dto.AuthUser, bool) {
	user, ok := appmiddleware.CurrentUser(c)
	if !ok {
		response.Unauthorized(c, "Authentication required")
		return dto.AuthUser{}, false
	}
	return user, true
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrBadRequest):
		response.BadRequest(c, cleanError(err, service.ErrBadRequest), nil)
	case errors.Is(err, service.ErrUnauthorized):
		response.Unauthorized(c, "Invalid credentials")
	case errors.Is(err, service.ErrForbidden):
		response.Forbidden(c, "Insufficient permissions")
	case errors.Is(err, service.ErrNotFound):
		response.NotFound(c, "Resource not found")
	case errors.Is(err, service.ErrConflict):
		response.Error(c, http.StatusConflict, "Resource already exists", nil)
	default:
		response.InternalServerError(c)
	}
}

func cleanError(err, sentinel error) string {
	if err == sentinel {
		return "Bad request"
	}
	return err.Error()
}
