package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/deps"
	uiform "github.com/ashrafinamdar23/alertd/pkg/store/uischema"
	"github.com/gin-gonic/gin"
)

type UIFormAdmin struct{ store *uiform.FormStore }

func RegisterUIFormAdmin(api *gin.RouterGroup, d *deps.Deps) {
	h := &UIFormAdmin{store: uiform.NewFormStore(d.Gorm)}
	api.POST("/schema/forms", h.createSchema)
	api.POST("/schema/forms/:id/fields", h.addField)
	api.POST("/schema/forms/:id/activate", h.activate)
	api.POST("/schema/forms/fields/:fieldId/options", h.addOption) // optional, for selects
}

type formCreateReq struct {
	Model    string `json:"model"`
	Kind     string `json:"kind"` // create|edit
	IsActive bool   `json:"isActive"`
	Version  int    `json:"version"`
}

func (h *UIFormAdmin) createSchema(c *gin.Context) {
	var req formCreateReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Model == "" || (req.Kind != "create" && req.Kind != "edit") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON or required fields missing"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	row, err := h.store.CreateSchema(ctx, req.Model, req.Kind, req.IsActive, req.Version)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, row)
}

type fieldCreateReq struct {
	FieldName   string  `json:"field_name"`
	FieldLabel  string  `json:"field_label"`
	Widget      string  `json:"widget"`
	DataType    string  `json:"data_type"`
	Required    *bool   `json:"required,omitempty"`
	MaxLen      *int    `json:"max_len,omitempty"`
	MinLen      *int    `json:"min_len,omitempty"`
	Pattern     *string `json:"pattern,omitempty"`
	Placeholder *string `json:"placeholder,omitempty"`
	OrderNo     *int    `json:"order_no,omitempty"`
	Visible     *bool   `json:"visible,omitempty"`
}

func (h *UIFormAdmin) addField(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid schema id"})
		return
	}

	var req fieldCreateReq
	if err := c.ShouldBindJSON(&req); err != nil || req.FieldName == "" || req.FieldLabel == "" || req.Widget == "" || req.DataType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON or required fields missing"})
		return
	}
	in := uiform.FormFieldCreate{
		FieldName: req.FieldName, FieldLabel: req.FieldLabel, Widget: req.Widget, DataType: req.DataType,
		Required: boolOr(req.Required, false), MaxLen: req.MaxLen, MinLen: req.MinLen,
		Pattern: req.Pattern, Placeholder: req.Placeholder, OrderNo: intOr(req.OrderNo, 10), Visible: boolOr(req.Visible, true),
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()
	row, err := h.store.CreateField(ctx, id, in)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *UIFormAdmin) activate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid schema id"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()
	if err := h.store.ActivateSchema(ctx, id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "activated"})
}

type optionCreateReq struct {
	FieldID uint64 `json:"field_id"` // optional if you prefer path-based only
	Label   string `json:"label"`
	Value   string `json:"value"`
	OrderNo *int   `json:"order_no,omitempty"`
}

func (h *UIFormAdmin) addOption(c *gin.Context) {
	fieldID, err := strconv.ParseUint(c.Param("fieldId"), 10, 64)
	if err != nil || fieldID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid field id"})
		return
	}
	var req optionCreateReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Label == "" || req.Value == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON or required fields missing"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()
	if _, err := h.store.AddOption(ctx, fieldID, req.Label, req.Value, intOr(req.OrderNo, 10)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "created"})
}
