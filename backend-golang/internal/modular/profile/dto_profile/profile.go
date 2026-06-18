package dto_profile

import (
	"encoding/json"
	"time"
)

type ProfileResponse struct {
	ID           string          `json:"id"`
	RoleID       string          `json:"role_id"`
	Email        string          `json:"email"`
	FullName     *string         `json:"full_name"`
	BusinessName *string         `json:"business_name"`
	Username     *string         `json:"username"`
	PhoneNumber  *string         `json:"phone_number"`
	Address      *string         `json:"address"`
	AvatarURL    *string         `json:"avatar_url"`
	BannerURL    *string         `json:"banner_url"`
	Bio          *string         `json:"bio"`
	IsActive     bool            `json:"is_active"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	BranchID     *string         `json:"branch_id"`
	PaymentQR    *string         `json:"payment_qr"`
	RoleName     string          `json:"role_name"`
	Permissions  []string        `json:"permissions"`
	Metadata     json.RawMessage `json:"metadata"`
}

type CreateUserRequest struct {
	Email        string  `json:"email" binding:"required"`
	Password     string  `json:"password" binding:"required"`
	FullName     string  `json:"full_name" binding:"required"`
	RoleID       string  `json:"role_id"`
	BusinessName *string `json:"business_name"`
	PhoneNumber  *string `json:"phone_number"`
	IsActive     *bool   `json:"is_active"`
	BranchID     *string `json:"branch_id"`
}

type UpdateUserRequest struct {
	Email        string  `json:"email"`
	Password     string  `json:"password"`
	FullName     string  `json:"full_name"`
	RoleID       string  `json:"role_id"`
	BusinessName *string `json:"business_name"`
	PhoneNumber  *string `json:"phone_number"`
	IsActive     *bool   `json:"is_active"`
	BranchID     *string `json:"branch_id"`
}

type UserRole struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type UserResponse struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	FullName     *string   `json:"full_name"`
	PhoneNumber  *string   `json:"phone_number"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	BusinessName *string   `json:"business_name"`
	BranchID     *string   `json:"branch_id"`
	Roles        *UserRole `json:"roles"`
}
