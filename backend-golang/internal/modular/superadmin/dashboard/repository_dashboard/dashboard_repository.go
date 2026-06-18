package repository_dashboard

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"backend-golang/internal/modular/superadmin/dashboard/dto_dashboard"

	"github.com/uptrace/bun"
)

type DashboardRepository interface {
	GetDashboardStats(ctx context.Context) (*dto_dashboard.DashboardStatsResponse, error)
}

type dashboardRepository struct {
	db *bun.DB
}

func NewDashboardRepository(db *bun.DB) DashboardRepository {
	return &dashboardRepository{db: db}
}

type rawChartResult struct {
	Month    string
	MonthNum int
	Revenue  float64
	Profit   float64
}

type rawRecentTx struct {
	ID          string
	TotalIncome float64
	TenantName  string
	CreatedAt   time.Time
}

type rawRecentSignup struct {
	BusinessName sql.NullString
	FullName     sql.NullString
	CreatedAt    time.Time
}

func (r *dashboardRepository) GetDashboardStats(ctx context.Context) (*dto_dashboard.DashboardStatsResponse, error) {
	// 1. Get total & active tenants, total transactions, and financial sums
	var totalTenants int
	err := r.db.NewRaw(`SELECT COUNT(*) FROM profiles`).Scan(ctx, &totalTenants)
	if err != nil {
		return nil, err
	}

	var activeTenants int
	err = r.db.NewRaw(`SELECT COUNT(*) FROM profiles WHERE is_active = true`).Scan(ctx, &activeTenants)
	if err != nil {
		return nil, err
	}

	var totalTransactions int
	err = r.db.NewRaw(`SELECT COUNT(*) FROM transaction_groups`).Scan(ctx, &totalTransactions)
	if err != nil {
		return nil, err
	}

	var totalRevenue float64
	var totalExpense float64
	var totalProfit float64
	err = r.db.NewRaw(`
		SELECT COALESCE(SUM(total_income), 0), COALESCE(SUM(total_expense), 0), COALESCE(SUM(net_balance), 0)
		FROM transaction_groups
	`).Scan(ctx, &totalRevenue, &totalExpense, &totalProfit)
	if err != nil {
		return nil, err
	}

	// 2. Fetch Chart Data (revenue/profit in last 12 months)
	var chartRaw []rawChartResult
	chartQuery := `
		SELECT 
			TO_CHAR(transaction_date, 'Mon') as month,
			EXTRACT(MONTH FROM transaction_date) as month_num,
			COALESCE(SUM(total_income), 0) as revenue,
			COALESCE(SUM(net_balance), 0) as profit
		FROM transaction_groups
		WHERE transaction_date >= NOW() - INTERVAL '12 months'
		GROUP BY month, month_num
		ORDER BY month_num ASC
	`
	rows, err := r.db.QueryContext(ctx, chartQuery)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var c rawChartResult
			if err := rows.Scan(&c.Month, &c.MonthNum, &c.Revenue, &c.Profit); err == nil {
				chartRaw = append(chartRaw, c)
			}
		}
	}

	chartData := []dto_dashboard.ChartItem{}
	if len(chartRaw) >= 2 {
		for _, item := range chartRaw {
			chartData = append(chartData, dto_dashboard.ChartItem{
				Name:    item.Month,
				Revenue: item.Revenue,
				Profit:  item.Profit,
			})
		}
	} else {
		// Mock history data fallback like in original stats API route
		var realCurrent dto_dashboard.ChartItem
		if len(chartRaw) > 0 {
			realCurrent = dto_dashboard.ChartItem{
				Name:    chartRaw[0].Month,
				Revenue: chartRaw[0].Revenue,
				Profit:  chartRaw[0].Profit,
			}
		} else {
			realCurrent = dto_dashboard.ChartItem{Name: "Mar", Revenue: 4800000, Profit: 1100000}
		}

		chartData = []dto_dashboard.ChartItem{
			{Name: "Oct", Revenue: 2500000, Profit: 800000},
			{Name: "Nov", Revenue: 3200000, Profit: 1200000},
			{Name: "Dec", Revenue: 4800000, Profit: 1500000},
			{Name: "Jan", Revenue: 4100000, Profit: 1100000},
			{Name: "Feb", Revenue: 5200000, Profit: 1900000},
			realCurrent,
		}
	}

	// 3. Get Recent Transactions (max 3)
	var recentTxs []rawRecentTx
	txQuery := `
		SELECT tg.id, COALESCE(tg.total_income, 0), COALESCE(p.business_name, p.full_name, 'Guest Tenant') AS tenant_name, tg.created_at
		FROM transaction_groups tg
		LEFT JOIN profiles p ON tg.profile_id = p.id
		ORDER BY tg.created_at DESC
		LIMIT 3
	`
	rowsTx, err := r.db.QueryContext(ctx, txQuery)
	if err == nil {
		defer rowsTx.Close()
		for rowsTx.Next() {
			var t rawRecentTx
			if err := rowsTx.Scan(&t.ID, &t.TotalIncome, &t.TenantName, &t.CreatedAt); err == nil {
				recentTxs = append(recentTxs, t)
			}
		}
	}

	// 4. Get New Signups (max 2)
	var newSignups []rawRecentSignup
	signupQuery := `
		SELECT business_name, full_name, created_at
		FROM profiles
		ORDER BY created_at DESC
		LIMIT 2
	`
	rowsSignups, err := r.db.QueryContext(ctx, signupQuery)
	if err == nil {
		defer rowsSignups.Close()
		for rowsSignups.Next() {
			var s rawRecentSignup
			if err := rowsSignups.Scan(&s.BusinessName, &s.FullName, &s.CreatedAt); err == nil {
				newSignups = append(newSignups, s)
			}
		}
	}

	// 5. Combine activities
	var activities []dto_dashboard.ActivityItem
	for _, tx := range recentTxs {
		activities = append(activities, dto_dashboard.ActivityItem{
			ID:     "tx-" + tx.ID,
			User:   tx.TenantName,
			Action: fmt.Sprintf("Transaksi Baru Rp %.0f", tx.TotalIncome),
			Time:   "Baru saja",
			Type:   "order",
		})
	}
	for _, signup := range newSignups {
		name := "Partner Baru"
		if signup.BusinessName.Valid && signup.BusinessName.String != "" {
			name = signup.BusinessName.String
		} else if signup.FullName.Valid && signup.FullName.String != "" {
			name = signup.FullName.String
		}
		activities = append(activities, dto_dashboard.ActivityItem{
			ID:     "usr-" + name,
			User:   name,
			Action: "Bergabung dengan Ekosistem",
			Time:   "Baru saja",
			Type:   "user",
		})
	}

	// Slice to max 5 items
	if len(activities) > 5 {
		activities = activities[:5]
	}

	// 6. Build final response DTO
	resp := &dto_dashboard.DashboardStatsResponse{
		MainStats: []dto_dashboard.StatsData{
			{
				Label:  "Total Revenue",
				Value:  fmt.Sprintf("Rp %.1fM", totalRevenue/1000000.0),
				Growth: "+14.2%",
				Up:     true,
				Type:   "income",
			},
			{
				Label:  "Active Tenants",
				Value:  fmt.Sprintf("%d", activeTenants),
				Growth: "+8.5%",
				Up:     true,
				Type:   "active",
			},
			{
				Label:  "Total Transaksi",
				Value:  fmt.Sprintf("%d", totalTransactions),
				Growth: "+114",
				Up:     true,
				Type:   "order",
			},
			{
				Label:  "Net Profitability",
				Value:  fmt.Sprintf("Rp %.1fM", totalProfit/1000000.0),
				Growth: "+12.1%",
				Up:     true,
				Type:   "health",
			},
		},
		ChartData:  chartData,
		Activities: activities,
	}

	return resp, nil
}
