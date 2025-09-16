package models

import "time"

type UIListSchema struct {
	ID        uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Model     string    `json:"model" gorm:"type:varchar(100);not null;index:ix_ui_list_schemas_model"`
	IsActive  bool      `json:"isActive" gorm:"not null;default:true;uniqueIndex:ux_ui_list_schemas_model_active,priority:2"`
	Version   int       `json:"version"  gorm:"not null;default:1"`
	CreatedAt time.Time `json:"createdAt" gorm:"not null;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"not null;autoUpdateTime"`
}

func (UIListSchema) TableName() string { return "ui_list_schemas" }

type UIListSchemaField struct {
	ID         uint64 `json:"id" gorm:"primaryKey;autoIncrement"`
	SchemaID   uint64 `json:"schemaId" gorm:"not null;index"`
	FieldName  string `json:"fieldName"  gorm:"type:varchar(100);not null"`
	FieldLabel string `json:"fieldLabel" gorm:"type:varchar(255);not null"`
	FieldType  string `json:"fieldType"  gorm:"type:enum('string','number','datetime','boolean');not null"`
	Width      *int   `json:"width"      gorm:""`
	Align      string `json:"align"      gorm:"type:enum('left','right','center');not null;default:'left'"`
	Sortable   bool   `json:"sortable"   gorm:"not null;default:false"`
	Searchable bool   `json:"searchable" gorm:"not null;default:false"`
	OrderNo    int    `json:"orderNo"    gorm:"not null;default:10"`
	Visible    bool   `json:"visible"    gorm:"not null;default:true"`
}

func (UIListSchemaField) TableName() string { return "ui_list_schema_fields" }
