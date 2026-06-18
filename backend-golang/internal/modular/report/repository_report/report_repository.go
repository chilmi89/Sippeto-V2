package repository_report

import (
	"context"
	"time"

	"github.com/uptrace/bun"
)

type TransactionRow struct {
	TransactionDate time.Time
	TotalIncome     float64
	TotalExpense    float64
	NetBalance      float64
}

type ReportRepository interface {
	GetTenantOwnerID(ctx context.Context, userID string) (string, *string, error) // Returns tenantOwnerID, branchID, error
	GetTransactions(ctx context.Context, tenantOwnerID, branchID, dateStart, dateEnd string) ([]TransactionRow, error)
}

type reportRepository struct {
	db *bun.DB
}

func NewReportRepository(db *bun.DB) ReportRepository {
	return &reportRepository{db: db}
}

func (r *reportRepository) GetTenantOwnerID(ctx context.Context, userID string) (string, *string, error) {
	var branchID *string
	queryProfile := `SELECT branch_id FROM profiles WHERE id = ?`
	err := r.db.NewRaw(queryProfile, userID).Scan(ctx, &branchID)
	if err != nil {
		return "", nil, err
	}

	if branchID != nil && *branchID != "" {
		var tenantID string
		queryBranch := `SELECT tenant_id FROM branches WHERE id = ?`
		err = r.db.NewRaw(queryBranch, *branchID).Scan(ctx, &tenantID)
		if err != nil {
			return "", nil, err
		}
		return tenantID, branchID, nil
	}

	return userID, nil, nil
}

func (r *reportRepository) GetTransactions(ctx context.Context, tenantOwnerID, branchID, dateStart, dateEnd string) ([]TransactionRow, error) {
	whereClause := " WHERE profile_id = ?"
	args := []interface{}{tenantOwnerID}

	if branchID != "" && branchID != "all" {
		whereClause += " AND branch_id = ?"
		args = append(args, branchID)
	}

	if dateStart != "" {
		whereClause += " AND transaction_date >= ?"
		args = append(args, dateStart)
	}

	if dateEnd != "" {
		whereClause += " AND transaction_date <= ?"
		args = append(args, dateEnd)
	}

	query := `
		SELECT transaction_date::timestamp, COALESCE(total_income, 0), COALESCE(total_expense, 0), COALESCE(net_balance, 0)
		FROM transaction_groups
	` + whereClause + `
		ORDER BY transaction_date ASC
	`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []TransactionRow
	for rows.Next() {
		var t TransactionRow
		if err := rows.Scan(&t.TransactionDate, &t.TotalIncome, &t.TotalExpense, &t.NetBalance); err != nil {
			return nil, err
		}
		txs = append(txs, t)
	}
	return txs, nil
}
