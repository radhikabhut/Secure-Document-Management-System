package middleware

import (
	"net/http"
	"strings"

	"docuvault-be/internal/domain/models"
	"docuvault-be/internal/dto"
	"docuvault-be/internal/pkg/auth"
	"docuvault-be/internal/pkg/response"
	"docuvault-be/internal/repository"
	"github.com/gin-gonic/gin"
)

const authUserKey = "auth_user"

func Auth(jwtManager *auth.JWTManager, users repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := bearerToken(c.GetHeader("Authorization"))
		if tokenString == "" {
			response.Unauthorized(c, "Missing authorization token")
			return
		}

		claims, err := jwtManager.Validate(tokenString)
		if err != nil {
			response.Unauthorized(c, "Invalid authorization token")
			return
		}

		if claims.TokenType == "reset" {
			response.Unauthorized(c, "Cannot use reset token for API access")
			return
		}

		user, err := users.FindByID(c.Request.Context(), claims.UserID)
		if err != nil || !user.IsActive {
			response.Unauthorized(c, "Invalid authorization token")
			return
		}

		var sysPerms []string
		for _, p := range user.Role.SystemPermissions {
			sysPerms = append(sysPerms, p.Name)
		}

		c.Set(authUserKey, dto.AuthUser{
			ID:                user.ID,
			Email:             user.Email,
			Role:              string(user.Role.Name),
			Active:            user.IsActive,
			SystemPermissions: sysPerms,
		})
		c.Next()
	}
}

func RequireRoles(roles ...models.RoleName) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, role := range roles {
		allowed[string(role)] = true
	}

	return func(c *gin.Context) {
		user, ok := CurrentUser(c)
		if !ok {
			response.Unauthorized(c, "Authentication required")
			return
		}
		if !allowed[user.Role] {
			response.Forbidden(c, "Insufficient permissions")
			return
		}
		c.Next()
	}
}

func RequirePermissions(permissions ...string) gin.HandlerFunc {
	required := make(map[string]bool, len(permissions))
	for _, p := range permissions {
		required[p] = true
	}

	return func(c *gin.Context) {
		user, ok := CurrentUser(c)
		if !ok {
			response.Unauthorized(c, "Authentication required")
			return
		}

		hasPermission := false
		for _, userPerm := range user.SystemPermissions {
			if required[userPerm] {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			response.Forbidden(c, "Insufficient system permissions")
			return
		}
		c.Next()
	}
}

func CurrentUser(c *gin.Context) (dto.AuthUser, bool) {
	value, ok := c.Get(authUserKey)
	if !ok {
		return dto.AuthUser{}, false
	}
	user, ok := value.(dto.AuthUser)
	return user, ok
}

func bearerToken(header string) string {
	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}

func Health() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}
