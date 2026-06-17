package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"docuvault-be/internal/config"
	"docuvault-be/internal/database"
	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/http/handler"
	"docuvault-be/internal/http/routes"
	"docuvault-be/internal/pkg/auth"
	"docuvault-be/internal/pkg/email"
	applogger "docuvault-be/internal/pkg/logger"
	"docuvault-be/internal/pkg/storage"
	"docuvault-be/internal/pkg/validator"
	"docuvault-be/internal/repository"
	"docuvault-be/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// @title Secure Document Management System API
// @version 1.0
// @description Enterprise document management backend with JWT authentication, RBAC, audit logging, document storage, notifications, and analytics.
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	appLogger, err := applogger.New(cfg.App.Env)
	if err != nil {
		log.Fatalf("create logger: %v", err)
	}
	defer appLogger.Sync()

	if cfg.App.Env == config.EnvProduction {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := database.Connect(ctx, cfg.Database, cfg.App.Env, appLogger)
	if err != nil {
		appLogger.Fatal("connect database", zap.Error(err))
	}
	defer db.Close()

	if err := db.Gorm.AutoMigrate(
		&models.Department{},
		&models.Role{},
		&models.SystemPermission{},
		&models.User{},
		&models.Category{},
		&models.Document{},
		&models.Permission{},
		&models.AuditLog{},
		&models.Notification{},
	); err != nil {
		appLogger.Fatal("migrate database", zap.Error(err))
	}

	userRepo := repository.NewUserRepository(db.Gorm)
	roleRepo := repository.NewRoleRepository(db.Gorm)
	departmentRepo := repository.NewDepartmentRepository(db.Gorm)
	categoryRepo := repository.NewCategoryRepository(db.Gorm)
	documentRepo := repository.NewDocumentRepository(db.Gorm)
	permissionRepo := repository.NewPermissionRepository(db.Gorm)
	auditLogRepo := repository.NewAuditLogRepository(db.Gorm)
	notificationRepo := repository.NewNotificationRepository(db.Gorm)
	dashboardRepo := repository.NewDashboardRepository(db.Gorm)

	if err := roleRepo.SeedDefaults(ctx); err != nil {
		appLogger.Fatal("seed roles", zap.Error(err))
	}

	requestValidator, err := validator.New()
	if err != nil {
		appLogger.Fatal("create validator", zap.Error(err))
	}

	jwtManager := auth.NewJWTManager(cfg.JWT, cfg.App.Name)
	storageManager := storage.NewManager(cfg.Storage, cfg.Upload)
	mailer := email.NewSender(cfg.SMTP)

	auditLogService := service.NewAuditLogService(auditLogRepo)
	authService := service.NewAuthService(userRepo, roleRepo, notificationRepo, auditLogService, jwtManager, mailer)
	userService := service.NewUserService(userRepo, roleRepo, departmentRepo)
	departmentService := service.NewDepartmentService(departmentRepo)
	categoryService := service.NewCategoryService(categoryRepo, auditLogService)
	documentService := service.NewDocumentService(documentRepo, categoryRepo, permissionRepo, auditLogService, storageManager)
	permissionService := service.NewPermissionService(permissionRepo, documentRepo, userRepo, roleRepo, departmentRepo, auditLogService, notificationRepo, mailer)
	notificationService := service.NewNotificationService(notificationRepo)
	dashboardService := service.NewDashboardService(dashboardRepo, auditLogRepo)

	router := routes.NewRouter(routes.Dependencies{
		Log:       appLogger,
		JWT:       jwtManager,
		Users:     userRepo,
		MaxBodyMB: cfg.Upload.MaxSizeMB,
		Handlers: routes.Handlers{
			Auth:          handler.NewAuthHandler(authService, requestValidator),
			Users:         handler.NewUserHandler(userService, requestValidator),
			Departments:   handler.NewDepartmentHandler(departmentService, requestValidator),
			Categories:    handler.NewCategoryHandler(categoryService, requestValidator),
			Documents:     handler.NewDocumentHandler(documentService, requestValidator),
			Permissions:   handler.NewPermissionHandler(permissionService, requestValidator),
			AuditLogs:     handler.NewAuditLogHandler(auditLogService, requestValidator),
			Notifications: handler.NewNotificationHandler(notificationService, requestValidator),
			Dashboard:     handler.NewDashboardHandler(dashboardService),
		},
	})

	server := &http.Server{
		Addr:              cfg.App.Address(),
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		appLogger.Info("starting server", zap.String("address", cfg.App.Address()))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			appLogger.Fatal("run server", zap.Error(err))
		}
	}()

	<-ctx.Done()
	stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	appLogger.Info("shutting down server")
	if err := server.Shutdown(shutdownCtx); err != nil {
		appLogger.Fatal("shutdown server", zap.Error(err))
	}
	appLogger.Info("server stopped")
}
