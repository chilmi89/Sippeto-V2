package service_dashboard

import (
	"context"

	"backend-golang/internal/modular/superadmin/dashboard/dto_dashboard"
	"backend-golang/internal/modular/superadmin/dashboard/repository_dashboard"
)

type DashboardService interface {
	GetDashboardStats(ctx context.Context) (*dto_dashboard.DashboardStatsResponse, error)
}

type dashboardService struct {
	repo repository_dashboard.DashboardRepository
}

func NewDashboardService(repo repository_dashboard.DashboardRepository) DashboardService {
	return &dashboardService{repo: repo}
}

func (s *dashboardService) GetDashboardStats(ctx context.Context) (*dto_dashboard.DashboardStatsResponse, error) {
	return s.repo.GetDashboardStats(ctx)
}
