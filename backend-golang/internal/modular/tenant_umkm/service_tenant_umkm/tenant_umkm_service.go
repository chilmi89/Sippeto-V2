package service_tenant_umkm

import (
	"context"
	"fmt"
	"time"

	"backend-golang/internal/modular/tenant_umkm/dto_tenant_umkm"
	"backend-golang/internal/modular/tenant_umkm/repository_tenant_umkm"
)

type TenantUMKMService interface {
	GetTenantUMKM(ctx context.Context, userID string, branchID string, period string) (*dto_tenant_umkm.TenantUMKMResponse, error)
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

func (s *tenantUMKMService) GetTenantUMKM(ctx context.Context, userID string, branchID string, period string) (*dto_tenant_umkm.TenantUMKMResponse, error) {
	// 1. Ambil profil user
	profile, err := s.repo.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 2. Tentukan tenantOwnerId dan paksa filter branch jika user adalah staf cabang
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

	// 3. Rentang tanggal Jan 1 - Des 31 tahun ini
	loc, _ := time.LoadLocation("Asia/Jakarta")
	if loc == nil {
		loc = time.Local
	}

	now := time.Now().In(loc)
	currentYear := now.Year()
	startOfYear := time.Date(currentYear, time.January, 1, 0, 0, 0, 0, loc)
	endOfYear := time.Date(currentYear, time.December, 31, 23, 59, 59, 999999999, loc)

	txs, err := s.repo.GetTransactionsForYear(ctx, tenantOwnerID, forcedBranchID, startOfYear, endOfYear)
	if err != nil {
		return nil, err
	}

	// Data Tahunan (12 bulan)
	monthlyData := make([]struct {
		Pendapatan  float64
		Pengeluaran float64
		Saldo       float64
	}, 12)

	// Data Hari Ini (6 Slots: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	todayEnd := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, loc)
	todaySlots := make([]float64, 6)

	// Data Minggu Ini (7 Slots: Sen, Sel, Rab, Kam, Jum, Sab, Min)
	offset := int(now.Weekday()) - 1
	if offset < 0 {
		offset = 6
	}
	weekStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, -offset)
	weekEnd := weekStart.AddDate(0, 0, 7).Add(-1 * time.Nanosecond)
	weekSlots := make([]float64, 7)

	// Data Bulan Ini (Days in month)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	nextMonth := monthStart.AddDate(0, 1, 0)
	monthEnd := nextMonth.Add(-1 * time.Nanosecond)
	daysInMonth := nextMonth.AddDate(0, 0, -1).Day()
	monthSlots := make([]float64, daysInMonth)

	var totalHariIni float64
	var totalMingguIni float64
	var totalBulanIni float64

	for _, tx := range txs {
		txTime := tx.TransactionDate.In(loc)

		// 1. Year aggregation
		month := int(txTime.Month()) - 1
		if month >= 0 && month < 12 {
			monthlyData[month].Pendapatan += tx.TotalIncome
			monthlyData[month].Pengeluaran += tx.TotalExpense
			monthlyData[month].Saldo += tx.NetBalance
		}

		// 2. Hari Ini aggregation
		if !txTime.Before(todayStart) && !txTime.After(todayEnd) {
			slotIdx := txTime.Hour() / 4
			if slotIdx >= 0 && slotIdx < 6 {
				todaySlots[slotIdx] += tx.TotalIncome
			}
			totalHariIni += tx.TotalIncome
		}

		// 3. Minggu Ini aggregation
		if !txTime.Before(weekStart) && !txTime.After(weekEnd) {
			wd := int(txTime.Weekday()) - 1
			if wd < 0 {
				wd = 6
			}
			if wd >= 0 && wd < 7 {
				weekSlots[wd] += tx.TotalIncome
			}
			totalMingguIni += tx.TotalIncome
		}

		// 4. Bulan Ini aggregation
		if !txTime.Before(monthStart) && !txTime.After(monthEnd) {
			dIdx := txTime.Day() - 1
			if dIdx >= 0 && dIdx < daysInMonth {
				monthSlots[dIdx] += tx.TotalIncome
			}
			totalBulanIni += tx.TotalIncome
		}
	}

	// Formatter Slice Tahunan
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

	// Formatter Slice Hari Ini
	todayLabels := []string{"00:00", "04:00", "08:00", "12:00", "16:00", "20:00"}
	hariIniChart := make([]dto_tenant_umkm.PendapatanChartItem, 6)
	for i := 0; i < 6; i++ {
		hariIniChart[i] = dto_tenant_umkm.PendapatanChartItem{
			Name:       todayLabels[i],
			Pendapatan: todaySlots[i],
		}
	}

	// Formatter Slice Minggu Ini
	weekLabels := []string{"Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"}
	mingguIniChart := make([]dto_tenant_umkm.PendapatanChartItem, 7)
	for i := 0; i < 7; i++ {
		mingguIniChart[i] = dto_tenant_umkm.PendapatanChartItem{
			Name:       weekLabels[i],
			Pendapatan: weekSlots[i],
		}
	}

	// Formatter Slice Bulan Ini
	bulanIniChart := make([]dto_tenant_umkm.PendapatanChartItem, daysInMonth)
	for i := 0; i < daysInMonth; i++ {
		bulanIniChart[i] = dto_tenant_umkm.PendapatanChartItem{
			Name:       fmt.Sprintf("%d", i+1),
			Pendapatan: monthSlots[i],
		}
	}

	response := &dto_tenant_umkm.TenantUMKMResponse{
		Profile: *profile,
		Financials: dto_tenant_umkm.FinancialsResponse{
			Summary: dto_tenant_umkm.FinancialSummary{
				TotalPendapatan:  totalPendapatan,
				TotalPengeluaran: totalPengeluaran,
				TotalSaldo:       runningBalance,
				NetProfit:        totalPendapatan - totalPengeluaran,
				TotalHariIni:     totalHariIni,
				TotalMingguIni:   totalMingguIni,
				TotalBulanIni:    totalBulanIni,
			},
			Charts: dto_tenant_umkm.FinancialCharts{
				Saldo:       saldoChart,
				Pendapatan:  pendapatanChart,
				Pengeluaran: pengeluaranChart,
				LabaRugi:    labaRugiChart,
				HariIni:     hariIniChart,
				MingguIni:   mingguIniChart,
				BulanIni:    bulanIniChart,
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
