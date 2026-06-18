package service_tenant_umkm

import (
	"context"
	"time"

	"backend-golang/internal/modular/tenant_umkm/dto_tenant_umkm"
	"backend-golang/internal/modular/tenant_umkm/repository_tenant_umkm"
)

type TenantUMKMService interface {
	GetTenantUMKM(ctx context.Context, userID string, branchID string) (*dto_tenant_umkm.TenantUMKMResponse, error)
	UpdateTenantUMKM(ctx context.Context, userID string, req dto_tenant_umkm.UpdateTenantUMKMRequest) (*dto_tenant_umkm.UpdateTenantUMKMResponse, error)
	GetPublicStorefront(ctx context.Context, username string) (*dto_tenant_umkm.PublicStorefrontResponse, error)
	CreateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error)
	UpdateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error)
}

type tenantUMKMService struct {
	repo repository_tenant_umkm.TenantUMKMRepository
}

func NewTenantUMKMService(repo repository_tenant_umkm.TenantUMKMRepository) TenantUMKMService {
	return &tenantUMKMService{repo: repo}
}

var MONTH_LABELS = []string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"}

func (s *tenantUMKMService) GetTenantUMKM(ctx context.Context, userID string, branchID string) (*dto_tenant_umkm.TenantUMKMResponse, error) {
	// 1. Ambil profil user
	profile, err := s.repo.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 2. Tentukan tenantOwnerId dan paksa filter branch jika user adalah staf cabang (memiliki branch_id)
	tenantOwnerID := profile.ID
	forcedBranchID := branchID

	if profile.BranchID != nil && *profile.BranchID != "" {
		ownerID, err := s.repo.GetBranchTenantOwner(ctx, *profile.BranchID)
		if err == nil && ownerID != "" {
			tenantOwnerID = ownerID
		}
		forcedBranchID = *profile.BranchID
	}
	profile.TenantOwnerID = tenantOwnerID

	// 3. Ambil data transaksi setahun penuh (Jan 1 - Des 31 tahun saat ini)
	currentYear := time.Now().Year()
	loc, _ := time.LoadLocation("Asia/Jakarta")
	if loc == nil {
		loc = time.Local
	}
	startOfYear := time.Date(currentYear, time.January, 1, 0, 0, 0, 0, loc)
	endOfYear := time.Date(currentYear, time.December, 31, 23, 59, 59, 999999999, loc)

	txs, err := s.repo.GetTransactionsForYear(ctx, tenantOwnerID, forcedBranchID, startOfYear, endOfYear)
	if err != nil {
		return nil, err
	}

	// 4. Inisialisasi map/slice bulanan
	monthlyData := make([]struct {
		Pendapatan  float64
		Pengeluaran float64
		Saldo       float64
	}, 12)

	for _, tx := range txs {
		month := int(tx.TransactionDate.In(loc).Month()) - 1 // 0-indexed
		if month >= 0 && month < 12 {
			monthlyData[month].Pendapatan += tx.TotalIncome
			monthlyData[month].Pengeluaran += tx.TotalExpense
			monthlyData[month].Saldo += tx.NetBalance
		}
	}

	// 5. Saldo akumulatif (running total) & mapping chart
	var runningBalance float64
	saldoChart := make([]dto_tenant_umkm.SaldoChartItem, 12)
	pendapatanChart := make([]dto_tenant_umkm.PendapatanChartItem, 12)
	pengeluaranChart := make([]dto_tenant_umkm.PengeluaranChartItem, 12)
	labaRugiChart := make([]dto_tenant_umkm.LabaRugiChartItem, 12)

	var totalPendapatan float64
	var totalPengeluaran float64

	for i := 0; i < 12; i++ {
		runningBalance += monthlyData[i].Saldo
		name := MONTH_LABELS[i]

		saldoChart[i] = dto_tenant_umkm.SaldoChartItem{
			Name:  name,
			Saldo: runningBalance,
		}

		pendapatanChart[i] = dto_tenant_umkm.PendapatanChartItem{
			Name:       name,
			Pendapatan: monthlyData[i].Pendapatan,
		}

		pengeluaranChart[i] = dto_tenant_umkm.PengeluaranChartItem{
			Name:        name,
			Pengeluaran: monthlyData[i].Pengeluaran,
		}

		labaRugiChart[i] = dto_tenant_umkm.LabaRugiChartItem{
			Name:   name,
			Untung: monthlyData[i].Pendapatan,
			Rugi:   monthlyData[i].Pengeluaran,
		}

		totalPendapatan += monthlyData[i].Pendapatan
		totalPengeluaran += monthlyData[i].Pengeluaran
	}

	totalSaldo := runningBalance

	response := &dto_tenant_umkm.TenantUMKMResponse{
		Profile: *profile,
		Financials: dto_tenant_umkm.FinancialsResponse{
			Summary: dto_tenant_umkm.FinancialSummary{
				TotalPendapatan:  totalPendapatan,
				TotalPengeluaran: totalPengeluaran,
				TotalSaldo:       totalSaldo,
				NetProfit:        totalPendapatan - totalPengeluaran,
			},
			Charts: dto_tenant_umkm.FinancialCharts{
				Saldo:       saldoChart,
				Pendapatan:  pendapatanChart,
				Pengeluaran: pengeluaranChart,
				LabaRugi:    labaRugiChart,
			},
		},
	}

	return response, nil
}

func (s *tenantUMKMService) UpdateTenantUMKM(ctx context.Context, userID string, req dto_tenant_umkm.UpdateTenantUMKMRequest) (*dto_tenant_umkm.UpdateTenantUMKMResponse, error) {
	return s.repo.UpdateProfile(ctx, userID, req)
}

func (s *tenantUMKMService) GetPublicStorefront(ctx context.Context, username string) (*dto_tenant_umkm.PublicStorefrontResponse, error) {
	profile, err := s.repo.GetProfileByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	products, err := s.repo.GetPublicProducts(ctx, profile.ID)
	if err != nil {
		return nil, err
	}

	branches, err := s.repo.GetPublicBranches(ctx, profile.ID)
	if err != nil {
		return nil, err
	}

	return &dto_tenant_umkm.PublicStorefrontResponse{
		Profile:  *profile,
		Products: products,
		Branches: branches,
	}, nil
}

func (s *tenantUMKMService) CreateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error) {
	return s.repo.CreateRegisterUMKM(ctx, req)
}

func (s *tenantUMKMService) UpdateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error) {
	return s.repo.UpdateRegisterUMKM(ctx, req)
}
