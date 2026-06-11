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
	"docuvault-be/internal/service"
	mocks "docuvault-be/tests/mocks/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestPermissionHandler_Grant(t *testing.T) {
	mockSvc := mocks.NewPermissionService(t)
	val, _ := validator.New()
	h := handler.NewPermissionHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/permissions/grant", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Grant(c)
	})

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.GrantPermissionRequest{
			DocumentID:     uuid.New(),
			UserIDs:        []uuid.UUID{uuid.New()},
			PermissionType: "VIEW",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := []dto.PermissionResponse{
			{ID: uuid.New(), DocumentID: reqBody.DocumentID, PermissionType: "VIEW"},
		}

		mockSvc.On("Grant", mock.Anything, reqBody, mock.AnythingOfType("dto.AuthUser")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/permissions/grant", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("ValidationError", func(t *testing.T) {
		reqBody := dto.GrantPermissionRequest{
			DocumentID: uuid.Nil, // Required but missing
		}
		bodyBytes, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest(http.MethodPost, "/permissions/grant", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestPermissionHandler_ListByDocument(t *testing.T) {
	mockSvc := mocks.NewPermissionService(t)
	val, _ := validator.New()
	h := handler.NewPermissionHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/documents/:id/permissions", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.ListByDocument(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		expectedResp := []dto.PermissionResponse{
			{ID: uuid.New(), DocumentID: id, PermissionType: "VIEW"},
		}

		mockSvc.On("ListByDocument", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/documents/"+id.String()+"/permissions", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestPermissionHandler_Revoke(t *testing.T) {
	mockSvc := mocks.NewPermissionService(t)
	val, _ := validator.New()
	h := handler.NewPermissionHandler(mockSvc, val)

	router := setupTestRouter()
	router.DELETE("/permissions/:id", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Revoke(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Revoke", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/permissions/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Revoke", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(service.ErrNotFound).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/permissions/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
