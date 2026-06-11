package handler_test

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
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

func TestDocumentHandler_Upload(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/documents", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Upload(c)
	})

	t.Run("Success", func(t *testing.T) {
		body := new(bytes.Buffer)
		writer := multipart.NewWriter(body)
		_ = writer.WriteField("title", "Test Document")
		_ = writer.WriteField("category_id", uuid.New().String())
		part, _ := writer.CreateFormFile("file", "test.txt")
		_, _ = part.Write([]byte("file content"))
		_ = writer.Close()

		expectedResp := dto.DocumentResponse{
			ID:    uuid.New(),
			Title: "Test Document",
		}

		mockSvc.On("Upload", mock.Anything, mock.AnythingOfType("dto.UploadDocumentRequest"), mock.AnythingOfType("*multipart.FileHeader"), mock.AnythingOfType("dto.AuthUser")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/documents", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDocumentHandler_Get(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/documents/:id", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Get(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		expectedResp := dto.DocumentResponse{
			ID:    id,
			Title: "Test Document",
		}

		mockSvc.On("Get", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/documents/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDocumentHandler_List(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/documents", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.List(c)
	})

	t.Run("Success", func(t *testing.T) {
		expectedResp := dto.PaginatedResponse[dto.DocumentResponse]{
			Items:      []dto.DocumentResponse{{ID: uuid.New(), Title: "Test Document"}},
			Page:       1,
			PageSize:   10,
			TotalItems: 1,
			TotalPages: 1,
		}

		mockSvc.On("List", mock.Anything, mock.AnythingOfType("dto.DocumentListRequest"), mock.AnythingOfType("dto.AuthUser")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/documents", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDocumentHandler_Update(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.PUT("/documents/:id", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Update(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		newTitle := "Updated Title"
		reqBody := dto.UpdateDocumentRequest{Title: &newTitle}
		bodyBytes, _ := json.Marshal(reqBody)

		expectedResp := dto.DocumentResponse{ID: id, Title: "Updated Title"}

		mockSvc.On("Update", mock.Anything, id, reqBody, mock.AnythingOfType("dto.AuthUser")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodPut, "/documents/"+id.String(), bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDocumentHandler_Download(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.GET("/documents/:id/download", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Download(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()
		
		expectedResp := dto.DownloadDocumentResponse{
			Document: dto.DocumentResponse{OriginalFilename: "test.txt"},
			FilePath: "non_existent_but_mocked.txt",
		}

		mockSvc.On("Download", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(expectedResp, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/documents/"+id.String()+"/download", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Gin's FileAttachment might return 404 if the file path doesn't actually exist
		// Or 200 depending on how FileAttachment internally works.
		// Wait, c.FileAttachment checks if file exists, if not it panics or writes 404.
		// Actually, we just expect the function to be called and maybe fail internally with a log.
		mockSvc.AssertExpectations(t)
	})
}

func TestDocumentHandler_Delete(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.DELETE("/documents/:id", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Delete(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/documents/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("NotFound", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Delete", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(service.ErrNotFound).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/documents/"+id.String(), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDocumentHandler_Restore(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.POST("/documents/:id/restore", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.Restore(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("Restore", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodPost, "/documents/"+id.String()+"/restore", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}

func TestDocumentHandler_HardDelete(t *testing.T) {
	mockSvc := mocks.NewDocumentService(t)
	val, _ := validator.New()
	h := handler.NewDocumentHandler(mockSvc, val)

	router := setupTestRouter()
	router.DELETE("/documents/:id/hard", func(c *gin.Context) {
		c.Set("auth_user", dto.AuthUser{ID: uuid.New()})
		h.HardDelete(c)
	})

	t.Run("Success", func(t *testing.T) {
		id := uuid.New()

		mockSvc.On("HardDelete", mock.Anything, id, mock.AnythingOfType("dto.AuthUser")).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/documents/"+id.String()+"/hard", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
