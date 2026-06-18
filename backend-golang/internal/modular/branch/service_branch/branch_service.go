package service_branch

import (
	"context"
	"errors"

	"backend-golang/internal/modular/branch/dto_branch"
	"backend-golang/internal/modular/branch/model_branch"
	"backend-golang/internal/modular/branch/repository_branch"
)

type BranchService interface {
	GetBranchByID(ctx context.Context, id string) (*dto_branch.BranchResponse, error)
	GetBranchesByTenant(ctx context.Context, tenantID string) ([]dto_branch.BranchResponse, error)
	CreateBranch(ctx context.Context, req dto_branch.CreateBranchRequest) (*dto_branch.BranchResponse, error)
	UpdateBranch(ctx context.Context, id string, req dto_branch.UpdateBranchRequest) (*dto_branch.BranchResponse, error)
	DeleteBranch(ctx context.Context, id string) error
	ResolveTenantID(ctx context.Context, userID string) (string, error)
}

type branchService struct {
	repo repository_branch.BranchRepository
}

func NewBranchService(repo repository_branch.BranchRepository) BranchService {
	return &branchService{repo: repo}
}

func (s *branchService) GetBranchByID(ctx context.Context, id string) (*dto_branch.BranchResponse, error) {
	b, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, errors.New("cabang tidak ditemukan")
	}

	staff, err := s.repo.GetStaffByBranchID(ctx, b.ID)
	if err != nil {
		return nil, err
	}

	txCount, err := s.repo.GetTransactionCountByBranchID(ctx, b.ID)
	if err != nil {
		return nil, err
	}

	return &dto_branch.BranchResponse{
		ID:          b.ID,
		TenantID:    b.TenantID,
		Name:        b.Name,
		Address:     b.Address,
		PhoneNumber: b.PhoneNumber,
		IsActive:    b.IsActive,
		CreatedAt:   b.CreatedAt,
		UpdatedAt:   b.UpdatedAt,
		PaymentQR:   b.PaymentQR,
		Staff:       staff,
		Count: dto_branch.BranchCountResponse{
			TransactionGroups: txCount,
		},
	}, nil
}

func (s *branchService) GetBranchesByTenant(ctx context.Context, tenantID string) ([]dto_branch.BranchResponse, error) {
	branches, err := s.repo.FindByTenantID(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	// Server-side auto-create default branch "Pusat" if empty
	if len(branches) == 0 {
		defaultBranch := &model_branch.Branch{
			TenantID: tenantID,
			Name:     "Pusat",
			IsActive: true,
		}
		err = s.repo.Create(ctx, defaultBranch, nil)
		if err != nil {
			return nil, err
		}
		branches = append(branches, *defaultBranch)
	}

	var resp []dto_branch.BranchResponse
	for _, b := range branches {
		staff, err := s.repo.GetStaffByBranchID(ctx, b.ID)
		if err != nil {
			return nil, err
		}

		txCount, err := s.repo.GetTransactionCountByBranchID(ctx, b.ID)
		if err != nil {
			return nil, err
		}

		resp = append(resp, dto_branch.BranchResponse{
			ID:          b.ID,
			TenantID:    b.TenantID,
			Name:        b.Name,
			Address:     b.Address,
			PhoneNumber: b.PhoneNumber,
			IsActive:    b.IsActive,
			CreatedAt:   b.CreatedAt,
			UpdatedAt:   b.UpdatedAt,
			PaymentQR:   b.PaymentQR,
			Staff:       staff,
			Count: dto_branch.BranchCountResponse{
				TransactionGroups: txCount,
			},
		})
	}

	return resp, nil
}

func (s *branchService) CreateBranch(ctx context.Context, req dto_branch.CreateBranchRequest) (*dto_branch.BranchResponse, error) {
	// Validasi pengelola
	if req.ManagerEmail != nil && *req.ManagerEmail != "" {
		if req.ManagerName == nil || *req.ManagerName == "" || req.ManagerPassword == nil || *req.ManagerPassword == "" {
			return nil, errors.New("nama dan password pengelola wajib dilengkapi")
		}

		exists, err := s.repo.CheckEmailExists(ctx, *req.ManagerEmail)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, errors.New("email pengelola sudah terdaftar di sistem")
		}
	}

	b := &model_branch.Branch{
		TenantID:    req.TenantID,
		Name:        req.Name,
		Address:     req.Address,
		PhoneNumber: req.PhoneNumber,
		IsActive:    true,
		PaymentQR:   req.PaymentQR,
	}

	err := s.repo.Create(ctx, b, &req)
	if err != nil {
		return nil, err
	}

	return &dto_branch.BranchResponse{
		ID:          b.ID,
		TenantID:    b.TenantID,
		Name:        b.Name,
		Address:     b.Address,
		PhoneNumber: b.PhoneNumber,
		IsActive:    b.IsActive,
		CreatedAt:   b.CreatedAt,
		UpdatedAt:   b.UpdatedAt,
		PaymentQR:   b.PaymentQR,
		Staff:       []dto_branch.BranchStaffResponse{},
		Count: dto_branch.BranchCountResponse{
			TransactionGroups: 0,
		},
	}, nil
}

func (s *branchService) UpdateBranch(ctx context.Context, id string, req dto_branch.UpdateBranchRequest) (*dto_branch.BranchResponse, error) {
	b, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, errors.New("cabang tidak ditemukan")
	}

	if req.Name != nil {
		b.Name = *req.Name
	}
	if req.Address != nil {
		b.Address = req.Address
	}
	if req.PhoneNumber != nil {
		b.PhoneNumber = req.PhoneNumber
	}
	if req.IsActive != nil {
		b.IsActive = *req.IsActive
	}
	if req.PaymentQR != nil {
		b.PaymentQR = req.PaymentQR
	}

	err = s.repo.Update(ctx, b)
	if err != nil {
		return nil, err
	}

	staff, err := s.repo.GetStaffByBranchID(ctx, b.ID)
	if err != nil {
		return nil, err
	}

	txCount, err := s.repo.GetTransactionCountByBranchID(ctx, b.ID)
	if err != nil {
		return nil, err
	}

	return &dto_branch.BranchResponse{
		ID:          b.ID,
		TenantID:    b.TenantID,
		Name:        b.Name,
		Address:     b.Address,
		PhoneNumber: b.PhoneNumber,
		IsActive:    b.IsActive,
		CreatedAt:   b.CreatedAt,
		UpdatedAt:   b.UpdatedAt,
		PaymentQR:   b.PaymentQR,
		Staff:       staff,
		Count: dto_branch.BranchCountResponse{
			TransactionGroups: txCount,
		},
	}, nil
}

func (s *branchService) DeleteBranch(ctx context.Context, id string) error {
	b, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if b == nil {
		return errors.New("cabang tidak ditemukan")
	}

	return s.repo.Delete(ctx, id)
}

func (s *branchService) ResolveTenantID(ctx context.Context, userID string) (string, error) {
	return s.repo.ResolveTenantID(ctx, userID)
}

