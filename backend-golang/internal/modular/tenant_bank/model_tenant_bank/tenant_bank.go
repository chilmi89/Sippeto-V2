package model_tenant_bank

import (
	"time"

	"github.com/uptrace/bun"
)

type TenantBank struct {
	bun.BaseModel `bun:"table:tenant_banks,alias:tb"`

	ID            string    `bun:"id,pk,type:uuid" json:"id"`
	ProfileID     string    `bun:"profile_id,type:uuid,notnull" json:"profile_id"`
	BankName      string    `bun:"bank_name,notnull" json:"bank_name"`
	AccountNumber string    `bun:"account_number,notnull" json:"account_number"`
	AccountName   string    `bun:"account_name,notnull" json:"account_name"`
	IsActive      bool      `bun:"is_active,default:true" json:"is_active"`
	IsPrimary     bool      `bun:"is_primary,default:false" json:"is_primary"`
	CreatedAt     time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt     time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
}
