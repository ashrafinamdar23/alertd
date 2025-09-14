package customer

import (
	"context"
	"errors"
	"strings"

	"github.com/ashrafinamdar23/alertd/pkg/models"
	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

type Store struct{ db *gorm.DB }

func New(db *gorm.DB) *Store { return &Store{db: db} }

func (s *Store) Create(ctx context.Context, name string) (*models.Customer, error) {
	name = strings.TrimSpace(name)
	c := &models.Customer{Name: name}
	if err := s.db.WithContext(ctx).Create(c).Error; err != nil {
		// duplicate name → MySQL 1062
		var me *mysql.MySQLError
		if errors.As(err, &me) && me.Number == 1062 {
			return nil, err
		}
		return nil, err
	}
	return c, nil
}

func (s *Store) List(ctx context.Context, limit, offset int, q string) ([]models.Customer, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	tx := s.db.WithContext(ctx).Model(&models.Customer{}).Order("id DESC").Limit(limit).Offset(offset)
	if strings.TrimSpace(q) != "" {
		tx = tx.Where("name LIKE ?", "%"+strings.TrimSpace(q)+"%")
	}
	var rows []models.Customer
	if err := tx.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
