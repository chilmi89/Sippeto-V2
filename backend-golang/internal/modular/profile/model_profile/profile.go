package model_profile

import (
	"time"

	"github.com/uptrace/bun"
)

type Profile struct {
	bun.BaseModel `bun:"table:profiles,alias:p"`

	ID           string     `bun:"id,type:uuid,pk" json:"id"`
	RoleID       string     `bun:"role_id,type:uuid" json:"role_id"`
	Email        string     `bun:"email,notnull,unique" json:"email"`
	FullName     *string    `bun:"full_name" json:"full_name"`
	BusinessName *string    `bun:"business_name" json:"business_name"`
	Username     *string    `bun:"username" json:"username"`
	PhoneNumber  *string    `bun:"phone_number" json:"phone_number"`
	Address      *string    `bun:"address" json:"address"`
	AvatarURL    *string    `bun:"avatar_url" json:"avatar_url"`
	BannerURL    *string    `bun:"banner_url" json:"banner_url"`
	Bio          *string    `bun:"bio" json:"bio"`
	Password     string     `bun:"password" json:"-"`
	IsActive     bool       `bun:"is_active,default:true" json:"is_active"`
	CreatedAt    time.Time  `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt    time.Time  `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	BranchID     *string    `bun:"branch_id,type:uuid" json:"branch_id"`
	PaymentQR    *string    `bun:"payment_qr" json:"payment_qr"`

	// Relasi untuk scanning opsional jika digunakan
	RoleName string `bun:"role_name,scanonly" json:"role_name,omitempty"`
}
