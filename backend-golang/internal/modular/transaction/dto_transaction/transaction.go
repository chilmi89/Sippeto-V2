package dto_transaction

import "time"

// Model-model DTO dasar
type CategoryMinInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

type PaymentMethodMinInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type TransactionItemResponse struct {
	ID              string                `json:"id"`
	GroupID         string                `json:"group_id"`
	CategoryID      *string               `json:"category_id"`
	PaymentMethodID *string               `json:"payment_method_id"`
	Type            string                `json:"type"`
	Name            string                `json:"name"`
	Amount          float64               `json:"amount"`
	ProductID       *string               `json:"product_id"`
	Quantity        int                   `json:"quantity"`
	CreatedAt       time.Time             `json:"created_at"`
	Categories      *CategoryMinInfo      `json:"categories"`
	PaymentMethods  *PaymentMethodMinInfo `json:"payment_methods"`
}

type TransactionAttachmentResponse struct {
	ID        string    `json:"id"`
	GroupID   string    `json:"group_id"`
	FileURL   string    `json:"file_url"`
	CreatedAt time.Time `json:"created_at"`
}

type TransactionGroupResponse struct {
	ID                     string                          `json:"id"`
	ProfileID              string                          `json:"profile_id"`
	BranchID               *string                         `json:"branch_id"`
	ReferenceNumber        *string                         `json:"reference_number"`
	TransactionDate        time.Time                       `json:"transaction_date"`
	Description            *string                         `json:"description"`
	TotalIncome            float64                         `json:"total_income"`
	TotalExpense           float64                         `json:"total_expense"`
	NetBalance             float64                         `json:"net_balance"`
	CustomerName           *string                         `json:"customer_name"`
	CustomerPhone          *string                         `json:"customer_phone"`
	CustomerAddress        *string                         `json:"customer_address"`
	OrderStatus            int                             `json:"order_status"`
	CreatedAt              time.Time                       `json:"created_at"`
	UpdatedAt              time.Time                       `json:"updated_at"`
	TransactionItems       []TransactionItemResponse       `json:"transaction_items"`
	TransactionAttachments []TransactionAttachmentResponse `json:"transaction_attachments"`
}

type TransactionGroupListResponse struct {
	Data       []TransactionGroupResponse `json:"data"`
	Total      int                        `json:"total"`
	Page       int                        `json:"page"`
	TotalPages int                        `json:"totalPages"`
}

// Payloads untuk Request
type CreateTransactionItemRequest struct {
	CategoryID      *string `json:"category_id"`
	PaymentMethodID *string `json:"payment_method_id"`
	Type            string  `json:"type"`
	Name            string  `json:"name"`
	Amount          float64 `json:"amount"`
	ProductID       *string `json:"product_id"`
	Quantity        *int    `json:"quantity"`
}

type CreateTransactionGroupRequest struct {
	ProfileID       string                         `json:"profile_id"`
	BranchID        *string                        `json:"branch_id"`
	ReferenceNumber *string                        `json:"reference_number"`
	TransactionDate *string                        `json:"transaction_date"` // format ISO8601
	Description     *string                        `json:"description"`
	CustomerName    *string                        `json:"customer_name"`
	CustomerPhone   *string                        `json:"customer_phone"`
	CustomerAddress *string                        `json:"customer_address"`
	OrderStatus     *int                           `json:"order_status"`
	Items           []CreateTransactionItemRequest `json:"items"`
}

type UpdateTransactionGroupRequest struct {
	ID              string                         `json:"id"`
	BranchID        *string                        `json:"branch_id"`
	ReferenceNumber *string                        `json:"reference_number"`
	TransactionDate *string                        `json:"transaction_date"`
	Description     *string                        `json:"description"`
	CustomerName    *string                        `json:"customer_name"`
	CustomerPhone   *string                        `json:"customer_phone"`
	CustomerAddress *string                        `json:"customer_address"`
	OrderStatus     *int                           `json:"order_status"`
	Items           []CreateTransactionItemRequest `json:"items"` // Optional, jika dikirim akan mereplace semua
}

type CreateTransactionItemDirectRequest struct {
	GroupID         string  `json:"group_id"`
	CategoryID      *string `json:"category_id"`
	PaymentMethodID *string `json:"payment_method_id"`
	Type            string  `json:"type"`
	Name            string  `json:"name"`
	Amount          float64 `json:"amount"`
}

type UpdateTransactionItemDirectRequest struct {
	ID              string   `json:"id"`
	CategoryID      *string  `json:"category_id"`
	PaymentMethodID *string  `json:"payment_method_id"`
	Type            *string  `json:"type"`
	Name            *string  `json:"name"`
	Amount          *float64 `json:"amount"`
}

type TransactionItemListResponse struct {
	Data       []TransactionItemResponse `json:"data"`
	Total      int                       `json:"total"`
	Page       int                       `json:"page"`
	TotalPages int                       `json:"totalPages"`
}

type CreateAttachmentRequest struct {
	GroupID string `json:"group_id"`
	FileURL string `json:"file_url"`
}

type UpdateAttachmentRequest struct {
	ID      string  `json:"id"`
	GroupID *string `json:"group_id"`
	FileURL *string `json:"file_url"`
}

type TransactionAttachmentListResponse struct {
	Data       []TransactionAttachmentResponse `json:"data"`
	Total      int                             `json:"total"`
	Page       int                             `json:"page"`
	TotalPages int                             `json:"totalPages"`
}
