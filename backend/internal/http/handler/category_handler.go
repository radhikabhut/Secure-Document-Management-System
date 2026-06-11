package handler

import (
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"
	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	categories service.CategoryService
	validator  *validator.Validator
}

func NewCategoryHandler(categories service.CategoryService, validator *validator.Validator) *CategoryHandler {
	return &CategoryHandler{categories: categories, validator: validator}
}

func (h *CategoryHandler) Create(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	request, ok := bindJSON[dto.CreateCategoryRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.categories.Create(c.Request.Context(), request, user.ID)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Created(c, "Category created", result)
}

func (h *CategoryHandler) List(c *gin.Context) {
	request, ok := bindQuery[dto.CategoryListRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.categories.List(c.Request.Context(), request)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Categories retrieved", result)
}

func (h *CategoryHandler) Get(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	result, err := h.categories.Get(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Category retrieved", result)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	request, ok := bindJSON[dto.UpdateCategoryRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.categories.Update(c.Request.Context(), id, request)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Category updated", result)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.categories.Delete(c.Request.Context(), id); err != nil {
		handleError(c, err)
		return
	}
	response.NoContent(c, "Category deleted")
}
