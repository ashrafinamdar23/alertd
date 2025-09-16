package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/deps"
	uistore "github.com/ashrafinamdar23/alertd/pkg/store/uischema"
	"github.com/gin-gonic/gin"
)

type UISchema struct{ list *uistore.ListStore }

func RegisterUISchema(api *gin.RouterGroup, d *deps.Deps) {
	h := &UISchema{list: uistore.NewListStore(d.Gorm)}
	api.GET("/schema/list", h.listSchema) // /api/v1/schema/list?model=customer
}

func (h *UISchema) listSchema(c *gin.Context) {
	model := c.Query("model")
	if model == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "model query param is required"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	ls, err := h.list.GetActive(ctx, model)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load schema"})
		return
	}
	if ls == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "list schema not found"})
		return
	}
	c.JSON(http.StatusOK, ls)
}
