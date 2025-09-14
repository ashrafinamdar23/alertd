package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/ashrafinamdar23/alertd/pkg/deps"
	"github.com/ashrafinamdar23/alertd/pkg/store/customer"
	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
)

type Customers struct {
	s *customer.Store
}

func RegisterCustomers(api *gin.RouterGroup, d *deps.Deps) {
	h := &Customers{s: customer.New(d.Gorm)} // <- use GORM
	api.POST("/customers", h.create)
	api.GET("/customers", h.list)
}

type createReq struct {
	Name string `json:"name"`
}

func (h *Customers) create(c *gin.Context) {
	var req createReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" || len(req.Name) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name must be 1..255 chars"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	row, err := h.s.Create(ctx, req.Name)
	if err != nil {
		var me *mysql.MySQLError
		if errors.As(err, &me) && me.Number == 1062 {
			c.JSON(http.StatusConflict, gin.H{"error": "customer with this name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *Customers) list(c *gin.Context) {
	q := c.Query("q")
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

	rows, err := h.s.List(ctx, limit, offset, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows, "limit": limit, "offset": offset, "q": q})
}

func atoiDefault(s string, d int) int {
	if s == "" {
		return d
	}
	n := 0
	sign := 1
	for i, ch := range s {
		if i == 0 && ch == '-' {
			sign = -1
			continue
		}
		if ch < '0' || ch > '9' {
			return d
		}
		n = n*10 + int(ch-'0')
	}
	return sign * n
}
