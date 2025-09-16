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

type ColumnDTO struct {
	Field      string `json:"field"`
	Label      string `json:"label"`
	Type       string `json:"type"`
	Width      *int   `json:"width,omitempty"`
	Align      string `json:"align,omitempty"`
	Sortable   bool   `json:"sortable,omitempty"`
	Searchable bool   `json:"searchable,omitempty"`
}

type ListSchemaDTO struct {
	Model   string      `json:"model"`
	Columns []ColumnDTO `json:"columns"`
}

type ListStore struct{ db *gorm.DB }

// <-- THIS is the symbol your handler is calling
func NewListStore(db *gorm.DB) *ListStore { return &ListStore{db: db} }

// Read active schema for a model (used by GET /schema/list?model=...)
func (s *ListStore) GetActive(ctx context.Context, model string) (*ListSchemaDTO, error) {
	var schema models.UIListSchema
	err := s.db.WithContext(ctx).
		Where("model = ? AND is_active = 1", model).
		Limit(1).
		Take(&schema).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var fields []models.UIListSchemaField
	if err := s.db.WithContext(ctx).
		Where("schema_id = ? AND visible = 1", schema.ID).
		Order("order_no ASC, id ASC").
		Find(&fields).Error; err != nil {
		return nil, err
	}

	out := &ListSchemaDTO{
		Model:   schema.Model,
		Columns: make([]ColumnDTO, 0, len(fields)),
	}
	for _, f := range fields {
		out.Columns = append(out.Columns, ColumnDTO{
			Field:      f.FieldName,
			Label:      f.FieldLabel,
			Type:       f.FieldType,
			Width:      f.Width,
			Align:      f.Align,
			Sortable:   f.Sortable,
			Searchable: f.Searchable,
		})
	}
	return out, nil
}

// Admin: create schema row (usually inactive)
func (s *ListStore) CreateSchema(ctx context.Context, model string, isActive bool, version int) (*models.UIListSchema, error) {
	model = strings.TrimSpace(model)
	if model == "" {
		return nil, fmt.Errorf("model is required")
	}
	if version <= 0 {
		version = 1
	}

	var out *models.UIListSchema
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		row := &models.UIListSchema{
			Model:    model,
			IsActive: isActive,
			Version:  version,
		}

		if isActive {
			if err := tx.Model(&models.UIListSchema{}).
				Where("model = ?", model).
				Update("is_active", false).Error; err != nil {
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

// Admin: activate schema (and inactivate others of same model)
func (s *ListStore) ActivateSchema(ctx context.Context, id uint64) error {
	var row models.UIListSchema
	if err := s.db.WithContext(ctx).Take(&row, id).Error; err != nil {
		return err
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.UIListSchema{}).
			Where("model = ?", row.Model).
			Update("is_active", false).Error; err != nil {
			return err
		}
		return tx.Model(&models.UIListSchema{}).
			Where("id = ?", id).
			Update("is_active", true).Error
	})
}

// Admin: add a field to a schema
type FieldCreate struct {
	FieldName  string
	FieldLabel string
	FieldType  string // "string" | "number" | "datetime" | "boolean"
	Width      *int
	Align      string // "left" | "right" | "center"
	Sortable   bool
	Searchable bool
	OrderNo    int
	Visible    bool
}

func (s *ListStore) CreateField(ctx context.Context, schemaID uint64, in FieldCreate) (*models.UIListSchemaField, error) {
	switch in.FieldType {
	case "string", "number", "datetime", "boolean":
	default:
		return nil, fmt.Errorf("invalid field_type")
	}
	switch in.Align {
	case "", "left", "right", "center":
	default:
		return nil, fmt.Errorf("invalid align")
	}
	if in.OrderNo == 0 {
		in.OrderNo = 10
	}

	f := &models.UIListSchemaField{
		SchemaID:   schemaID,
		FieldName:  strings.TrimSpace(in.FieldName),
		FieldLabel: strings.TrimSpace(in.FieldLabel),
		FieldType:  in.FieldType,
		Width:      in.Width,
		Align:      ifEmptyDefault(in.Align, "left"),
		Sortable:   in.Sortable,
		Searchable: in.Searchable,
		OrderNo:    in.OrderNo,
		Visible:    in.Visible,
	}
	if f.FieldName == "" || f.FieldLabel == "" {
		return nil, fmt.Errorf("field_name and field_label are required")
	}

	if err := s.db.WithContext(ctx).Create(f).Error; err != nil {
		var me *mysql.MySQLError
		if errors.As(err, &me) && me.Number == 1062 {
			return nil, fmt.Errorf("duplicate field_name")
		}
		return nil, err
	}
	return f, nil
}

func ifEmptyDefault(s, def string) string {
	if strings.TrimSpace(s) == "" {
		return def
	}
	return s
}

func (s *ListStore) ListSchemas(ctx context.Context, model string, limit, offset int) ([]models.UIListSchema, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	q := s.db.WithContext(ctx).Model(&models.UIListSchema{})
	if strings.TrimSpace(model) != "" {
		q = q.Where("model = ?", strings.TrimSpace(model))
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []models.UIListSchema
	if err := q.Order("updated_at DESC, id DESC").
		Limit(limit).Offset(offset).
		Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

// List fields for a schema (all, ordered)
func (s *ListStore) ListFields(ctx context.Context, schemaID uint64) ([]models.UIListSchemaField, error) {
	var rows []models.UIListSchemaField
	err := s.db.WithContext(ctx).
		Where("schema_id = ?", schemaID).
		Order("order_no ASC, id ASC").
		Find(&rows).Error
	return rows, err
}
