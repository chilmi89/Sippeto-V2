package service_tenant

import (
	"context"

	"backend-golang/internal/modular/superadmin/tenant/dto_tenant"
	"backend-golang/internal/modular/superadmin/tenant/repository_tenant"
)

type TenantService interface {
	GetTenants(ctx context.Context, page, limit int, search, status string) (*dto_tenant.TenantListResponse, error)
	UpdateTenant(ctx context.Context, req dto_tenant.UpdateTenantRequest) (*dto_tenant.TenantResponse, error)
}

type tenantService struct {
	repo repository_tenant.TenantRepository
}

func NewTenantService(repo repository_tenant.TenantRepository) TenantService {
	return &tenantService{repo: repo}
}

func (s *tenantService) GetTenants(ctx context.Context, page, limit int, search, status string) (*dto_tenant.TenantListResponse, error) {
	data, total, err := s.repo.FindTenants(ctx, page, limit, search, status)
	if err != nil {
		return nil, err
	}

	stats, err := s.repo.GetTenantStats(ctx)
	if err != nil {
		return nil, err
	}

	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return &dto_tenant.TenantListResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
		Stats:      stats,
	}, nil
}

func (s *tenantService) UpdateTenant(ctx context.Context, req dto_tenant.UpdateTenantRequest) (*dto_tenant.TenantResponse, error) {
	return s.repo.UpdateTenant(ctx, req)
}
