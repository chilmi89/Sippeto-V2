package repository_notification

import (
	"context"

	"backend-golang/internal/modular/notification/dto_notification"

	"github.com/uptrace/bun"
)

type NotificationRepository interface {
	GetTenantOwnerID(ctx context.Context, userID string) (string, *string, error) // Returns tenantOwnerID, branchID, error
	GetNotifications(ctx context.Context, tenantOwnerID string, branchID *string) (*dto_notification.NotificationResponse, error)
}

type notificationRepository struct {
	db *bun.DB
}

func NewNotificationRepository(db *bun.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) GetTenantOwnerID(ctx context.Context, userID string) (string, *string, error) {
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

func (r *notificationRepository) GetNotifications(ctx context.Context, tenantOwnerID string, branchID *string) (*dto_notification.NotificationResponse, error) {
	var resp dto_notification.NotificationResponse

	// ─── 1. PENDING ORDERS COUNT & LIST ───
	whereOrder := " WHERE profile_id = ? AND status = 'PENDING'"
	argsOrder := []interface{}{tenantOwnerID}
	if branchID != nil && *branchID != "" {
		whereOrder += " AND branch_id = ?"
		argsOrder = append(argsOrder, *branchID)
	}

	// Count pending orders
	queryOrderCount := `SELECT COUNT(*) FROM orders` + whereOrder
	err := r.db.NewRaw(queryOrderCount, argsOrder...).Scan(ctx, &resp.PendingOrdersCount)
	if err != nil {
		resp.PendingOrdersCount = 0
	}

	// List pending orders (limit 5)
	queryOrderList := `
		SELECT id, reference_number, customer_name, total_price, created_at
		FROM orders
	` + whereOrder + `
		ORDER BY created_at DESC
		LIMIT 5
	`
	rowsOrders, err := r.db.QueryContext(ctx, queryOrderList, argsOrder...)
	if err == nil {
		defer rowsOrders.Close()
		for rowsOrders.Next() {
			var po dto_notification.PendingOrderMin
			if err := rowsOrders.Scan(&po.ID, &po.ReferenceNumber, &po.CustomerName, &po.TotalPrice, &po.CreatedAt); err == nil {
				resp.PendingOrders = append(resp.PendingOrders, po)
			}
		}
	}

	// ─── 2. LOW STOCK PRODUCTS COUNT & LIST ───
	whereStock := " WHERE p.profile_id = ? AND ps.stock < ps.min_stock AND p.is_active = true"
	argsStock := []interface{}{tenantOwnerID}
	if branchID != nil && *branchID != "" {
		whereStock += " AND ps.branch_id = ?"
		argsStock = append(argsStock, *branchID)
	}

	// Count low stock products
	queryStockCount := `
		SELECT COUNT(*)
		FROM product_stocks ps
		INNER JOIN products p ON ps.product_id = p.id
	` + whereStock
	err = r.db.NewRaw(queryStockCount, argsStock...).Scan(ctx, &resp.LowStockCount)
	if err != nil {
		resp.LowStockCount = 0
	}

	// List low stock products (limit 5)
	queryStockList := `
		SELECT p.id, p.name, ps.stock, ps.min_stock, b.name AS branch_name
		FROM product_stocks ps
		INNER JOIN products p ON ps.product_id = p.id
		LEFT JOIN branches b ON ps.branch_id = b.id
	` + whereStock + `
		ORDER BY ps.updated_at DESC
		LIMIT 5
	`
	rowsStocks, err := r.db.QueryContext(ctx, queryStockList, argsStock...)
	if err == nil {
		defer rowsStocks.Close()
		for rowsStocks.Next() {
			var ls dto_notification.LowStockProductMin
			if err := rowsStocks.Scan(&ls.ID, &ls.Name, &ls.Stock, &ls.MinStock, &ls.BranchName); err == nil {
				resp.LowStockProducts = append(resp.LowStockProducts, ls)
			}
		}
	}

	// Total count
	resp.TotalCount = resp.PendingOrdersCount + resp.LowStockCount

	// Inisialisasi array kosong agar tidak null di JSON response
	if resp.PendingOrders == nil {
		resp.PendingOrders = []dto_notification.PendingOrderMin{}
	}
	if resp.LowStockProducts == nil {
		resp.LowStockProducts = []dto_notification.LowStockProductMin{}
	}

	return &resp, nil
}
