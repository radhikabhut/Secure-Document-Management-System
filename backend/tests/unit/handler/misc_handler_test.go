package handler_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"docuvault-be/internal/dto"
	"docuvault-be/internal/http/handler"
	"docuvault-be/internal/pkg/validator"
	mocks "docuvault-be/tests/mocks/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAuditLogHandler_List(t *testing.T) {
	mockSvc := mocks.NewAuditLogService(t)
	val, _ := validator.New()
	h := handler.NewAuditLogHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/audit-logs", h.List)

	t.Run("Success", func(t *testing.T) {
		expectedResp := dto.PaginatedResponse[dto.AuditLogResponse]{
			Items:      []dto.AuditLogResponse{{ID: uuid.New(), Action: "LOGIN"}},
			Page:       1,
			PageSize:   10,
			TotalItems: 1,
			TotalPages: 1,
		}

		mockSvc.On("List", mock.Anything, mock.AnythingOfType("dto.AuditLogListRequest")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/audit-logs", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestNotificationHandler_List(t *testing.T) {
	mockSvc := mocks.NewNotificationService(t)
	val, _ := validator.New()
	h := handler.NewNotificationHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/notifications", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.List(c)
	})

	t.Run("Success", func(t *testing.T) {
		expectedResp := dto.PaginatedResponse[dto.NotificationResponse]{
			Items:      []dto.NotificationResponse{{ID: uuid.New(), Message: "Test notification"}},
			Page:       1,
			PageSize:   10,
			TotalItems: 1,
			TotalPages: 1,
		}

		mockSvc.On("List", mock.Anything, mock.AnythingOfType("uuid.UUID"), mock.AnythingOfType("dto.NotificationListRequest")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/notifications", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestNotificationHandler_MarkSent(t *testing.T) {
	mockSvc := mocks.NewNotificationService(t)
	val, _ := validator.New()
	h := handler.NewNotificationHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/notifications/:id/sent", h.MarkSent)

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		expectedResp := dto.NotificationResponse{ID: id}

		mockSvc.On("MarkSent", mock.Anything, id).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/notifications/"+id.String()+"/sent", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestNotificationHandler_MarkRead(t *testing.T) {
	mockSvc := mocks.NewNotificationService(t)
	val, _ := validator.New()
	h := handler.NewNotificationHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/notifications/:id/read", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.MarkRead(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		expectedResp := dto.NotificationResponse{ID: id}

		mockSvc.On("MarkRead", mock.Anything, id, mock.AnythingOfType("uuid.UUID")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/notifications/"+id.String()+"/read", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDashboardHandler_Stats(t *testing.T) {
	mockSvc := mocks.NewDashboardService(t)
	h := handler.NewDashboardHandler(mockSvc)

	router := setupTestRouter()
	router.GET("/dashboard/stats", h.Stats)

	t.Run("Success", func(t *testing.T) {
		expectedResp := dto.DashboardStatsResponse{
			TotalUsers:             10,
			TotalDocuments:         100,
			TotalCategories:        5,
			DocumentsUploadedToday: 2,
			StorageUsageBytes:      2048,
			GeneratedAt:            time.Now(),
		}

		mockSvc.On("Stats", mock.Anything).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
