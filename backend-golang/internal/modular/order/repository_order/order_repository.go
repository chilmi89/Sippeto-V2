package repository_order

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"backend-golang/internal/modular/order/dto_order"

	"github.com/uptrace/bun"
)

type OrderRepository interface {
	GetTenantOwnerID(ctx context.Context, userID string) (string, *string, error) // Returns tenantOwnerID, branchID, error
	GetOrders(ctx context.Context, q dto_order.GetOrdersQuery) ([]dto_order.OrderResponse, int, error)
	UpdateOrderStatus(ctx context.Context, id, status, tenantOwnerID string) error
	CreateOrder(ctx context.Context, req dto_order.CheckoutRequest) (*dto_order.OrderResponse, error)
}

type orderRepository struct {
	db *bun.DB
}

func NewOrderRepository(db *bun.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) GetTenantOwnerID(ctx context.Context, userID string) (string, *string, error) {
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

func (r *orderRepository) GetOrders(ctx context.Context, q dto_order.GetOrdersQuery) ([]dto_order.OrderResponse, int, error) {
	// Count total
	countArgs := []interface{}{q.ProfileID}
	countWhere := "WHERE o.profile_id = ?"
	if q.Search != "" {
		countWhere += " AND (o.reference_number ILIKE ? OR o.customer_name ILIKE ? OR o.customer_phone ILIKE ?)"
		searchPattern := "%" + q.Search + "%"
		countArgs = append(countArgs, searchPattern, searchPattern, searchPattern)
	}
	if q.Status != "" && q.Status != "ALL" {
		countWhere += " AND o.status = ?"
		countArgs = append(countArgs, q.Status)
	}
	var total int
	countQuery := "SELECT COUNT(*) FROM orders o " + countWhere
	err := r.db.NewRaw(countQuery, countArgs...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	// Paginated query
	offset := (q.Page - 1) * q.Limit
	dataArgs := []interface{}{q.ProfileID}
	dataWhere := "WHERE o.profile_id = ?"
	if q.Search != "" {
		dataWhere += " AND (o.reference_number ILIKE ? OR o.customer_name ILIKE ? OR o.customer_phone ILIKE ?)"
		searchPattern := "%" + q.Search + "%"
		dataArgs = append(dataArgs, searchPattern, searchPattern, searchPattern)
	}
	if q.Status != "" && q.Status != "ALL" {
		dataWhere += " AND o.status = ?"
		dataArgs = append(dataArgs, q.Status)
	}

	queryOrders := `
		SELECT o.id, o.profile_id, o.branch_id, o.reference_number, o.customer_name, o.customer_phone,
		       o.customer_address, o.payment_method, o.total_price, o.status, o.created_at, o.updated_at,
		       b.name AS branch_name
		FROM orders o
		LEFT JOIN branches b ON o.branch_id = b.id
		` + dataWhere + `
		ORDER BY o.created_at DESC
		LIMIT ? OFFSET ?
	`
	dataArgs = append(dataArgs, q.Limit, offset)
	rows, err := r.db.QueryContext(ctx, queryOrders, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orders []dto_order.OrderResponse
	for rows.Next() {
		var o dto_order.OrderResponse
		err := rows.Scan(&o.ID, &o.ProfileID, &o.BranchID, &o.ReferenceNumber, &o.CustomerName, &o.CustomerPhone,
			&o.CustomerAddress, &o.PaymentMethod, &o.TotalPrice, &o.Status, &o.CreatedAt, &o.UpdatedAt, &o.BranchName)
		if err != nil {
			return nil, 0, err
		}

		o.OrderItems, err = r.getOrderItems(ctx, o.ID)
		if err != nil {
			return nil, 0, err
		}

		orders = append(orders, o)
	}

	return orders, total, nil
}

func (r *orderRepository) getOrderItems(ctx context.Context, orderID string) ([]dto_order.OrderItemResponse, error) {
	queryItems := `
		SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price, oi.created_at, p.name AS product_name
		FROM order_items oi
		LEFT JOIN products p ON oi.product_id = p.id
		WHERE oi.order_id = ?
		ORDER BY oi.created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, queryItems, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_order.OrderItemResponse
	for rows.Next() {
		var it dto_order.OrderItemResponse
		err := rows.Scan(&it.ID, &it.OrderID, &it.ProductID, &it.Quantity, &it.Price, &it.CreatedAt, &it.ProductName)
		if err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, nil
}

type tempOrderItem struct {
	ProductID *string
	Quantity  int
	Price     float64
	Name      *string
}

func (r *orderRepository) UpdateOrderStatus(ctx context.Context, id, status, tenantOwnerID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Ambil data order
	var order struct {
		ID              string
		ProfileID       *string
		BranchID        *string
		ReferenceNumber string
		CustomerName    string
		CustomerPhone   string
		CustomerAddress *string
		PaymentMethod   string
		TotalPrice      float64
		Status          string
	}

	queryOrder := `
		SELECT id, profile_id, branch_id, reference_number, customer_name, customer_phone, customer_address, payment_method, total_price, status
		FROM orders
		WHERE id = ?
	`
	err = tx.NewRaw(queryOrder, id).Scan(ctx, &order.ID, &order.ProfileID, &order.BranchID, &order.ReferenceNumber,
		&order.CustomerName, &order.CustomerPhone, &order.CustomerAddress, &order.PaymentMethod, &order.TotalPrice, &order.Status)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("pesanan tidak ditemukan")
		}
		return err
	}

	if order.Status != "PENDING" {
		return errors.New("pesanan sudah diproses sebelumnya")
	}

	// 2. Tentukan targetBranchID
	var targetBranchID *string
	if order.BranchID != nil && *order.BranchID != "" {
		targetBranchID = order.BranchID
	} else {
		// Cari cabang default (nama mengandung "utama" atau "pusat", atau default ke cabang pertama)
		var bID string
		queryBranchSearch := `
			SELECT id FROM branches
			WHERE tenant_id = ?
			ORDER BY CASE WHEN name ILIKE '%%utama%%' OR name ILIKE '%%pusat%%' THEN 0 ELSE 1 END ASC, created_at ASC
			LIMIT 1
		`
		err = tx.NewRaw(queryBranchSearch, tenantOwnerID).Scan(ctx, &bID)
		if err == nil && bID != "" {
			targetBranchID = &bID
		}
	}

	// 3. Ambil order_items
	var items []tempOrderItem
	queryItems := `
		SELECT oi.product_id, oi.quantity, oi.price, p.name
		FROM order_items oi
		LEFT JOIN products p ON oi.product_id = p.id
		WHERE oi.order_id = ?
	`
	rows, err := tx.QueryContext(ctx, queryItems, id)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var it tempOrderItem
		if err := rows.Scan(&it.ProductID, &it.Quantity, &it.Price, &it.Name); err == nil {
			items = append(items, it)
		}
	}

	// Jika status diubah menjadi SUCCESS (lunas)
	if status == "SUCCESS" {
		// A. Potong Stok & Mutasi
		if targetBranchID != nil && *targetBranchID != "" {
			for _, item := range items {
				if item.ProductID != nil && *item.ProductID != "" {
					var stockID string
					queryStock := `SELECT id FROM product_stocks WHERE product_id = ? AND branch_id = ?`
					err = tx.NewRaw(queryStock, *item.ProductID, *targetBranchID).Scan(ctx, &stockID)

					if err == nil && stockID != "" {
						// Update stok
						_, err = tx.NewRaw(`UPDATE product_stocks SET stock = stock - ? WHERE id = ?`, item.Quantity, stockID).Exec(ctx)
						if err != nil {
							return err
						}
					} else {
						// Buat stok baru (bisa minus)
						_, err = tx.NewRaw(`INSERT INTO product_stocks (product_id, branch_id, stock, min_stock, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())`,
							*item.ProductID, *targetBranchID, -item.Quantity).Exec(ctx)
						if err != nil {
							return err
						}
					}

					// Buat log mutasi stok
					notes := fmt.Sprintf("Penyelesaian Pesanan E-Catalog - Ref: %s", order.ReferenceNumber)
					mutationID := generateUUID()
					insertMutation := `
						INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at)
						VALUES (?, ?, ?, NULL, ?, 'SALE', ?, NOW())
					`
					_, err = tx.NewRaw(insertMutation, mutationID, *item.ProductID, *targetBranchID, item.Quantity, notes).Exec(ctx)
					if err != nil {
						return err
					}
				}
			}
		}

		// B. Catat Transaksi Keuangan
		// 1) Cari Kategori Income ("Penjualan Produk" atau yang bertipe INCOME)
		var catID string
		queryCat := `SELECT id FROM categories WHERE profile_id = ? AND type = 'INCOME' AND name = 'Penjualan Produk' LIMIT 1`
		err = tx.NewRaw(queryCat, tenantOwnerID).Scan(ctx, &catID)
		if err != nil || catID == "" {
			// fallback 1
			queryCatFallback := `SELECT id FROM categories WHERE profile_id = ? AND type = 'INCOME' LIMIT 1`
			tx.NewRaw(queryCatFallback, tenantOwnerID).Scan(ctx, &catID)
		}

		if catID == "" {
			// Buat kategori baru
			queryCreateCat := `
				INSERT INTO categories (profile_id, name, type, created_at)
				VALUES (?, 'Penjualan E-Catalog', 'INCOME', NOW())
				RETURNING id
			`
			err = tx.NewRaw(queryCreateCat, tenantOwnerID).Scan(ctx, &catID)
			if err != nil {
				return err
			}
		}

		// 2) Cari Metode Pembayaran
		isTransfer := strings.Contains(strings.ToLower(order.PaymentMethod), "transfer")
		matchName := "tunai"
		if isTransfer {
			matchName = "transfer"
		}

		var pmID string
		queryPM := `SELECT id FROM payment_methods WHERE profile_id = ? AND name ILIKE ? LIMIT 1`
		err = tx.NewRaw(queryPM, tenantOwnerID, "%"+matchName+"%").Scan(ctx, &pmID)
		if err != nil || pmID == "" {
			// fallback 1
			queryPMFallback := `SELECT id FROM payment_methods WHERE profile_id = ? LIMIT 1`
			tx.NewRaw(queryPMFallback, tenantOwnerID).Scan(ctx, &pmID)
		}

		if pmID == "" {
			// Buat metode pembayaran baru
			newName := "Tunai / Cash"
			if isTransfer {
				newName = "Transfer Bank"
			}
			queryCreatePM := `
				INSERT INTO payment_methods (profile_id, name, is_active, created_at)
				VALUES (?, ?, true, NOW())
				RETURNING id
			`
			err = tx.NewRaw(queryCreatePM, tenantOwnerID, newName).Scan(ctx, &pmID)
			if err != nil {
				return err
			}
		}

		// 3) Buat record transaction_group
		groupID := generateUUID()
		desc := fmt.Sprintf("Penjualan dari E-Catalog via Order Ref: %s", order.ReferenceNumber)
		insertGroupQuery := `
			INSERT INTO transaction_groups (
				id, profile_id, branch_id, reference_number, transaction_date, description,
				total_income, total_expense, net_balance, customer_name, customer_phone, customer_address,
				order_status, created_at, updated_at
			) VALUES (?, ?, ?, ?, NOW(), ?, ?, 0, ?, ?, ?, ?, 6, NOW(), NOW())
			RETURNING id
		`
		err = tx.NewRaw(insertGroupQuery, groupID, tenantOwnerID, targetBranchID, order.ReferenceNumber, desc,
			order.TotalPrice, order.TotalPrice, order.CustomerName, order.CustomerPhone, order.CustomerAddress).
			Scan(ctx, &groupID)
		if err != nil {
			return err
		}

		// 4) Buat detail transaction_items
		for _, it := range items {
			prodName := "Produk E-Catalog"
			if it.Name != nil && *it.Name != "" {
				prodName = *it.Name
			}

			itemID := generateUUID()
			insertItemQuery := `
				INSERT INTO transaction_items (
					id, group_id, category_id, payment_method_id, type, name, amount, product_id, quantity, created_at
				) VALUES (?, ?, ?, ?, 'INCOME', ?, ?, ?, ?, NOW())
			`
			_, err = tx.NewRaw(insertItemQuery, itemID, groupID, catID, pmID, prodName, it.Price, it.ProductID, it.Quantity).Exec(ctx)
			if err != nil {
				return err
			}
		}
	}

	// C. Update status pesanan
	_, err = tx.NewRaw(`UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?`, status, id).Exec(ctx)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *orderRepository) CreateOrder(ctx context.Context, req dto_order.CheckoutRequest) (*dto_order.OrderResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Generate reference number unik (ORD-YYMMDD-RAND)
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 4)
	for i := range b {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return nil, err
		}
		b[i] = charset[num.Int64()]
	}
	dateStr := time.Now().Format("060102") // YYMMDD
	refNum := fmt.Sprintf("ORD-%s-%s", dateStr, string(b))

	// 2. Tentukan branchID
	var branchID *string
	if req.BranchID != "" && req.BranchID != "pusat" {
		branchID = &req.BranchID
	}

	// 3. Simpan Order
	var orderID string
	queryOrder := `
		INSERT INTO orders (
			profile_id, branch_id, reference_number, customer_name, customer_phone, 
			customer_address, payment_method, total_price, status, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err = tx.NewRaw(queryOrder, req.ProfileID, branchID, refNum, req.CustomerName, req.CustomerPhone,
		sql.NullString{String: req.CustomerAddress, Valid: req.CustomerAddress != ""},
		req.PaymentMethod, req.TotalPrice).Scan(ctx, &orderID, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	// 4. Simpan Order Items
	var orderItems []dto_order.OrderItemResponse
	for _, item := range req.Items {
		var itemID string
		var itemCreatedAt time.Time
		queryItem := `
			INSERT INTO order_items (
				order_id, product_id, quantity, price, created_at
			) VALUES (?, ?, ?, ?, NOW())
			RETURNING id, created_at
		`
		err = tx.NewRaw(queryItem, orderID, item.ProductID, item.Quantity, item.Price).Scan(ctx, &itemID, &itemCreatedAt)
		if err != nil {
			return nil, err
		}

		// Cari product name
		var productName string
		tx.NewRaw("SELECT name FROM products WHERE id = ?", item.ProductID).Scan(ctx, &productName)

		orderItems = append(orderItems, dto_order.OrderItemResponse{
			ID:          itemID,
			OrderID:     orderID,
			ProductID:   &item.ProductID,
			Quantity:    item.Quantity,
			Price:       item.Price,
			CreatedAt:   itemCreatedAt,
			ProductName: &productName,
		})
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	// Buat response
	return &dto_order.OrderResponse{
		ID:              orderID,
		ProfileID:       &req.ProfileID,
		BranchID:        branchID,
		ReferenceNumber: refNum,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: &req.CustomerAddress,
		PaymentMethod:   req.PaymentMethod,
		TotalPrice:      req.TotalPrice,
		Status:          "PENDING",
		CreatedAt:       createdAt,
		UpdatedAt:       updatedAt,
		OrderItems:      orderItems,
	}, nil
}

func generateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return ""
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

