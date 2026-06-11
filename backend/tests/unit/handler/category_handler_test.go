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

func TestCategoryHandler_Create(t *testing.T) {
	mockSvc := mocks.NewCategoryService(t)
	val, _ := validator.New()
	h := handler.NewCategoryHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/categories", func(c *gin.Context) {
		// Mock Auth Middleware
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Create(c)
	})

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.CreateCategoryRequest{
			Name:        "Finance",
			Description: "Financial documents",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.CategoryResponse{
			ID:          uuid.New(),
			Name:        "Finance",
			Description: "Financial documents",
		}

		mockSvc.On("Create", mock.Anything, reqBody, mock.AnythingOfType("uuid.UUID")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/categories", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("ValidationError", func(t *testing.T) {
		reqBody := dto.CreateCategoryRequest{
			Name: "", // Name is required
		}
		bodyBytes, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest(http.MethodPost, "/categories", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestCategoryHandler_Get(t *testing.T) {
	mockSvc := mocks.NewCategoryService(t)
	val, _ := validator.New()
	h := handler.NewCategoryHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/categories/:id", h.Get)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		expectedResp := dto.CategoryResponse{
			ID:   id,
			Name: "Finance",
		}

		mockSvc.On("Get", mock.Anything, id).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/categories/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("InvalidID", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/categories/invalid-id", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestCategoryHandler_List(t *testing.T) {
	mockSvc := mocks.NewCategoryService(t)
	val, _ := validator.New()
	h := handler.NewCategoryHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/categories", h.List)

	t.Run("Success", func(t *testing.T) {
		expectedResp := dto.PaginatedResponse[dto.CategoryResponse]{
			Items:      []dto.CategoryResponse{{ID: uuid.New(), Name: "Finance"}},
			Page:       1,
			PageSize:   10,
			TotalItems: 1,
			TotalPages: 1,
		}

		// Because Query parameter binding might set default PaginationRequest values if none provided,
		// we match Anything and check returning proper structure.
		mockSvc.On("List", mock.Anything, mock.AnythingOfType("dto.CategoryListRequest")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/categories?page=1&limit=10", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestCategoryHandler_Update(t *testing.T) {
	mockSvc := mocks.NewCategoryService(t)
	val, _ := validator.New()
	h := handler.NewCategoryHandler(mockSvc, val)

	router := setupTestRouter()
	router.PUT("/categories/:id", h.Update)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		newName := "Finance Update"
		reqBody := dto.UpdateCategoryRequest{Name: &newName}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.CategoryResponse{ID: id, Name: "Finance Update"}

		mockSvc.On("Update", mock.Anything, id, reqBody).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPut, "/categories/"+id.String(), bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestCategoryHandler_Delete(t *testing.T) {
	mockSvc := mocks.NewCategoryService(t)
	val, _ := validator.New()
	h := handler.NewCategoryHandler(mockSvc, val)

	router := setupTestRouter()
	router.DELETE("/categories/:id", h.Delete)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/categories/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id).Return(service.ErrNotFound).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/categories/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
