package model_stock

import (
	"time"

	"github.com/uptrace/bun"
)

type StockMutation struct {
	bun.BaseModel `bun:"table:stock_mutations,alias:sm"`

	ID           string    `bun:"id,type:uuid,pk,default:gen_random_uuid()" json:"id"`
	ProductID    string    `bun:"product_id,type:uuid,notnull" json:"product_id"`
	FromBranchID *string   `bun:"from_branch_id,type:uuid" json:"from_branch_id"`
	ToBranchID   *string   `bun:"to_branch_id,type:uuid" json:"to_branch_id"`
	Quantity     int       `bun:"quantity,notnull" json:"quantity"`
	Type         string    `bun:"type,type:varchar(50),notnull" json:"type"`
	Notes        *string   `bun:"notes" json:"notes"`
	CreatedAt    time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`

	// Scan-only fields for Joins
	ProductName    string  `bun:"product_name,scanonly" json:"product_name,omitempty"`
	FromBranchName *string `bun:"from_branch_name,scanonly" json:"from_branch_name,omitempty"`
	ToBranchName   *string `bun:"to_branch_name,scanonly" json:"to_branch_name,omitempty"`
}
