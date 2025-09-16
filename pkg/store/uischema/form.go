package uischema

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/ashrafinamdar23/alertd/pkg/models"
	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

type FormFieldOptionDTO struct {
	Label string `json:"label"`
	Value string `json:"value"`
	Order int    `json:"order"`
}
type FormFieldDTO struct {
	Name        string               `json:"name"`
	Label       string               `json:"label"`
	Widget      string               `json:"widget"`
	DataType    string               `json:"dataType"`
	Required    bool                 `json:"required"`
	MaxLen      *int                 `json:"maxLen,omitempty"`
	MinLen      *int                 `json:"minLen,omitempty"`
	Pattern     *string              `json:"pattern,omitempty"`
	Placeholder *string              `json:"placeholder,omitempty"`
	OrderNo     int                  `json:"orderNo"`
	Options     []FormFieldOptionDTO `json:"options,omitempty"`
}
type FormSchemaDTO struct {
	Model  string         `json:"model"`
	Kind   string         `json:"kind"`
	Fields []FormFieldDTO `json:"fields"`
}

type FormStore struct{ db *gorm.DB }

func NewFormStore(db *gorm.DB) *FormStore { return &FormStore{db: db} }

// Read active form schema
func (s *FormStore) GetActive(ctx context.Context, model, kind string) (*FormSchemaDTO, error) {
	var schema models.UIFormSchema
	err := s.db.WithContext(ctx).
		Where("model = ? AND kind = ? AND is_active = 1", model, kind).
		Limit(1).Take(&schema).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var fields []models.UIFormSchemaField
	if err := s.db.WithContext(ctx).
		Where("schema_id = ? AND visible = 1", schema.ID).
		Order("order_no ASC, id ASC").
		Find(&fields).Error; err != nil {
		return nil, err
	}

	out := &FormSchemaDTO{Model: schema.Model, Kind: schema.Kind, Fields: make([]FormFieldDTO, 0, len(fields))}
	for _, f := range fields {
		ff := FormFieldDTO{
			Name: f.FieldName, Label: f.FieldLabel, Widget: f.Widget, DataType: f.DataType,
			Required: f.Required, MaxLen: f.MaxLen, MinLen: f.MinLen, Pattern: f.Pattern,
			Placeholder: f.Placeholder, OrderNo: f.OrderNo,
		}
		// options
		if f.Widget == "select" {
			var opts []models.UIFormFieldOption
			if err := s.db.WithContext(ctx).
				Where("field_id = ?", f.ID).
				Order("order_no ASC, id ASC").
				Find(&opts).Error; err != nil {
				return nil, err
			}
			for _, o := range opts {
				ff.Options = append(ff.Options, FormFieldOptionDTO{Label: o.OptLabel, Value: o.OptValue, Order: o.OrderNo})
			}
		}
		out.Fields = append(out.Fields, ff)
	}
	return out, nil
}

// Admin: create schema
func (s *FormStore) CreateSchema(ctx context.Context, model, kind string, isActive bool, version int) (*models.UIFormSchema, error) {
	model = strings.TrimSpace(model)
	kind = strings.TrimSpace(kind)
	if model == "" || (kind != "create" && kind != "edit") {
		return nil, fmt.Errorf("model and valid kind are required")
	}
	if version <= 0 {
		version = 1
	}
	var out *models.UIFormSchema
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		row := &models.UIFormSchema{Model: model, Kind: kind, IsActive: isActive, Version: version}
		if isActive {
			if err := tx.Model(&models.UIFormSchema{}).Where("model = ? AND kind = ?", model, kind).Update("is_active", false).Error; err != nil {
				return err
			}
		}
		if err := tx.Create(row).Error; err != nil {
			return err
		}
		out = row
		return nil
	})
	return out, err
}

type FormFieldCreate struct {
	FieldName   string
	FieldLabel  string
	Widget      string
	DataType    string
	Required    bool
	MaxLen      *int
	MinLen      *int
	Pattern     *string
	Placeholder *string
	OrderNo     int
	Visible     bool
}

func (s *FormStore) CreateField(ctx context.Context, schemaID uint64, in FormFieldCreate) (*models.UIFormSchemaField, error) {
	switch in.Widget {
	case "input", "number", "select", "switch", "date", "datetime", "textarea", "password", "email":
	default:
		return nil, fmt.Errorf("invalid widget")
	}
	switch in.DataType {
	case "string", "number", "datetime", "boolean":
	default:
		return nil, fmt.Errorf("invalid data_type")
	}
	if strings.TrimSpace(in.FieldName) == "" || strings.TrimSpace(in.FieldLabel) == "" {
		return nil, fmt.Errorf("field_name and field_label are required")
	}
	if in.OrderNo == 0 {
		in.OrderNo = 10
	}
	row := &models.UIFormSchemaField{
		SchemaID: schemaID, FieldName: strings.TrimSpace(in.FieldName), FieldLabel: strings.TrimSpace(in.FieldLabel),
		Widget: in.Widget, DataType: in.DataType, Required: in.Required, MaxLen: in.MaxLen, MinLen: in.MinLen,
		Pattern: in.Pattern, Placeholder: in.Placeholder, OrderNo: in.OrderNo, Visible: in.Visible,
	}
	if err := s.db.WithContext(ctx).Create(row).Error; err != nil {
		var me *mysql.MySQLError
		if errors.As(err, &me) && me.Number == 1062 {
			return nil, fmt.Errorf("duplicate field_name")
		}
		return nil, err
	}
	return row, nil
}
func (s *FormStore) AddOption(ctx context.Context, fieldID uint64, label, value string, order int) (*models.UIFormFieldOption, error) {
	if strings.TrimSpace(label) == "" || strings.TrimSpace(value) == "" {
		return nil, fmt.Errorf("label and value are required")
	}
	if order == 0 {
		order = 10
	}
	row := &models.UIFormFieldOption{FieldID: fieldID, OptLabel: label, OptValue: value, OrderNo: order}
	if err := s.db.WithContext(ctx).Create(row).Error; err != nil {
		var me *mysql.MySQLError
		if errors.As(err, &me) && me.Number == 1062 {
			return nil, fmt.Errorf("duplicate option")
		}
		return nil, err
	}
	return row, nil
}
func (s *FormStore) ActivateSchema(ctx context.Context, id uint64) error {
	var sch models.UIFormSchema
	if err := s.db.WithContext(ctx).Take(&sch, id).Error; err != nil {
		return err
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.UIFormSchema{}).Where("model = ? AND kind = ?", sch.Model, sch.Kind).Update("is_active", false).Error; err != nil {
			return err
		}
		return tx.Model(&models.UIFormSchema{}).Where("id = ?", id).Update("is_active", true).Error
	})
}
