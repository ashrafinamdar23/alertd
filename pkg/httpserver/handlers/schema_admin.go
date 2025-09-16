package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/deps"
	uistore "github.com/ashrafinamdar23/alertd/pkg/store/uischema"
	"github.com/gin-gonic/gin"
)

type UISchemaAdmin struct {
	list *uistore.ListStore
}

func RegisterUISchemaAdmin(api *gin.RouterGroup, d *deps.Deps) {
	h := &UISchemaAdmin{list: uistore.NewListStore(d.Gorm)}
	// Create a schema row (usually inactive)
	api.POST("/schema/list", h.createSchema)
	// Add a field to a schema
	api.POST("/schema/list/:id/fields", h.addField)
	// Activate a schema (and inactivate others for the model)
	api.POST("/schema/list/:id/activate", h.activateSchema)

	// NEW: list all schemas
	api.GET("/schema/lists", h.listSchemas)
	api.GET("/schema/list/:id/fields", h.listFields)
}

type createSchemaReq struct {
	Model    string `json:"model"`
	IsActive bool   `json:"isActive"` // default false; activation usually separate
	Version  int    `json:"version"`  // default 1
}

func (h *UISchemaAdmin) createSchema(c *gin.Context) {
	var req createSchemaReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Model == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON or model missing"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	row, err := h.list.CreateSchema(ctx, req.Model, req.IsActive, req.Version)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, row)
}

type addFieldReq struct {
	FieldName  string `json:"field_name"`
	FieldLabel string `json:"field_label"`
	FieldType  string `json:"field_type"` // string|number|datetime|boolean
	Width      *int   `json:"width,omitempty"`
	Align      string `json:"align"` // left|right|center
	Sortable   *bool  `json:"sortable,omitempty"`
	Searchable *bool  `json:"searchable,omitempty"`
	OrderNo    *int   `json:"order_no,omitempty"`
	Visible    *bool  `json:"visible,omitempty"`
}

func (h *UISchemaAdmin) addField(c *gin.Context) {
	idStr := c.Param("id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid schema id"})
		return
	}

	var req addFieldReq
	if err := c.ShouldBindJSON(&req); err != nil || req.FieldName == "" || req.FieldLabel == "" || req.FieldType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON or required fields missing"})
		return
	}

	in := uistore.FieldCreate{
		FieldName:  req.FieldName,
		FieldLabel: req.FieldLabel,
		FieldType:  req.FieldType,
		Width:      req.Width,
		Align:      req.Align,
		Sortable:   boolOr(req.Sortable, false),
		Searchable: boolOr(req.Searchable, false),
		OrderNo:    intOr(req.OrderNo, 10),
		Visible:    boolOr(req.Visible, true),
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	row, err := h.list.CreateField(ctx, id64, in)
	if err != nil {
		// duplicate field_name or validation
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *UISchemaAdmin) activateSchema(c *gin.Context) {
	idStr := c.Param("id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid schema id"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	if err := h.list.ActivateSchema(ctx, id64); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "activated"})
}

func boolOr(p *bool, def bool) bool {
	if p == nil {
		return def
	}
	return *p
}
func intOr(p *int, def int) int {
	if p == nil {
		return def
	}
	return *p
}

func (h *UISchemaAdmin) listSchemas(c *gin.Context) {
	model := c.Query("model")
	limit := atoiDefault(c.Query("limit"), 20)
	offset := atoiDefault(c.Query("offset"), 0)
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	items, total, err := h.list.ListSchemas(ctx, model, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list schemas failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items":  items,
		"limit":  limit,
		"offset": offset,
		"total":  total,
		"model":  model,
	})
}

func (h *UISchemaAdmin) listFields(c *gin.Context) {
	idStr := c.Param("id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid schema id"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.list.ListFields(ctx, id64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list fields failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}
