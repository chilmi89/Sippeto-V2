package dto_payment_method

type PaymentMethodResponse struct {
	ID        string  `json:"id"`
	ProfileID *string `json:"profile_id"`
	Name      string  `json:"name"`
	IsActive  bool    `json:"is_active"`
	CreatedAt string  `json:"created_at"`
}

type PaymentMethodListResponse struct {
	Data       []PaymentMethodResponse `json:"data"`
	Total      int                     `json:"total"`
	Page       int                     `json:"page"`
	TotalPages int                     `json:"totalPages"`
}

type CreatePaymentMethodRequest struct {
	Name      string  `json:"name" binding:"required"`
	ProfileID *string `json:"profile_id"`
	IsActive  *bool   `json:"is_active"`
}

type UpdatePaymentMethodRequest struct {
	ID       string  `json:"id" binding:"required"`
	Name     *string `json:"name"`
	IsActive *bool   `json:"is_active"`
}
