package models

import "time"

type Customer struct {
	ID        uint64    `json:"id"        gorm:"primaryKey;autoIncrement"`
	Name      string    `json:"name"      gorm:"type:varchar(255);not null;uniqueIndex:ux_customers_name"`
	CreatedAt time.Time `json:"createdAt" gorm:"not null;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"not null;autoUpdateTime"`
}

func (Customer) TableName() string { return "customers" }
