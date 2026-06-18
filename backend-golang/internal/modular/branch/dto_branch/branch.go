package dto_branch

import "time"

type CreateBranchRequest struct {
	TenantID        string  `json:"tenant_id" binding:"required"`
	Name            string  `json:"name" binding:"required"`
	Address         *string `json:"address"`
	PhoneNumber     *string `json:"phone_number"`
	ManagerName     *string `json:"manager_name"`
	ManagerEmail    *string `json:"manager_email"`
	ManagerPassword *string `json:"manager_password"`
	PaymentQR       *string `json:"payment_qr"`
}

type UpdateBranchRequest struct {
	ID          *string `json:"id"`
	Name        *string `json:"name"`
	Address     *string `json:"address"`
	PhoneNumber *string `json:"phone_number"`
	IsActive    *bool   `json:"is_active"`
	PaymentQR   *string `json:"payment_qr"`
}

type BranchStaffResponse struct {
	ID       string `json:"id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	IsActive bool   `json:"is_active"`
}

type BranchCountResponse struct {
	TransactionGroups int `json:"transaction_groups"`
}

type BranchResponse struct {
	ID          string                `json:"id"`
	TenantID    string                `json:"tenant_id"`
	Name        string                `json:"name"`
	Address     *string               `json:"address"`
	PhoneNumber *string               `json:"phone_number"`
	IsActive    bool                  `json:"is_active"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
	PaymentQR   *string               `json:"payment_qr"`
	Staff       []BranchStaffResponse `json:"staff"`
	Count       BranchCountResponse   `json:"_count"`
}
