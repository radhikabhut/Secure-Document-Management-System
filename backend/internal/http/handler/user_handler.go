package handler

import (
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	users     service.UserService
	validator *validator.Validator
}

func NewUserHandler(users service.UserService, validator *validator.Validator) *UserHandler {
	return &UserHandler{users: users, validator: validator}
}

func (h *UserHandler) List(c *gin.Context) {
	request, ok := bindQuery[dto.UserListRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.users.List(c.Request.Context(), request)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Users retrieved", result)
}

func (h *UserHandler) Get(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	result, err := h.users.Get(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "User retrieved", result)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	request, ok := bindJSON[dto.UpdateUserRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.users.Update(c.Request.Context(), id, request)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "User updated", result)
}

func (h *UserHandler) Create(c *gin.Context) {
	request, ok := bindJSON[dto.CreateUserRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.users.Create(c.Request.Context(), request)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Created(c, "User created", result)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.users.Delete(c.Request.Context(), id); err != nil {
		handleError(c, err)
		return
	}
	response.NoContent(c, "User deleted")
}
