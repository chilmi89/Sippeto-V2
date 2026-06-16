package model_auth

import (
	"time"

	"github.com/uptrace/bun"
)

type Profile struct {
	bun.BaseModel `bun:"table:profiles,alias:p"`

	ID           string    `bun:"id,type:uuid,pk" json:"id"`
	RoleID       string    `bun:"role_id,type:uuid" json:"role_id"`
	Email        string    `bun:"email,notnull,unique" json:"email"`
	Password     string    `bun:"password" json:"-"`
	FullName     string    `bun:"full_name" json:"full_name"`
	BusinessName string    `bun:"business_name" json:"business_name"`
	Username     string    `bun:"username" json:"username"`
	PhoneNumber  string    `bun:"phone_number" json:"phone_number"`
	Address      string    `bun:"address" json:"address"`
	AvatarURL    string    `bun:"avatar_url" json:"avatar_url"`
	BannerURL    string    `bun:"banner_url" json:"banner_url"`
	Bio          string    `bun:"bio" json:"bio"`
	IsActive     bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt    time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt    time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	Role *Role `bun:"rel:belongs-to,join:role_id=id" json:"role"`
}

type Role struct {
	bun.BaseModel `bun:"table:roles,alias:r"`

	ID        string    `bun:"id,type:uuid,pk" json:"id"`
	Name      string    `bun:"name,notnull,unique" json:"name"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
}
