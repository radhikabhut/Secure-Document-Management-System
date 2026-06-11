package repository

import (
	"testing"

	"docuvault-be/internal/domain/models"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestUserListQueryQualifiesJoinedTableColumns(t *testing.T) {
	db, err := gorm.Open(postgres.Open("host=localhost user=postgres dbname=docuvault_test sslmode=disable"), &gorm.Config{
		DisableAutomaticPing: true,
		DryRun:               true,
	})
	require.NoError(t, err)

	query := db.
		Model(&models.User{}).
		Preload("Role").
		Joins("JOIN roles ON roles.id = users.role_id")
	query = applyUserFilter(query, UserFilter{Role: string(models.RoleEmployee)})

	var users []models.User
	statement := applyPaginationWithSortColumns(query, Pagination{
		SortBy:    "updated_at",
		SortOrder: "asc",
	}, "created_at", userSortColumns).Find(&users).Statement

	sql := statement.SQL.String()
	require.Contains(t, sql, "JOIN roles ON roles.id = users.role_id")
	require.Contains(t, sql, "roles.name = $1")
	require.Contains(t, sql, "ORDER BY users.updated_at asc")
}

func TestUserListQueryDefaultsToQualifiedCreatedAtSort(t *testing.T) {
	db, err := gorm.Open(postgres.Open("host=localhost user=postgres dbname=docuvault_test sslmode=disable"), &gorm.Config{
		DisableAutomaticPing: true,
		DryRun:               true,
	})
	require.NoError(t, err)

	query := db.
		Model(&models.User{}).
		Preload("Role").
		Joins("JOIN roles ON roles.id = users.role_id")

	var users []models.User
	statement := applyPaginationWithSortColumns(query, Pagination{}, "created_at", userSortColumns).Find(&users).Statement

	require.Contains(t, statement.SQL.String(), "ORDER BY users.created_at desc")
}
