package service_tenant_bank

import (
	"context"
	"errors"

	"backend-golang/internal/modular/tenant_bank/dto_tenant_bank"
	"backend-golang/internal/modular/tenant_bank/model_tenant_bank"
	"backend-golang/internal/modular/tenant_bank/repository_tenant_bank"
)

type TenantBankService interface {
	GetTenantBanks(ctx context.Context, profileID string) ([]dto_tenant_bank.TenantBankResponse, error)
	GetTenantBankByID(ctx context.Context, id string) (*dto_tenant_bank.TenantBankResponse, error)
	CreateTenantBank(ctx context.Context, req dto_tenant_bank.CreateTenantBankRequest) (*dto_tenant_bank.TenantBankResponse, error)
	UpdateTenantBank(ctx context.Context, req dto_tenant_bank.UpdateTenantBankRequest) (*dto_tenant_bank.TenantBankResponse, error)
	DeleteTenantBank(ctx context.Context, id string) error
	SetPrimaryBank(ctx context.Context, profileID string, id string) error
}

type tenantBankService struct {
	repo repository_tenant_bank.TenantBankRepository
}

func NewTenantBankService(repo repository_tenant_bank.TenantBankRepository) TenantBankService {
	return &tenantBankService{repo: repo}
}

func (s *tenantBankService) GetTenantBanks(ctx context.Context, profileID string) ([]dto_tenant_bank.TenantBankResponse, error) {
	banks, err := s.repo.FindByProfileID(ctx, profileID)
	if err != nil {
		return nil, err
	}
	var res []dto_tenant_bank.TenantBankResponse
	for _, b := range banks {
		res = append(res, dto_tenant_bank.TenantBankResponse{
			ID:            b.ID,
			ProfileID:     b.ProfileID,
			BankName:      b.BankName,
			AccountNumber: b.AccountNumber,
			AccountName:   b.AccountName,
			IsActive:      b.IsActive,
			IsPrimary:     b.IsPrimary,
			CreatedAt:     b.CreatedAt,
			UpdatedAt:     b.UpdatedAt,
		})
	}
	if res == nil {
		res = []dto_tenant_bank.TenantBankResponse{}
	}
	return res, nil
}

func (s *tenantBankService) GetTenantBankByID(ctx context.Context, id string) (*dto_tenant_bank.TenantBankResponse, error) {
	b, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, errors.New("rekening bank tidak ditemukan")
	}
	return &dto_tenant_bank.TenantBankResponse{
		ID:            b.ID,
		ProfileID:     b.ProfileID,
		BankName:      b.BankName,
		AccountNumber: b.AccountNumber,
		AccountName:   b.AccountName,
		IsActive:      b.IsActive,
		IsPrimary:     b.IsPrimary,
		CreatedAt:     b.CreatedAt,
		UpdatedAt:     b.UpdatedAt,
	}, nil
}

func (s *tenantBankService) CreateTenantBank(ctx context.Context, req dto_tenant_bank.CreateTenantBankRequest) (*dto_tenant_bank.TenantBankResponse, error) {
	if req.ProfileID == "" {
		return nil, errors.New("profile_id wajib diisi")
	}
	if req.BankName == "" {
		return nil, errors.New("nama bank wajib diisi")
	}
	if req.AccountNumber == "" {
		return nil, errors.New("nomor rekening wajib diisi")
	}
	if req.AccountName == "" {
		return nil, errors.New("nama pemilik rekening wajib diisi")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	isPrimary := false
	if req.IsPrimary != nil {
		isPrimary = *req.IsPrimary
	}

	// Cek jika ini rekening pertama untuk profile_id, buat otomatis primary
	existing, _ := s.repo.FindByProfileID(ctx, req.ProfileID)
	if len(existing) == 0 {
		isPrimary = true
	}

	bank := &model_tenant_bank.TenantBank{
		ProfileID:     req.ProfileID,
		BankName:      req.BankName,
		AccountNumber: req.AccountNumber,
		AccountName:   req.AccountName,
		IsActive:      isActive,
		IsPrimary:     isPrimary,
	}

	err := s.repo.Create(ctx, bank)
	if err != nil {
		return nil, err
	}

	// Jika isPrimary di-set true saat create, jalankan SetPrimary
	if isPrimary {
		_ = s.repo.SetPrimary(ctx, req.ProfileID, bank.ID)
		bank.IsPrimary = true
	}

	return &dto_tenant_bank.TenantBankResponse{
		ID:            bank.ID,
		ProfileID:     bank.ProfileID,
		BankName:      bank.BankName,
		AccountNumber: bank.AccountNumber,
		AccountName:   bank.AccountName,
		IsActive:      bank.IsActive,
		IsPrimary:     bank.IsPrimary,
		CreatedAt:     bank.CreatedAt,
		UpdatedAt:     bank.UpdatedAt,
	}, nil
}

func (s *tenantBankService) UpdateTenantBank(ctx context.Context, req dto_tenant_bank.UpdateTenantBankRequest) (*dto_tenant_bank.TenantBankResponse, error) {
	existing, err := s.repo.FindByID(ctx, req.ID)
	if err != nil || existing == nil {
		return nil, errors.New("rekening bank tidak ditemukan")
	}

	if req.BankName != nil {
		existing.BankName = *req.BankName
	}
	if req.AccountNumber != nil {
		existing.AccountNumber = *req.AccountNumber
	}
	if req.AccountName != nil {
		existing.AccountName = *req.AccountName
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}
	if req.IsPrimary != nil {
		existing.IsPrimary = *req.IsPrimary
	}

	err = s.repo.Update(ctx, existing)
	if err != nil {
		return nil, err
	}

	if req.IsPrimary != nil && *req.IsPrimary {
		_ = s.repo.SetPrimary(ctx, existing.ProfileID, existing.ID)
		existing.IsPrimary = true
	}

	return &dto_tenant_bank.TenantBankResponse{
		ID:            existing.ID,
		ProfileID:     existing.ProfileID,
		BankName:      existing.BankName,
		AccountNumber: existing.AccountNumber,
		AccountName:   existing.AccountName,
		IsActive:      existing.IsActive,
		IsPrimary:     existing.IsPrimary,
		CreatedAt:     existing.CreatedAt,
		UpdatedAt:     existing.UpdatedAt,
	}, nil
}

func (s *tenantBankService) DeleteTenantBank(ctx context.Context, id string) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil || existing == nil {
		return errors.New("rekening bank tidak ditemukan")
	}
	return s.repo.Delete(ctx, id)
}

func (s *tenantBankService) SetPrimaryBank(ctx context.Context, profileID string, id string) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil || existing == nil {
		return errors.New("rekening bank tidak ditemukan")
	}
	return s.repo.SetPrimary(ctx, profileID, id)
}
