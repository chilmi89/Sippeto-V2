package dto_tenant_bank

import "time"

type CreateTenantBankRequest struct {
	ProfileID     string `json:"profile_id"`
	BankName      string `json:"bank_name"`
	AccountNumber string `json:"account_number"`
	AccountName   string `json:"account_name"`
	IsActive      *bool  `json:"is_active"`
	IsPrimary     *bool  `json:"is_primary"`
}

type UpdateTenantBankRequest struct {
	ID            string  `json:"id"`
	BankName      *string `json:"bank_name"`
	AccountNumber *string `json:"account_number"`
	AccountName   *string `json:"account_name"`
	IsActive      *bool   `json:"is_active"`
	IsPrimary     *bool   `json:"is_primary"`
}

type TenantBankResponse struct {
	ID            string    `json:"id"`
	ProfileID     string    `json:"profile_id"`
	BankName      string    `json:"bank_name"`
	AccountNumber string    `json:"account_number"`
	AccountName   string    `json:"account_name"`
	IsActive      bool      `json:"is_active"`
	IsPrimary     bool      `json:"is_primary"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
