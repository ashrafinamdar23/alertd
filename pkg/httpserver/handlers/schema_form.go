package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/deps"
	uiform "github.com/ashrafinamdar23/alertd/pkg/store/uischema"
	"github.com/gin-gonic/gin"
)

type UIForm struct{ store *uiform.FormStore }

func RegisterUIForm(api *gin.RouterGroup, d *deps.Deps) {
	h := &UIForm{store: uiform.NewFormStore(d.Gorm)}
	api.GET("/schema/form", h.getActive) // ?model=customer&kind=create
}

func (h *UIForm) getActive(c *gin.Context) {
	model := c.Query("model")
	kind := c.Query("kind")
	if model == "" || (kind != "create" && kind != "edit") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "model and kind(create|edit) are required"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	fs, err := h.store.GetActive(ctx, model, kind)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load form schema"})
		return
	}
	if fs == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "form schema not found"})
		return
	}
	c.JSON(http.StatusOK, fs)
}
