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

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestUserHandler_Create(t *testing.T) {
	mockSvc := mocks.NewUserService(t)
	val, _ := validator.New()
	h := handler.NewUserHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/users", h.Create)

	t.Run("Success", func(t *testing.T) {
		reqBody := dto.CreateUserRequest{
			FullName: "John Doe",
			Email:    "john@example.com",
			Password: "Password123!",
		}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.UserResponse{
			ID:       uuid.New(),
			FullName: "John Doe",
			Email:    "john@example.com",
		}

		mockSvc.On("Create", mock.Anything, reqBody).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/users", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("ValidationError", func(t *testing.T) {
		reqBody := dto.CreateUserRequest{
			FullName: "", // Required
		}
		bodyBytes, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest(http.MethodPost, "/users", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestUserHandler_Get(t *testing.T) {
	mockSvc := mocks.NewUserService(t)
	val, _ := validator.New()
	h := handler.NewUserHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/users/:id", h.Get)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		expectedResp := dto.UserResponse{
			ID:       id,
			FullName: "John Doe",
		}

		mockSvc.On("Get", mock.Anything, id).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/users/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("InvalidID", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/users/invalid-id", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestUserHandler_List(t *testing.T) {
	mockSvc := mocks.NewUserService(t)
	val, _ := validator.New()
	h := handler.NewUserHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/users", h.List)

	t.Run("Success", func(t *testing.T) {
		expectedResp := dto.PaginatedResponse[dto.UserResponse]{
			Items:      []dto.UserResponse{{ID: uuid.New(), FullName: "John Doe"}},
			Page:       1,
			PageSize:   10,
			TotalItems: 1,
			TotalPages: 1,
		}

		mockSvc.On("List", mock.Anything, mock.AnythingOfType("dto.UserListRequest")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/users?page=1&page_size=10", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestUserHandler_Update(t *testing.T) {
	mockSvc := mocks.NewUserService(t)
	val, _ := validator.New()
	h := handler.NewUserHandler(mockSvc, val)

	router := setupTestRouter()
	router.PUT("/users/:id", h.Update)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		newName := "John Smith"
		reqBody := dto.UpdateUserRequest{FullName: &newName}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.UserResponse{ID: id, FullName: "John Smith"}

		mockSvc.On("Update", mock.Anything, id, reqBody).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPut, "/users/"+id.String(), bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestUserHandler_Delete(t *testing.T) {
	mockSvc := mocks.NewUserService(t)
	val, _ := validator.New()
	h := handler.NewUserHandler(mockSvc, val)

	router := setupTestRouter()
	router.DELETE("/users/:id", h.Delete)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/users/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id).Return(service.ErrNotFound).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/users/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
