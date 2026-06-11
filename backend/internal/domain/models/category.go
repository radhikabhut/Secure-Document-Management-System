package models

import "github.com/google/uuid"

type Category struct {
	BaseModel
	Name          string     `gorm:"type:varchar(120);uniqueIndex;not null" json:"name"`
	Description   string     `gorm:"type:text" json:"description"`
	ParentID      *uuid.UUID `gorm:"type:uuid;index" json:"parent_id,omitempty"`
	Parent        *Category  `gorm:"foreignKey:ParentID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"parent,omitempty"`
	SubCategories []Category `gorm:"foreignKey:ParentID" json:"sub_categories,omitempty"`
	CreatedBy     uuid.UUID  `gorm:"type:uuid;not null;index" json:"created_by"`
	Creator       User       `gorm:"foreignKey:CreatedBy;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"creator,omitempty"`
	Documents     []Document `gorm:"foreignKey:CategoryID" json:"-"`
	DocumentCount int64      `gorm:"->"`
}

func (Category) TableName() string {
	return "categories"
}
