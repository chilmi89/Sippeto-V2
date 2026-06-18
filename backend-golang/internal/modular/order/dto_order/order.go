package dto_order

import "time"

type OrderItemResponse struct {
	ID          string    `json:"id"`
	OrderID     string    `json:"order_id"`
	ProductID   *string   `json:"product_id"`
	Quantity    int       `json:"quantity"`
	Price       float64   `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
	ProductName *string   `json:"product_name"` // Diambil dari table products
}

type OrderResponse struct {
	ID              string              `json:"id"`
	ProfileID       *string             `json:"profile_id"`
	BranchID        *string             `json:"branch_id"`
	ReferenceNumber string              `json:"reference_number"`
	CustomerName    string              `json:"customer_name"`
	CustomerPhone   string              `json:"customer_phone"`
	CustomerAddress *string             `json:"customer_address"`
	PaymentMethod   string              `json:"payment_method"`
	TotalPrice      float64             `json:"total_price"`
	Status          string              `json:"status"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
	OrderItems      []OrderItemResponse `json:"order_items"`
	BranchName      *string             `json:"branch_name"` // Diambil dari table branches
}

type UpdateOrderStatusRequest struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type CheckoutItemRequest struct {
	ProductID string  `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type CheckoutRequest struct {
	ProfileID       string                `json:"profile_id"`
	BranchID        string                `json:"branch_id"`
	CustomerName    string                `json:"customer_name"`
	CustomerPhone   string                `json:"customer_phone"`
	CustomerAddress string                `json:"customer_address"`
	PaymentMethod   string                `json:"payment_method"`
	TotalPrice      float64               `json:"total_price"`
	Items           []CheckoutItemRequest `json:"items"`
}

type CheckoutResponse struct {
	Message string        `json:"message"`
	Order   OrderResponse `json:"order"`
}

type PaginatedOrdersResponse struct {
	Data       []OrderResponse `json:"data"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"totalPages"`
}

type GetOrdersQuery struct {
	ProfileID string
	Page      int
	Limit     int
	Search    string
	Status    string
}
