package models

type RoleName string

const (
	RoleAdmin    RoleName = "ADMIN"
	RoleManager  RoleName = "MANAGER"
	RoleEmployee RoleName = "EMPLOYEE"
	RoleViewer   RoleName = "VIEWER"
)

type Role struct {
	BaseModel
	Name              RoleName           `gorm:"type:varchar(30);uniqueIndex;not null" json:"name"`
	Description       string             `gorm:"type:text" json:"description"`
	Users             []User             `gorm:"foreignKey:RoleID" json:"-"`
	SystemPermissions []SystemPermission `gorm:"many2many:role_system_permissions;" json:"system_permissions"`
}

func (Role) TableName() string {
	return "roles"
}
