package service_report

import (
	"context"
	"fmt"
	"sort"
	"time"

	"backend-golang/internal/modular/report/dto_report"
	"backend-golang/internal/modular/report/repository_report"
)

type ReportService interface {
	GetReport(ctx context.Context, userID, branchID, reportType, dateStart, dateEnd string) (*dto_report.ReportResponse, error)
}

type reportService struct {
	repo repository_report.ReportRepository
}

func NewReportService(repo repository_report.ReportRepository) ReportService {
	return &reportService{repo: repo}
}

func getPeriodKey(t time.Time, reportType string) string {
	loc, _ := time.LoadLocation("Asia/Jakarta")
	if loc == nil {
		loc = time.Local
	}
	t = t.In(loc)

	switch reportType {
	case "daily":
		return t.Format("2006-01-02")
	case "weekly":
		year, week := t.ISOWeek()
		return fmt.Sprintf("%04d-W%02d", year, week)
	case "monthly":
		return t.Format("2006-01")
	case "yearly":
		return t.Format("2006")
	default:
		return t.Format("2006-01-02")
	}
}

func (s *reportService) GetReport(ctx context.Context, userID, branchID, reportType, dateStart, dateEnd string) (*dto_report.ReportResponse, error) {
	tenantOwnerID, forceBranchID, err := s.repo.GetTenantOwnerID(ctx, userID)
	if err != nil {
		return nil, err
	}

	activeBranchID := ""
	if forceBranchID != nil && *forceBranchID != "" {
		activeBranchID = *forceBranchID
	} else if branchID != "all" {
		activeBranchID = branchID
	}

	txs, err := s.repo.GetTransactions(ctx, tenantOwnerID, activeBranchID, dateStart, dateEnd)
	if err != nil {
		return nil, err
	}

	// Grouping map
	groupedMap := make(map[string]*dto_report.ReportItem)

	// Pre-fill
	loc, _ := time.LoadLocation("Asia/Jakarta")
	if loc == nil {
		loc = time.Local
	}
	now := time.Now().In(loc)

	switch reportType {
	case "daily":
		// Pre-fill 7 hari terakhir
		for i := 6; i >= 0; i-- {
			d := now.AddDate(0, 0, -i)
			period := getPeriodKey(d, reportType)
			groupedMap[period] = &dto_report.ReportItem{Period: period}
		}
	case "weekly":
		// Pre-fill 5 minggu terakhir
		for i := 4; i >= 0; i-- {
			d := now.AddDate(0, 0, -(i * 7))
			period := getPeriodKey(d, reportType)
			groupedMap[period] = &dto_report.ReportItem{Period: period}
		}
	case "monthly":
		// Pre-fill 12 bulan tahun ini
		year := now.Year()
		for i := 1; i <= 12; i++ {
			d := time.Date(year, time.Month(i), 1, 0, 0, 0, 0, loc)
			period := getPeriodKey(d, reportType)
			groupedMap[period] = &dto_report.ReportItem{Period: period}
		}
	case "yearly":
		// Pre-fill 5 tahun terakhir
		year := now.Year()
		for i := 4; i >= 0; i-- {
			d := time.Date(year-i, 1, 1, 0, 0, 0, 0, loc)
			period := getPeriodKey(d, reportType)
			groupedMap[period] = &dto_report.ReportItem{Period: period}
		}
	}

	var summary dto_report.ReportSummary

	for _, tx := range txs {
		period := getPeriodKey(tx.TransactionDate, reportType)

		if _, exists := groupedMap[period]; !exists {
			groupedMap[period] = &dto_report.ReportItem{
				Period: period,
			}
		}

		groupedMap[period].TotalIncome += tx.TotalIncome
		groupedMap[period].TotalExpense += tx.TotalExpense
		groupedMap[period].NetBalance += tx.NetBalance

		summary.TotalIncome += tx.TotalIncome
		summary.TotalExpense += tx.TotalExpense
		summary.NetBalance += tx.NetBalance
	}

	// Ubah map ke slice & urutkan
	var reportData []dto_report.ReportItem
	for _, item := range groupedMap {
		reportData = append(reportData, *item)
	}

	sort.Slice(reportData, func(i, j int) bool {
		return reportData[i].Period < reportData[j].Period
	})

	return &dto_report.ReportResponse{
		Data:    reportData,
		Summary: summary,
		Type:    reportType,
	}, nil
}
