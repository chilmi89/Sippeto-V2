package dto_stock

type StockMutationResponse struct {
	ID           string               `json:"id"`
	ProductID    string               `json:"product_id"`
	FromBranchID *string              `json:"from_branch_id"`
	ToBranchID   *string              `json:"to_branch_id"`
	Quantity     int                  `json:"quantity"`
	Type         string               `json:"type"`
	Notes        *string              `json:"notes"`
	CreatedAt    string               `json:"created_at"`
	Products     ProductNameInfo      `json:"products"`
	FromBranch   *BranchNameInfo      `json:"from_branch"`
	ToBranch     *BranchNameInfo      `json:"to_branch"`
}

type ProductNameInfo struct {
	Name string `json:"name"`
}

type BranchNameInfo struct {
	Name string `json:"name"`
}

type ProductStockResponse struct {
	ID        string               `json:"id"`
	ProductID string               `json:"product_id"`
	BranchID  string               `json:"branch_id"`
	Stock     int                  `json:"stock"`
	MinStock  int                  `json:"min_stock"`
	Products  ProductDetailInfo    `json:"products"`
	Branches  BranchNameInfo       `json:"branches"`
}

type ProductDetailInfo struct {
	Name      string  `json:"name"`
	SellPrice float64 `json:"sell_price"`
}

type BranchInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ProductInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ProfileInfo struct {
	ID            string  `json:"id"`
	FullName      *string `json:"full_name"`
	BusinessName  *string `json:"business_name"`
	Email         string  `json:"email"`
	PhoneNumber   *string `json:"phone_number"`
	Address       *string `json:"address"`
	AvatarURL     *string `json:"avatar_url"`
	Bio           *string `json:"bio"`
	IsActive      bool    `json:"is_active"`
	BranchID      *string `json:"branch_id"`
	Username      *string `json:"username"`
	UserRole      string  `json:"userRole"`
	TenantOwnerID string  `json:"tenant_owner_id"`
}

type StocksPageDataResponse struct {
	Profile   ProfileInfo             `json:"profile"`
	Stocks    []ProductStockResponse  `json:"stocks"`
	Mutations []StockMutationResponse `json:"mutations"`
	Branches  []BranchInfo            `json:"branches"`
	Products  []ProductInfo           `json:"products"`
}

type BranchStockInput struct {
	BranchID string `json:"branch_id"`
	Stock    int    `json:"stock"`
	MinStock int    `json:"min_stock"`
}

type UpdateStockRequest struct {
	ProductID    string             `json:"product_id"`
	BranchID     *string            `json:"branch_id,omitempty"`      // Terisi untuk single opname (oleh cabang)
	Stock        *int               `json:"stock,omitempty"`          // Terisi untuk opname/adjustment
	MinStock     *int               `json:"min_stock,omitempty"`      // Terisi untuk min_stock
	Notes        *string            `json:"notes,omitempty"`          // Catatan mutasi (opsional)
	BranchStocks []BranchStockInput `json:"branch_stocks,omitempty"`  // Terisi untuk alokasi multi-cabang oleh Owner
	
	// Parameter khusus untuk Transfer Stok
	IsTransfer   *bool              `json:"is_transfer,omitempty"`    // Flag boolean penanda transfer stok
	FromBranchID *string            `json:"from_branch_id,omitempty"` // Cabang pengirim
	ToBranchID   *string            `json:"to_branch_id,omitempty"`   // Cabang penerima
	Quantity     *int               `json:"quantity,omitempty"`       // Jumlah transfer
}

type UpdateStockResponse struct {
	Success          bool                   `json:"success"`
	Action           string                 `json:"action,omitempty"`
	TransferMutation *StockMutationResponse `json:"transferMutation,omitempty"`
}
