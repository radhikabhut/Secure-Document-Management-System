package handler

import (
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	auth      service.AuthService
	validator *validator.Validator
}

func NewAuthHandler(auth service.AuthService, validator *validator.Validator) *AuthHandler {
	return &AuthHandler{auth: auth, validator: validator}
}

func (h *AuthHandler) Register(c *gin.Context) {
	request, ok := bindJSON[dto.RegisterRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.auth.Register(c.Request.Context(), request, requestInfo(c))
	if err != nil {
		handleError(c, err)
		return
	}
	response.Created(c, "Registration successful", result)
}

func (h *AuthHandler) Login(c *gin.Context) {
	request, ok := bindJSON[dto.LoginRequest](c, h.validator)
	if !ok {
		return
	}
	result, err := h.auth.Login(c.Request.Context(), request, requestInfo(c))
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Login successful", result)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	if err := h.auth.Logout(c.Request.Context(), user, requestInfo(c)); err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Logout successful", nil)
}

func (h *AuthHandler) Me(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		return
	}
	result, err := h.auth.Me(c.Request.Context(), user.ID)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Current user retrieved", result)
}

func requestInfo(c *gin.Context) service.RequestInfo {
	return service.RequestInfo{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	request, ok := bindJSON[dto.ForgotPasswordRequest](c, h.validator)
	if !ok {
		return
	}
	err := h.auth.ForgotPassword(c.Request.Context(), request, requestInfo(c))
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "If your email is registered, you will receive a password reset link.", nil)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	request, ok := bindJSON[dto.ResetPasswordRequest](c, h.validator)
	if !ok {
		return
	}
	err := h.auth.ResetPassword(c.Request.Context(), request, requestInfo(c))
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, "Password reset successful", nil)
}
