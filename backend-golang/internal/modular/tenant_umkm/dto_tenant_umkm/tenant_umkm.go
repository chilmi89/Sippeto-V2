package dto_tenant_umkm

import (
	"encoding/json"
)

type FinancialSummary struct {
	TotalPendapatan  float64 `json:"totalPendapatan"`
	TotalPengeluaran float64 `json:"totalPengeluaran"`
	TotalSaldo       float64 `json:"totalSaldo"`
	NetProfit        float64 `json:"netProfit"`
}

type SaldoChartItem struct {
	Name  string  `json:"name"`
	Saldo float64 `json:"saldo"`
}

type PendapatanChartItem struct {
	Name       string  `json:"name"`
	Pendapatan float64 `json:"pendapatan"`
}

type PengeluaranChartItem struct {
	Name        string  `json:"name"`
	Pengeluaran float64 `json:"pengeluaran"`
}

type LabaRugiChartItem struct {
	Name   string  `json:"name"`
	Untung float64 `json:"untung"`
	Rugi   float64 `json:"pengeluaran"`
}

type FinancialCharts struct {
	Saldo       []SaldoChartItem       `json:"saldo"`
	Pendapatan  []PendapatanChartItem  `json:"pendapatan"`
	Pengeluaran []PengeluaranChartItem `json:"pengeluaran"`
	LabaRugi    []LabaRugiChartItem    `json:"labaRugi"`
}

type FinancialsResponse struct {
	Summary FinancialSummary `json:"summary"`
	Charts  FinancialCharts  `json:"charts"`
}

type TenantProfileInfo struct {
	ID            string          `json:"id"`
	FullName      *string         `json:"full_name"`
	BusinessName  *string         `json:"business_name"`
	Email         string          `json:"email"`
	PhoneNumber   *string         `json:"phone_number"`
	Address       *string         `json:"address"`
	AvatarURL     *string         `json:"avatar_url"`
	BannerURL     *string         `json:"banner_url"`
	Bio           *string         `json:"bio"`
	IsActive      bool            `json:"is_active"`
	CreatedAt     string          `json:"created_at"`
	UpdatedAt     string          `json:"updated_at"`
	BranchID      *string         `json:"branch_id"`
	Username      *string         `json:"username"`
	UserRole      string          `json:"userRole"`
	TenantOwnerID string          `json:"tenant_owner_id"`
	Metadata      json.RawMessage `json:"metadata"`
	PaymentQR     *string         `json:"payment_qr"`
}

type TenantUMKMResponse struct {
	Profile    TenantProfileInfo  `json:"profile"`
	Financials FinancialsResponse `json:"financials"`
}

type UpdateTenantUMKMRequest struct {
	FullName     *string         `json:"full_name"`
	BusinessName *string         `json:"business_name"`
	PhoneNumber  *string         `json:"phone_number"`
	Address      *string         `json:"address"`
	Bio          *string         `json:"bio"`
	AvatarURL    *string         `json:"avatar_url"`
	BannerURL    *string         `json:"banner_url"`
	Username     *string         `json:"username"`
	PaymentQR    *string         `json:"payment_qr"`
	Metadata     json.RawMessage `json:"metadata"`
}

type UpdateTenantUMKMResponse struct {
	ID           string          `json:"id"`
	FullName     *string         `json:"full_name"`
	BusinessName *string         `json:"business_name"`
	PhoneNumber  *string         `json:"phone_number"`
	Address      *string         `json:"address"`
	Bio          *string         `json:"bio"`
	AvatarURL    *string         `json:"avatar_url"`
	BannerURL    *string         `json:"banner_url"`
	Username     *string         `json:"username"`
	PaymentQR    *string         `json:"payment_qr"`
	UpdatedAt    string          `json:"updated_at"`
	Metadata     json.RawMessage `json:"metadata"`
}

type CompleteRegisterUMKMRequest struct {
	ID           string          `json:"id"`
	FullName     *string         `json:"full_name"`
	BusinessName *string         `json:"business_name"`
	Email        string          `json:"email"`
	PhoneNumber  *string         `json:"phone_number"`
	Address      *string         `json:"address"`
	Bio          *string         `json:"bio"`
	AvatarURL    *string         `json:"avatar_url"`
	BannerURL    *string         `json:"banner_url"`
	Username     *string         `json:"username"`
	PaymentQR    *string         `json:"payment_qr"`
	Metadata     json.RawMessage `json:"metadata"`
}

type PublicProductStock struct {
	Stock    int    `json:"stock"`
	BranchID string `json:"branch_id"`
}

type PublicProductCategory struct {
	Name string `json:"name"`
}

type PublicProductInfo struct {
	ID                string                 `json:"id"`
	ProfileID         string                 `json:"profile_id"`
	CategoryID        *string                `json:"category_id"`
	Name              string                 `json:"name"`
	Description       *string                `json:"description"`
	BasePrice         float64                `json:"base_price"`
	SellPrice         float64                `json:"sell_price"`
	ImageURL          *string                `json:"image_url"`
	IsActive          bool                   `json:"is_active"`
	ProductCategories *PublicProductCategory `json:"product_categories"`
	ProductStocks     []PublicProductStock   `json:"product_stocks"`
}

type PublicBranchInfo struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Address     *string `json:"address"`
	PhoneNumber *string `json:"phone_number"`
	PaymentQR   *string `json:"payment_qr"`
}

type PublicStorefrontResponse struct {
	Profile  TenantProfileInfo   `json:"profile"`
	Products []PublicProductInfo `json:"products"`
	Branches []PublicBranchInfo  `json:"branches"`
}
