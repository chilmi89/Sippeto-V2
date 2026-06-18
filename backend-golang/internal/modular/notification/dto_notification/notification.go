package dto_notification

import "time"

type PendingOrderMin struct {
	ID              string    `json:"id"`
	ReferenceNumber string    `json:"reference_number"`
	CustomerName    string    `json:"customer_name"`
	TotalPrice      float64   `json:"total_price"`
	CreatedAt       time.Time `json:"created_at"`
}

type LowStockProductMin struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Stock      int    `json:"stock"`
	MinStock   int    `json:"min_stock"`
	BranchName string `json:"branch_name"`
}

type NotificationResponse struct {
	PendingOrdersCount int                  `json:"pendingOrdersCount"`
	LowStockCount      int                  `json:"lowStockCount"`
	TotalCount         int                  `json:"totalCount"`
	PendingOrders      []PendingOrderMin    `json:"pendingOrders"`
	LowStockProducts   []LowStockProductMin `json:"lowStockProducts"`
}
