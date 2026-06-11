package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Body struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
	Errors  any    `json:"errors,omitempty"`
}

func OK(c *gin.Context, message string, data any) {
	c.JSON(http.StatusOK, Body{Success: true, Message: message, Data: data})
}

func Created(c *gin.Context, message string, data any) {
	c.JSON(http.StatusCreated, Body{Success: true, Message: message, Data: data})
}

func NoContent(c *gin.Context, message string) {
	c.JSON(http.StatusOK, Body{Success: true, Message: message})
}

func Error(c *gin.Context, status int, message string, errors any) {
	c.AbortWithStatusJSON(status, Body{Success: false, Message: message, Errors: errors})
}

func BadRequest(c *gin.Context, message string, errors any) {
	Error(c, http.StatusBadRequest, message, errors)
}

func Unauthorized(c *gin.Context, message string) {
	Error(c, http.StatusUnauthorized, message, nil)
}

func Forbidden(c *gin.Context, message string) {
	Error(c, http.StatusForbidden, message, nil)
}

func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, message, nil)
}

func InternalServerError(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "Internal server error", nil)
}
