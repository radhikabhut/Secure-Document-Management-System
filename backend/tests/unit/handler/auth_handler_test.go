package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"docuvault-be/internal/dto"
	"docuvault-be/internal/http/handler"
	"docuvault-be/internal/pkg/validator"
	mocks "docuvault-be/tests/mocks/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAuthHandler_Register(t *testing.T) {
	mockSvc := mocks.NewAuthService(t)
	val, _ := validator.New()
	h := handler.NewAuthHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/auth/register", h.Register)

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.RegisterRequest{
			FullName: "John Doe",
			Email:    "john@example.com",
			Password: "Password123!",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.LoginResponse{
			User: dto.UserResponse{
				ID:       uuid.New(),
				FullName: "John Doe",
				Email:    "john@example.com",
			},
		}

		mockSvc.On("Register", mock.Anything, reqBody, mock.AnythingOfType("service.RequestInfo")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/auth/register", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("ValidationError", func(t *testing.T) {
		reqBody := dto.RegisterRequest{
			FullName: "", // Required
		}
		bodyBytes, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest(http.MethodPost, "/auth/register", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestAuthHandler_Login(t *testing.T) {
	mockSvc := mocks.NewAuthService(t)
	val, _ := validator.New()
	h := handler.NewAuthHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/auth/login", h.Login)

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.LoginRequest{
			Email:    "john@example.com",
			Password: "Password123!",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.LoginResponse{
			AccessToken: "some-jwt-token",
			TokenType:   "Bearer",
		}

		mockSvc.On("Login", mock.Anything, reqBody, mock.AnythingOfType("service.RequestInfo")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/auth/login", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestAuthHandler_Logout(t *testing.T) {
	mockSvc := mocks.NewAuthService(t)
	val, _ := validator.New()
	h := handler.NewAuthHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/auth/logout", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Logout(c)
	})

	t.Run("Success", func(t *testing.T) {
		mockSvc.On("Logout", mock.Anything, mock.AnythingOfType("dto.AuthUser"), mock.AnythingOfType("service.RequestInfo")).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/auth/logout", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestAuthHandler_Me(t *testing.T) {
	mockSvc := mocks.NewAuthService(t)
	val, _ := validator.New()
	h := handler.NewAuthHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/auth/me", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Me(c)
	})

	t.Run("Success", func(t *testing.T) {
		expectedResp := dto.MeResponse{
			User: dto.UserResponse{FullName: "John Doe"},
		}
		mockSvc.On("Me", mock.Anything, mock.AnythingOfType("uuid.UUID")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/auth/me", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestAuthHandler_ForgotPassword(t *testing.T) {
	mockSvc := mocks.NewAuthService(t)
	val, _ := validator.New()
	h := handler.NewAuthHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/auth/forgot-password", h.ForgotPassword)

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.ForgotPasswordRequest{
			Email: "john@example.com",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		mockSvc.On("ForgotPassword", mock.Anything, reqBody, mock.AnythingOfType("service.RequestInfo")).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/auth/forgot-password", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestAuthHandler_ResetPassword(t *testing.T) {
	mockSvc := mocks.NewAuthService(t)
	val, _ := validator.New()
	h := handler.NewAuthHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/auth/reset-password", h.ResetPassword)

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.ResetPasswordRequest{
			Token:       "some-reset-token",
			NewPassword: "Password123!",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		mockSvc.On("ResetPassword", mock.Anything, reqBody, mock.AnythingOfType("service.RequestInfo")).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/auth/reset-password", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
