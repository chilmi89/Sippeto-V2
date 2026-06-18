package model_product

import (
	"time"

	"github.com/uptrace/bun"
)

type ProductCategory struct {
	bun.BaseModel `bun:"table:product_categories,alias:pc"`

	ID        string    `bun:"id,type:uuid,pk,default:gen_random_uuid()" json:"id"`
	ProfileID *string   `bun:"profile_id,type:uuid" json:"profile_id"`
	Name      string    `bun:"name,notnull" json:"name"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`

	// Relasi untuk scanning opsional
	BusinessName *string `bun:"business_name,scanonly" json:"business_name,omitempty"`
	Email        string  `bun:"email,scanonly" json:"email,omitempty"`
}

type Product struct {
	bun.BaseModel `bun:"table:products,alias:pr"`

	ID          string    `bun:"id,type:uuid,pk,default:gen_random_uuid()" json:"id"`
	ProfileID   string    `bun:"profile_id,type:uuid,notnull" json:"profile_id"`
	CategoryID  *string   `bun:"category_id,type:uuid" json:"category_id"`
	BranchID    *string   `bun:"branch_id,type:uuid" json:"branch_id"`
	Name        string    `bun:"name,notnull" json:"name"`
	Description *string   `bun:"description" json:"description"`
	BasePrice   float64   `bun:"base_price,default:0" json:"base_price"`
	SellPrice   float64   `bun:"sell_price,default:0" json:"sell_price"`
	ImageURL    *string   `bun:"image_url" json:"image_url"`
	IsActive    bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt   time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt   time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	// Fields untuk scanning relasi
	CategoryName string  `bun:"category_name,scanonly" json:"category_name,omitempty"`
	BusinessName *string `bun:"business_name,scanonly" json:"business_name,omitempty"`
	ProfileEmail string  `bun:"profile_email,scanonly" json:"profile_email,omitempty"`
}

type ProductStock struct {
	bun.BaseModel `bun:"table:product_stocks,alias:ps"`

	ID        string    `bun:"id,type:uuid,pk,default:gen_random_uuid()" json:"id"`
	ProductID string    `bun:"product_id,type:uuid,notnull" json:"product_id"`
	BranchID  string    `bun:"branch_id,type:uuid,notnull" json:"branch_id"`
	Stock     int       `bun:"stock,default:0" json:"stock"`
	MinStock  int       `bun:"min_stock,default:0" json:"min_stock"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
}
