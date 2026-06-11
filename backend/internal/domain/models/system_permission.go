package models

type SystemPermission struct {
	BaseModel
	Name        string `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
}

func (SystemPermission) TableName() string {
	return "system_permissions"
}
