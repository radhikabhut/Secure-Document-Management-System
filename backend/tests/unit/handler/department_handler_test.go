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

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestDepartmentHandler_Create(t *testing.T) {
	mockSvc := mocks.NewDepartmentService(t)
	val, _ := validator.New()
	h := handler.NewDepartmentHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/departments", h.Create)

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.CreateDepartmentRequest{
			Name:        "HR",
			Description: "Human Resources",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.DepartmentResponse{
			ID:          uuid.New(),
			Name:        "HR",
			Description: "Human Resources",
		}

		mockSvc.On("Create", mock.Anything, reqBody).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/departments", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("ValidationError", func(t *testing.T) {
		reqBody := dto.CreateDepartmentRequest{
			Name: "", // Name is required
		}
		bodyBytes, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest(http.MethodPost, "/departments", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestDepartmentHandler_Get(t *testing.T) {
	mockSvc := mocks.NewDepartmentService(t)
	val, _ := validator.New()
	h := handler.NewDepartmentHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/departments/:id", h.Get)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		expectedResp := dto.DepartmentResponse{
			ID:   id,
			Name: "HR",
		}

		mockSvc.On("Get", mock.Anything, id).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/departments/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("InvalidID", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/departments/invalid-id", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestDepartmentHandler_List(t *testing.T) {
	mockSvc := mocks.NewDepartmentService(t)
	val, _ := validator.New()
	h := handler.NewDepartmentHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/departments", h.List)

	t.Run("Success", func(t *testing.T) {
		expectedResp := []dto.DepartmentResponse{
			{ID: uuid.New(), Name: "HR"},
		}

		mockSvc.On("List", mock.Anything).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/departments", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDepartmentHandler_Update(t *testing.T) {
	mockSvc := mocks.NewDepartmentService(t)
	val, _ := validator.New()
	h := handler.NewDepartmentHandler(mockSvc, val)

	router := setupTestRouter()
	router.PUT("/departments/:id", h.Update)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		newName := "IT"
		reqBody := dto.UpdateDepartmentRequest{Name: &newName}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.DepartmentResponse{ID: id, Name: "IT"}

		mockSvc.On("Update", mock.Anything, id, reqBody).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPut, "/departments/"+id.String(), bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDepartmentHandler_Delete(t *testing.T) {
	mockSvc := mocks.NewDepartmentService(t)
	val, _ := validator.New()
	h := handler.NewDepartmentHandler(mockSvc, val)

	router := setupTestRouter()
	router.DELETE("/departments/:id", h.Delete)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/departments/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id).Return(service.ErrNotFound).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/departments/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
