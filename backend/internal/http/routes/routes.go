package routes

import (
	"strings"
	"time"

	_ "docuvault-be/docs"
	"docuvault-be/internal/http/handler"
	"docuvault-be/internal/http/middleware"
	"docuvault-be/internal/pkg/auth"
	"docuvault-be/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
)

type Handlers struct {
	Auth          *handler.AuthHandler
	Users         *handler.UserHandler
	Departments   *handler.DepartmentHandler
	Categories    *handler.CategoryHandler
	Documents     *handler.DocumentHandler
	Permissions   *handler.PermissionHandler
	AuditLogs     *handler.AuditLogHandler
	Notifications *handler.NotificationHandler
	Dashboard     *handler.DashboardHandler
}

type Dependencies struct {
	Log       *zap.Logger
	JWT       *auth.JWTManager
	Users     repository.UserRepository
	Handlers  Handlers
	MaxBodyMB int64
}

func NewRouter(deps Dependencies) *gin.Engine {
	router := gin.New()

	// CORS configuration for React frontend running on Vite
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return strings.HasPrefix(origin, "http://localhost:")
		},
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
		},
		ExposeHeaders: []string{
			"Content-Length",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.Use(middleware.Recovery(deps.Log))
	router.Use(middleware.RequestLogger(deps.Log))

	if deps.MaxBodyMB > 0 {
		router.MaxMultipartMemory = deps.MaxBodyMB << 20
	}

	router.GET("/health", middleware.Health())
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := router.Group("/api/v1")
	authLimiter := middleware.RateLimiter(5, 10) // 5 requests per second, burst of 10
	api.POST("/auth/register", authLimiter, deps.Handlers.Auth.Register)
	api.POST("/auth/login", authLimiter, deps.Handlers.Auth.Login)
	api.POST("/auth/forgot-password", authLimiter, deps.Handlers.Auth.ForgotPassword)
	api.POST("/auth/reset-password", authLimiter, deps.Handlers.Auth.ResetPassword)

	protected := api.Group("")
	protected.Use(middleware.Auth(deps.JWT, deps.Users))
	protected.GET("/auth/me", deps.Handlers.Auth.Me)
	protected.POST("/auth/logout", deps.Handlers.Auth.Logout)

	protected.GET("/categories", deps.Handlers.Categories.List)
	protected.GET("/categories/:id", deps.Handlers.Categories.Get)
	protected.POST("/categories", middleware.RequirePermissions("categories:manage"), deps.Handlers.Categories.Create)
	protected.PUT("/categories/:id", middleware.RequirePermissions("categories:manage"), deps.Handlers.Categories.Update)
	protected.DELETE("/categories/:id", middleware.RequirePermissions("categories:manage"), deps.Handlers.Categories.Delete)

	protected.GET("/documents", deps.Handlers.Documents.List)
	protected.POST("/documents", middleware.RequirePermissions("documents:create"), deps.Handlers.Documents.Upload)
	protected.POST("/documents/upload", middleware.RequirePermissions("documents:create"), deps.Handlers.Documents.Upload)
	protected.GET("/documents/:id", deps.Handlers.Documents.Get)
	protected.PUT("/documents/:id", middleware.RequirePermissions("documents:create"), deps.Handlers.Documents.Update)
	protected.GET("/documents/:id/download", deps.Handlers.Documents.Download)
	protected.DELETE("/documents/:id", middleware.RequirePermissions("documents:create"), deps.Handlers.Documents.Delete)
	protected.POST("/documents/:id/restore", middleware.RequirePermissions("documents:create"), deps.Handlers.Documents.Restore)
	protected.DELETE("/documents/:id/hard", middleware.RequirePermissions("documents:delete_any"), deps.Handlers.Documents.HardDelete)

	protected.POST("/permissions", middleware.RequirePermissions("documents:create"), deps.Handlers.Permissions.Grant)
	protected.POST("/permissions/grant", middleware.RequirePermissions("documents:create"), deps.Handlers.Permissions.Grant)
	protected.GET("/documents/:id/permissions", middleware.RequirePermissions("documents:create"), deps.Handlers.Permissions.ListByDocument)
	protected.DELETE("/permissions/:id", middleware.RequirePermissions("documents:create"), deps.Handlers.Permissions.Revoke)

	protected.GET("/notifications", deps.Handlers.Notifications.List)
	protected.PATCH("/notifications/:id/read", deps.Handlers.Notifications.MarkRead)
	protected.PATCH("/notifications/:id/sent",
		middleware.RequirePermissions("users:manage"),
		deps.Handlers.Notifications.MarkSent,
	)

	protected.GET("/users", deps.Handlers.Users.List)
	protected.GET("/users/:id", deps.Handlers.Users.Get)

	admin := protected.Group("")
	admin.Use(middleware.RequirePermissions("users:manage"))
	admin.POST("/users", deps.Handlers.Users.Create)
	admin.PUT("/users/:id", deps.Handlers.Users.Update)
	admin.DELETE("/users/:id", deps.Handlers.Users.Delete)

	admin.GET("/departments", deps.Handlers.Departments.List)
	admin.POST("/departments", deps.Handlers.Departments.Create)
	admin.GET("/departments/:id", deps.Handlers.Departments.Get)
	admin.PUT("/departments/:id", deps.Handlers.Departments.Update)
	admin.DELETE("/departments/:id", deps.Handlers.Departments.Delete)

	manager := protected.Group("")
	manager.Use(middleware.RequirePermissions("audit:view"))
	manager.GET("/audit-logs", deps.Handlers.AuditLogs.List)
	manager.GET("/dashboard", deps.Handlers.Dashboard.Stats)
	manager.GET("/dashboard/stats", deps.Handlers.Dashboard.Stats)

	return router
}
