package dto_product

import "time"

// ─── Kategori Produk ──────────────────────────────────────────────────────────

type CategoryProfileInfo struct {
	BusinessName *string `json:"business_name"`
	Email        string  `json:"email"`
}

type CategoryResponse struct {
	ID        string               `json:"id"`
	ProfileID *string              `json:"profile_id"`
	Name      string               `json:"name"`
	CreatedAt time.Time            `json:"created_at"`
	Profiles  *CategoryProfileInfo `json:"profiles"`
}

type CategoryPaginatedResponse struct {
	Data       []CategoryResponse `json:"data"`
	Total      int                `json:"total"`
	Page       int                `json:"page"`
	TotalPages int                `json:"totalPages"`
}

type CreateCategoryRequest struct {
	Name      string  `json:"name" binding:"required"`
	ProfileID *string `json:"profile_id"`
}

type UpdateCategoryRequest struct {
	ID   string  `json:"id" binding:"required"`
	Name *string `json:"name"`
}

// ─── Produk ───────────────────────────────────────────────────────────────────

type ProductCategoryInfo struct {
	Name string `json:"name"`
}

type ProductProfileInfo struct {
	BusinessName *string `json:"business_name"`
	FullName     *string `json:"full_name"`
	Email        string  `json:"email"`
}

type ProductStockInfo struct {
	ID       string `json:"id"`
	BranchID string `json:"branch_id"`
	Stock    int    `json:"stock"`
	MinStock int    `json:"min_stock"`
}

type ProductResponse struct {
	ID                     string               `json:"id"`
	ProfileID              string               `json:"profile_id"`
	CategoryID             *string              `json:"category_id"`
	BranchID               *string              `json:"branch_id"`
	Name                   string               `json:"name"`
	Description            *string              `json:"description"`
	BasePrice              float64              `json:"base_price"`
	SellPrice              float64              `json:"sell_price"`
	ImageURL               *string              `json:"image_url"`
	IsActive               bool                 `json:"is_active"`
	CreatedAt              time.Time            `json:"created_at"`
	UpdatedAt              time.Time            `json:"updated_at"`
	ProductCategories      *ProductCategoryInfo `json:"product_categories"`
	Profiles               *ProductProfileInfo  `json:"profiles"`
	ProductStocks          []ProductStockInfo   `json:"product_stocks"`
	CurrentBranchStock     int                  `json:"current_branch_stock,omitempty"`
	CurrentBranchMinStock  int                  `json:"current_branch_min_stock,omitempty"`
}

type BranchStockInput struct {
	BranchID string `json:"branch_id"`
	Stock    int    `json:"stock"`
	MinStock int    `json:"min_stock"`
}

type CreateProductRequest struct {
	ProfileID    string             `json:"profile_id" binding:"required"`
	BranchID     *string            `json:"branch_id"`
	CategoryID   *string            `json:"category_id"`
	Name         string             `json:"name" binding:"required"`
	Description  *string            `json:"description"`
	BasePrice    float64            `json:"base_price"`
	SellPrice    float64            `json:"sell_price"`
	ImageURL     *string            `json:"image_url"`
	IsActive     *bool              `json:"is_active"`
	BranchStocks []BranchStockInput `json:"branch_stocks"`
}

type UpdateProductRequest struct {
	ID           string             `json:"id" binding:"required"`
	CategoryID   *string            `json:"category_id"`
	Name         *string            `json:"name"`
	Description  *string            `json:"description"`
	BasePrice    *float64           `json:"base_price"`
	SellPrice    *float64           `json:"sell_price"`
	ImageURL     *string            `json:"image_url"`
	IsActive     *bool              `json:"is_active"`
	BranchStocks []BranchStockInput `json:"branch_stocks"`
}
