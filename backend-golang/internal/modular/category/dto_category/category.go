package dto_category

type CategoryResponse struct {
	ID        string  `json:"id"`
	ProfileID *string `json:"profile_id"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	CreatedAt string  `json:"created_at"`
}

type CategoryListResponse struct {
	Data       []CategoryResponse `json:"data"`
	Total      int                `json:"total"`
	Page       int                `json:"page"`
	TotalPages int                `json:"totalPages"`
}

type CreateCategoryRequest struct {
	Name      string  `json:"name" binding:"required"`
	Type      string  `json:"type" binding:"required"`
	ProfileID *string `json:"profile_id"`
}

type UpdateCategoryRequest struct {
	ID   string  `json:"id" binding:"required"`
	Name *string `json:"name"`
	Type *string `json:"type"`
}
