package models

type Department struct {
	BaseModel
	Name        string `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`

	Users       []User       `gorm:"foreignKey:DepartmentID" json:"users,omitempty"`
	Permissions []Permission `gorm:"foreignKey:DepartmentID" json:"-"`
}

func (Department) TableName() string {
	return "departments"
}
