package model_branch

import (
	"time"

	"github.com/uptrace/bun"
)

type Branch struct {
	bun.BaseModel `bun:"table:branches,alias:b"`

	ID          string    `bun:"id,type:uuid,pk,default:gen_random_uuid()" json:"id"`
	TenantID    string    `bun:"tenant_id,type:uuid,notnull" json:"tenant_id"`
	Name        string    `bun:"name,notnull" json:"name"`
	Address     *string   `bun:"address" json:"address"`
	PhoneNumber *string   `bun:"phone_number" json:"phone_number"`
	IsActive    bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt   time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt   time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	PaymentQR   *string   `bun:"payment_qr" json:"payment_qr"`

	// Fields tambahan untuk scanning relasi (bukan kolom tabel langsung)
	StaffCount       int `bun:"staff_count,scanonly" json:"staff_count,omitempty"`
	TransactionCount int `bun:"transaction_count,scanonly" json:"transaction_count,omitempty"`
}
