package handler

import (
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"

	"github.com/gin-gonic/gin"
)

type DocumentHandler struct {
	documents service.DocumentService
	validator *validator.Validator
}

func NewDocumentHandler(documents service.DocumentService, validator *validator.Validator) *DocumentHandler {
	return &DocumentHandler{documents: documents, validator: validator}
}

func (h *DocumentHandler) Upload(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}

	request, ok := bindForm[dto.UploadDocumentRequest](c, h.validator)
	if !ok {
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "File is required", nil)
		return
	}

	result, err := h.documents.Upload(
		c.Request.Context(),
		request,
		fileHeader,
		user,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Created(c, "Document uploaded", result)
}
func (h *DocumentHandler) List(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	request, ok := bindQuery[dto.DocumentListRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.documents.List(c.Request.Context(), request, user)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Documents retrieved", result)
}

func (h *DocumentHandler) Get(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	result, err := h.documents.Get(c.Request.Context(), id, user)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Document retrieved", result)
}

func (h *DocumentHandler) Update(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	request, ok := bindJSON[dto.UpdateDocumentRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.documents.Update(c.Request.Context(), id, request, user)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Document updated", result)
}

func (h *DocumentHandler) Download(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	result, err := h.documents.Download(c.Request.Context(), id, user)
	if err != nil {
		handleError(c, err)
		return
	}
	c.FileAttachment(result.FilePath, result.Document.OriginalFilename)
}

func (h *DocumentHandler) Delete(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.documents.Delete(c.Request.Context(), id, user); err != nil {
		handleError(c, err)
		return
	}
	response.NoContent(c, "Document deleted")
}

func (h *DocumentHandler) Restore(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.documents.Restore(c.Request.Context(), id, user); err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Document restored", nil)
}

func (h *DocumentHandler) HardDelete(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	id, ok := parseIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.documents.HardDelete(c.Request.Context(), id, user); err != nil {
		handleError(c, err)
		return
	}
	response.NoContent(c, "Document permanently deleted")
}
