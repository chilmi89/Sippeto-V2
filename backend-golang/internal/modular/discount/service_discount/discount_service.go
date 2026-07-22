package service_discount

import (
	"context"
	"fmt"
	"math"
	"time"

	"backend-golang/internal/modular/discount/dto_discount"
	"backend-golang/internal/modular/discount/model_discount"
	"backend-golang/internal/modular/discount/repository_discount"
)

type DiscountService interface {
	GetDiscounts(ctx context.Context, page, limit int, search, profileID string) (*dto_discount.DiscountListResponse, error)
	GetDiscountByID(ctx context.Context, id string) (*dto_discount.DiscountResponse, error)
	CreateDiscount(ctx context.Context, req *dto_discount.CreateDiscountRequest) (*dto_discount.DiscountResponse, error)
	UpdateDiscount(ctx context.Context, req *dto_discount.UpdateDiscountRequest) (*dto_discount.DiscountResponse, error)
	DeleteDiscount(ctx context.Context, id string) error
	ValidateDiscount(ctx context.Context, req *dto_discount.ValidateDiscountRequest) (*dto_discount.ValidateDiscountResponse, error)
	GetDiscountProductIDs(ctx context.Context, discountID string) ([]string, error)
	ToggleDiscountProduct(ctx context.Context, discountID, productID string, enabled bool) error
}

type discountService struct {
	repo repository_discount.DiscountRepository
}

func NewDiscountService(repo repository_discount.DiscountRepository) DiscountService {
	return &discountService{repo: repo}
}

func (s *discountService) GetDiscounts(ctx context.Context, page, limit int, search, profileID string) (*dto_discount.DiscountListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	items, total, err := s.repo.FindDiscountsPaginated(ctx, page, limit, search, profileID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data diskon: %w", err)
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	var dtos []dto_discount.DiscountResponse
	for _, disc := range items {
		dDto := toDiscountResponse(&disc)
		pIDs, _ := s.repo.GetDiscountProductIDs(ctx, disc.ID)
		if pIDs == nil {
			pIDs = []string{}
		}
		dDto.ProductIDs = pIDs
		dtos = append(dtos, dDto)
	}

	return &dto_discount.DiscountListResponse{
		Data:       dtos,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *discountService) GetDiscountByID(ctx context.Context, id string) (*dto_discount.DiscountResponse, error) {
	disc, err := s.repo.FindDiscountByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("diskon tidak ditemukan: %w", err)
	}
	res := toDiscountResponse(disc)
	pIDs, _ := s.repo.GetDiscountProductIDs(ctx, disc.ID)
	if pIDs == nil {
		pIDs = []string{}
	}
	res.ProductIDs = pIDs
	return &res, nil
}

func parseTime(s string) *time.Time {
	if s == "" {
		return nil
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return &t
	}
	if t, err := time.Parse("2006-01-02T15:04", s); err == nil {
		return &t
	}
	if t, err := time.Parse("2006-01-02 15:04:05", s); err == nil {
		return &t
	}
	return nil
}

func (s *discountService) CreateDiscount(ctx context.Context, req *dto_discount.CreateDiscountRequest) (*dto_discount.DiscountResponse, error) {
	var startPtr *time.Time
	if req.StartDate != nil {
		startPtr = parseTime(*req.StartDate)
	}

	var endPtr *time.Time
	if req.EndDate != nil {
		endPtr = parseTime(*req.EndDate)
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	disc := &model_discount.Discount{
		ProfileID:   req.ProfileID,
		Code:        req.Code,
		Name:        req.Name,
		Type:        req.Type,
		Value:       req.Value,
		MinPurchase: req.MinPurchase,
		MaxDiscount: req.MaxDiscount,
		StartDate:   startPtr,
		EndDate:     endPtr,
		IsActive:    isActive,
	}

	err := s.repo.CreateDiscount(ctx, disc)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat diskon: %w", err)
	}

	res := toDiscountResponse(disc)
	return &res, nil
}

func (s *discountService) UpdateDiscount(ctx context.Context, req *dto_discount.UpdateDiscountRequest) (*dto_discount.DiscountResponse, error) {
	existing, err := s.repo.FindDiscountByID(ctx, req.ID)
	if err != nil {
		return nil, fmt.Errorf("diskon tidak ditemukan: %w", err)
	}

	if req.Code != nil {
		existing.Code = req.Code
	}
	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Type != nil {
		existing.Type = *req.Type
	}
	if req.Value != nil {
		existing.Value = *req.Value
	}
	if req.MinPurchase != nil {
		existing.MinPurchase = *req.MinPurchase
	}
	existing.MaxDiscount = req.MaxDiscount
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	if req.StartDate != nil {
		if *req.StartDate == "" {
			existing.StartDate = nil
		} else {
			existing.StartDate = parseTime(*req.StartDate)
		}
	}

	if req.EndDate != nil {
		if *req.EndDate == "" {
			existing.EndDate = nil
		} else {
			existing.EndDate = parseTime(*req.EndDate)
		}
	}

	err = s.repo.UpdateDiscount(ctx, existing)
	if err != nil {
		return nil, fmt.Errorf("gagal memperbarui diskon: %w", err)
	}

	res := toDiscountResponse(existing)
	return &res, nil
}

func (s *discountService) DeleteDiscount(ctx context.Context, id string) error {
	return s.repo.DeleteDiscount(ctx, id)
}

func (s *discountService) ValidateDiscount(ctx context.Context, req *dto_discount.ValidateDiscountRequest) (*dto_discount.ValidateDiscountResponse, error) {
	disc, err := s.repo.FindDiscountByCode(ctx, req.ProfileID, req.Code)
	if err != nil {
		return nil, fmt.Errorf("kode diskon '%s' tidak valid atau tidak ditemukan", req.Code)
	}

	if !disc.IsActive {
		return nil, fmt.Errorf("kode diskon '%s' sudah tidak aktif", req.Code)
	}

	now := time.Now()
	if disc.StartDate != nil && now.Before(*disc.StartDate) {
		return nil, fmt.Errorf("kode diskon '%s' belum mulai berlaku", req.Code)
	}
	if disc.EndDate != nil && now.After(*disc.EndDate) {
		return nil, fmt.Errorf("kode diskon '%s' sudah kadaluarsa", req.Code)
	}

	if req.Subtotal < disc.MinPurchase {
		return nil, fmt.Errorf("minimal pembelian untuk kode ini adalah Rp %.0f", disc.MinPurchase)
	}

	var discountAmount float64
	if disc.Type == "PERCENTAGE" {
		discountAmount = (req.Subtotal * disc.Value) / 100.0
		if disc.MaxDiscount != nil && *disc.MaxDiscount > 0 && discountAmount > *disc.MaxDiscount {
			discountAmount = *disc.MaxDiscount
		}
	} else {
		// FIXED_AMOUNT
		discountAmount = disc.Value
	}

	if discountAmount > req.Subtotal {
		discountAmount = req.Subtotal
	}

	finalTotal := req.Subtotal - discountAmount

	codeStr := ""
	if disc.Code != nil {
		codeStr = *disc.Code
	}

	return &dto_discount.ValidateDiscountResponse{
		DiscountID:     disc.ID,
		Code:           codeStr,
		Name:           disc.Name,
		Type:           disc.Type,
		Value:          disc.Value,
		DiscountAmount: discountAmount,
		FinalTotal:     finalTotal,
	}, nil
}

func toDiscountResponse(disc *model_discount.Discount) dto_discount.DiscountResponse {
	var startStr *string
	if disc.StartDate != nil {
		s := disc.StartDate.Format(time.RFC3339)
		startStr = &s
	}

	var endStr *string
	if disc.EndDate != nil {
		e := disc.EndDate.Format(time.RFC3339)
		endStr = &e
	}

	return dto_discount.DiscountResponse{
		ID:          disc.ID,
		ProfileID:   disc.ProfileID,
		Code:        disc.Code,
		Name:        disc.Name,
		Type:        disc.Type,
		Value:       disc.Value,
		MinPurchase: disc.MinPurchase,
		MaxDiscount: disc.MaxDiscount,
		StartDate:   startStr,
		EndDate:     endStr,
		IsActive:    disc.IsActive,
		CreatedAt:   disc.CreatedAt.Format(time.RFC3339),
	}
}

func (s *discountService) GetDiscountProductIDs(ctx context.Context, discountID string) ([]string, error) {
	return s.repo.GetDiscountProductIDs(ctx, discountID)
}

func (s *discountService) ToggleDiscountProduct(ctx context.Context, discountID, productID string, enabled bool) error {
	return s.repo.ToggleDiscountProduct(ctx, discountID, productID, enabled)
}
