package handler

import (
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"
	"github.com/gin-gonic/gin"
)

type DepartmentHandler struct {
	departments service.DepartmentService
	validator   *validator.Validator
}

func NewDepartmentHandler(departments service.DepartmentService, validator *validator.Validator) *DepartmentHandler {
	return &DepartmentHandler{departments: departments, validator: validator}
}

func (h *DepartmentHandler) Create(c *gin.Context) {
	request, ok := bindJSON[dto.CreateDepartmentRequest](c, h.validator)
	if !ok {
		return
	}

	department, err := h.departments.Create(c.Request.Context(), request)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Created(c, "Department created successfully", department)
}

func (h *DepartmentHandler) Get(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}

	department, err := h.departments.Get(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.OK(c, "Department retrieved successfully", department)
}

func (h *DepartmentHandler) List(c *gin.Context) {
	departments, err := h.departments.List(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}

	response.OK(c, "Departments retrieved successfully", departments)
}

func (h *DepartmentHandler) Update(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}

	request, ok := bindJSON[dto.UpdateDepartmentRequest](c, h.validator)
	if !ok {
		return
	}

	department, err := h.departments.Update(c.Request.Context(), id, request)
	if err != nil {
		handleError(c, err)
		return
	}

	response.OK(c, "Department updated successfully", department)
}

func (h *DepartmentHandler) Delete(c *gin.Context) {
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}

	if err := h.departments.Delete(c.Request.Context(), id); err != nil {
		handleError(c, err)
		return
	}

	response.NoContent(c, "Department deleted successfully")
}
