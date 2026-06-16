package dto_profile

import "time"

type ProfileResponse struct {
	ID           string     `json:"id"`
	RoleID       string     `json:"role_id"`
	Email        string     `json:"email"`
	FullName     *string    `json:"full_name"`
	BusinessName *string    `json:"business_name"`
	Username     *string    `json:"username"`
	PhoneNumber  *string    `json:"phone_number"`
	Address      *string    `json:"address"`
	AvatarURL    *string    `json:"avatar_url"`
	BannerURL    *string    `json:"banner_url"`
	Bio          *string    `json:"bio"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	BranchID     *string    `json:"branch_id"`
	PaymentQR    *string    `json:"payment_qr"`
	RoleName     string     `json:"role_name"`
	Permissions  []string   `json:"permissions"`
}
