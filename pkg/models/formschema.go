package models

import "time"

type UIFormSchema struct {
	ID        uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Model     string    `json:"model" gorm:"type:varchar(100);not null;index:ix_form_schema_model_kind,priority:1"`
	Kind      string    `json:"kind"  gorm:"type:enum('create','edit');not null;index:ix_form_schema_model_kind,priority:2"`
	IsActive  bool      `json:"isActive" gorm:"not null;default:true;uniqueIndex:ux_form_schema_model_kind_active,priority:3"`
	Version   int       `json:"version"  gorm:"not null;default:1"`
	CreatedAt time.Time `json:"createdAt" gorm:"not null;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"not null;autoUpdateTime"`
}

func (UIFormSchema) TableName() string { return "ui_form_schemas" }

type UIFormSchemaField struct {
	ID          uint64  `json:"id" gorm:"primaryKey;autoIncrement"`
	SchemaID    uint64  `json:"schemaId" gorm:"not null;index"`
	FieldName   string  `json:"fieldName"  gorm:"type:varchar(100);not null"`
	FieldLabel  string  `json:"fieldLabel" gorm:"type:varchar(255);not null"`
	Widget      string  `json:"widget"     gorm:"type:enum('input','number','select','switch','date','datetime','textarea','password','email');not null"`
	DataType    string  `json:"dataType"   gorm:"type:enum('string','number','datetime','boolean');not null"`
	Required    bool    `json:"required"   gorm:"not null;default:false"`
	MaxLen      *int    `json:"maxLen"`
	MinLen      *int    `json:"minLen"`
	Pattern     *string `json:"pattern"`
	Placeholder *string `json:"placeholder"`
	OrderNo     int     `json:"orderNo"   gorm:"not null;default:10"`
	Visible     bool    `json:"visible"   gorm:"not null;default:true"`
}

func (UIFormSchemaField) TableName() string { return "ui_form_schema_fields" }

type UIFormFieldOption struct {
	ID       uint64 `json:"id" gorm:"primaryKey;autoIncrement"`
	FieldID  uint64 `json:"fieldId" gorm:"not null;index"`
	OptLabel string `json:"optLabel" gorm:"type:varchar(255);not null"`
	OptValue string `json:"optValue" gorm:"type:varchar(255);not null"`
	OrderNo  int    `json:"orderNo"  gorm:"not null;default:10"`
}

func (UIFormFieldOption) TableName() string { return "ui_form_field_options" }
