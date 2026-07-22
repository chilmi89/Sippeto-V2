package dto_discount

type DiscountResponse struct {
	ID          string   `json:"id"`
	ProfileID   string   `json:"profile_id"`
	Code        *string  `json:"code"`
	Name        string   `json:"name"`
	Type        string   `json:"type"` // "PERCENTAGE" or "FIXED_AMOUNT"
	Value       float64  `json:"value"`
	MinPurchase float64  `json:"min_purchase"`
	MaxDiscount *float64 `json:"max_discount"`
	StartDate   *string  `json:"start_date"`
	EndDate     *string  `json:"end_date"`
	IsActive    bool     `json:"is_active"`
	CreatedAt   string   `json:"created_at"`
	ProductIDs  []string `json:"product_ids"`
}

type DiscountListResponse struct {
	Data       []DiscountResponse `json:"data"`
	Total      int                `json:"total"`
	Page       int                `json:"page"`
	TotalPages int                `json:"totalPages"`
}

type CreateDiscountRequest struct {
	ProfileID   string   `json:"profile_id"`
	Code        *string  `json:"code"`
	Name        string   `json:"name" binding:"required"`
	Type        string   `json:"type" binding:"required"` // PERCENTAGE / FIXED_AMOUNT
	Value       float64  `json:"value"`
	MinPurchase float64  `json:"min_purchase"`
	MaxDiscount *float64 `json:"max_discount"`
	StartDate   *string  `json:"start_date"`
	EndDate     *string  `json:"end_date"`
	IsActive    *bool    `json:"is_active"`
}

type UpdateDiscountRequest struct {
	ID          string   `json:"id"`
	Code        *string  `json:"code"`
	Name        *string  `json:"name"`
	Type        *string  `json:"type"`
	Value       *float64 `json:"value"`
	MinPurchase *float64 `json:"min_purchase"`
	MaxDiscount *float64 `json:"max_discount"`
	StartDate   *string  `json:"start_date"`
	EndDate     *string  `json:"end_date"`
	IsActive    *bool    `json:"is_active"`
}

type ValidateDiscountRequest struct {
	Code      string  `json:"code" binding:"required"`
	ProfileID string  `json:"profile_id" binding:"required"`
	Subtotal  float64 `json:"subtotal" binding:"required"`
}

type ValidateDiscountResponse struct {
	DiscountID     string  `json:"discount_id"`
	Code           string  `json:"code"`
	Name           string  `json:"name"`
	Type           string  `json:"type"`
	Value          float64 `json:"value"`
	DiscountAmount float64 `json:"discount_amount"`
	FinalTotal     float64 `json:"final_total"`
}

type ToggleDiscountProductRequest struct {
	ProductID string `json:"product_id" binding:"required"`
	Enabled   bool   `json:"enabled"`
}
