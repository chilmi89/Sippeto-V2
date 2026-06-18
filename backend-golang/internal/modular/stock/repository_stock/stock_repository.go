package repository_stock

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"math"
	"time"

	"backend-golang/internal/modular/stock/dto_stock"
	"backend-golang/internal/modular/stock/model_stock"

	"github.com/uptrace/bun"
)

type StockRepository interface {
	GetProfile(ctx context.Context, userID string) (*dto_stock.ProfileInfo, error)
	GetPermissions(ctx context.Context, userID string) ([]string, error)
	GetBranchTenantOwner(ctx context.Context, branchID string) (string, error)
	GetBranchesByTenant(ctx context.Context, tenantID string) ([]dto_stock.BranchInfo, error)
	CreateBranch(ctx context.Context, tenantID, name string) (*dto_stock.BranchInfo, error)
	GetProductsByTenant(ctx context.Context, tenantID string) ([]dto_stock.ProductInfo, error)
	GetProductStocksByTenant(ctx context.Context, tenantID string) ([]dto_stock.ProductStockResponse, error)
	GetProductStocksByBranch(ctx context.Context, branchID string) ([]dto_stock.ProductStockResponse, error)
	GetMutationsByTenant(ctx context.Context, tenantID string) ([]dto_stock.StockMutationResponse, error)
	GetMutationsByBranch(ctx context.Context, branchID string) ([]dto_stock.StockMutationResponse, error)
	
	AdjustStockTx(ctx context.Context, req dto_stock.UpdateStockRequest) error
	MultiAllocateStockTx(ctx context.Context, req dto_stock.UpdateStockRequest) error
	TransferStockTx(ctx context.Context, req dto_stock.UpdateStockRequest) (*model_stock.StockMutation, error)
}

type stockRepository struct {
	db *bun.DB
}

func NewStockRepository(db *bun.DB) StockRepository {
	return &stockRepository{db: db}
}

func (r *stockRepository) GetProfile(ctx context.Context, userID string) (*dto_stock.ProfileInfo, error) {
	profile := new(dto_stock.ProfileInfo)
	query := `
		SELECT p.id, p.full_name, p.business_name, p.email, p.phone_number, p.address, p.avatar_url, p.bio, p.is_active, p.branch_id, p.username,
		       COALESCE(r.name, '') AS user_role
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
		WHERE p.id = ?
	`
	err := r.db.NewRaw(query, userID).Scan(ctx, profile)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("profil tidak ditemukan")
		}
		return nil, err
	}
	return profile, nil
}

func (r *stockRepository) GetPermissions(ctx context.Context, userID string) ([]string, error) {
	var permissions []string
	query := `
		SELECT p.name
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		JOIN profiles pr ON pr.role_id = rp.role_id
		WHERE pr.id = ?
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		permissions = append(permissions, name)
	}
	return permissions, nil
}

func (r *stockRepository) GetBranchTenantOwner(ctx context.Context, branchID string) (string, error) {
	var tenantID string
	query := `SELECT tenant_id FROM branches WHERE id = ?`
	err := r.db.NewRaw(query, branchID).Scan(ctx, &tenantID)
	if err != nil {
		return "", err
	}
	return tenantID, nil
}

func (r *stockRepository) GetBranchesByTenant(ctx context.Context, tenantID string) ([]dto_stock.BranchInfo, error) {
	var branches []dto_stock.BranchInfo
	query := `
		SELECT id, name
		FROM branches
		WHERE tenant_id = ?
		ORDER BY name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var b dto_stock.BranchInfo
		if err := rows.Scan(&b.ID, &b.Name); err != nil {
			return nil, err
		}
		branches = append(branches, b)
	}
	return branches, nil
}

func (r *stockRepository) CreateBranch(ctx context.Context, tenantID, name string) (*dto_stock.BranchInfo, error) {
	id := generateUUID()
	query := `
		INSERT INTO branches (id, tenant_id, name)
		VALUES (?, ?, ?)
		RETURNING id, name
	`
	branch := new(dto_stock.BranchInfo)
	err := r.db.NewRaw(query, id, tenantID, name).Scan(ctx, branch)
	if err != nil {
		return nil, err
	}
	return branch, nil
}

func (r *stockRepository) GetProductsByTenant(ctx context.Context, tenantID string) ([]dto_stock.ProductInfo, error) {
	var products []dto_stock.ProductInfo
	query := `
		SELECT id, name
		FROM products
		WHERE profile_id = ?
		ORDER BY name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var p dto_stock.ProductInfo
		if err := rows.Scan(&p.ID, &p.Name); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *stockRepository) GetProductStocksByTenant(ctx context.Context, tenantID string) ([]dto_stock.ProductStockResponse, error) {
	var stocks []dto_stock.ProductStockResponse
	query := `
		SELECT ps.id, ps.product_id, ps.branch_id, ps.stock, ps.min_stock,
		       p.name AS product_name, p.sell_price AS product_sell_price,
		       b.name AS branch_name
		FROM product_stocks ps
		JOIN products p ON ps.product_id = p.id
		JOIN branches b ON ps.branch_id = b.id
		WHERE p.profile_id = ?
	`
	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s dto_stock.ProductStockResponse
		if err := rows.Scan(&s.ID, &s.ProductID, &s.BranchID, &s.Stock, &s.MinStock, &s.Products.Name, &s.Products.SellPrice, &s.Branches.Name); err != nil {
			return nil, err
		}
		stocks = append(stocks, s)
	}
	return stocks, nil
}

func (r *stockRepository) GetProductStocksByBranch(ctx context.Context, branchID string) ([]dto_stock.ProductStockResponse, error) {
	var stocks []dto_stock.ProductStockResponse
	query := `
		SELECT ps.id, ps.product_id, ps.branch_id, ps.stock, ps.min_stock,
		       p.name AS product_name, p.sell_price AS product_sell_price,
		       b.name AS branch_name
		FROM product_stocks ps
		JOIN products p ON ps.product_id = p.id
		JOIN branches b ON ps.branch_id = b.id
		WHERE ps.branch_id = ?
	`
	rows, err := r.db.QueryContext(ctx, query, branchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s dto_stock.ProductStockResponse
		if err := rows.Scan(&s.ID, &s.ProductID, &s.BranchID, &s.Stock, &s.MinStock, &s.Products.Name, &s.Products.SellPrice, &s.Branches.Name); err != nil {
			return nil, err
		}
		stocks = append(stocks, s)
	}
	return stocks, nil
}

func (r *stockRepository) GetMutationsByTenant(ctx context.Context, tenantID string) ([]dto_stock.StockMutationResponse, error) {
	var mutations []dto_stock.StockMutationResponse
	query := `
		SELECT sm.id, sm.product_id, sm.from_branch_id, sm.to_branch_id, sm.quantity, sm.type, sm.notes, sm.created_at,
		       p.name AS product_name,
		       fb.name AS from_branch_name,
		       tb.name AS to_branch_name
		FROM stock_mutations sm
		JOIN products p ON sm.product_id = p.id
		LEFT JOIN branches fb ON sm.from_branch_id = fb.id
		LEFT JOIN branches tb ON sm.to_branch_id = tb.id
		WHERE p.profile_id = ?
		ORDER BY sm.created_at DESC
		LIMIT 30
	`
	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var m dto_stock.StockMutationResponse
		var createdAt time.Time
		var fromBranchName, toBranchName sql.NullString

		err := rows.Scan(&m.ID, &m.ProductID, &m.FromBranchID, &m.ToBranchID, &m.Quantity, &m.Type, &m.Notes, &createdAt,
			&m.Products.Name, &fromBranchName, &toBranchName)
		if err != nil {
			return nil, err
		}

		m.CreatedAt = createdAt.Format(time.RFC3339)
		if fromBranchName.Valid {
			m.FromBranch = &dto_stock.BranchNameInfo{Name: fromBranchName.String}
		}
		if toBranchName.Valid {
			m.ToBranch = &dto_stock.BranchNameInfo{Name: toBranchName.String}
		}

		mutations = append(mutations, m)
	}
	return mutations, nil
}

func (r *stockRepository) GetMutationsByBranch(ctx context.Context, branchID string) ([]dto_stock.StockMutationResponse, error) {
	var mutations []dto_stock.StockMutationResponse
	query := `
		SELECT sm.id, sm.product_id, sm.from_branch_id, sm.to_branch_id, sm.quantity, sm.type, sm.notes, sm.created_at,
		       p.name AS product_name,
		       fb.name AS from_branch_name,
		       tb.name AS to_branch_name
		FROM stock_mutations sm
		JOIN products p ON sm.product_id = p.id
		LEFT JOIN branches fb ON sm.from_branch_id = fb.id
		LEFT JOIN branches tb ON sm.to_branch_id = tb.id
		WHERE sm.from_branch_id = ? OR sm.to_branch_id = ?
		ORDER BY sm.created_at DESC
		LIMIT 30
	`
	rows, err := r.db.QueryContext(ctx, query, branchID, branchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var m dto_stock.StockMutationResponse
		var createdAt time.Time
		var fromBranchName, toBranchName sql.NullString

		err := rows.Scan(&m.ID, &m.ProductID, &m.FromBranchID, &m.ToBranchID, &m.Quantity, &m.Type, &m.Notes, &createdAt,
			&m.Products.Name, &fromBranchName, &toBranchName)
		if err != nil {
			return nil, err
		}

		m.CreatedAt = createdAt.Format(time.RFC3339)
		if fromBranchName.Valid {
			m.FromBranch = &dto_stock.BranchNameInfo{Name: fromBranchName.String}
		}
		if toBranchName.Valid {
			m.ToBranch = &dto_stock.BranchNameInfo{Name: toBranchName.String}
		}

		mutations = append(mutations, m)
	}
	return mutations, nil
}

func (r *stockRepository) AdjustStockTx(ctx context.Context, req dto_stock.UpdateStockRequest) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	productID := req.ProductID
	branchID := *req.BranchID
	stockVal := *req.Stock
	minStockVal := *req.MinStock

	var oldStock int
	var count int
	err = tx.NewRaw(`SELECT COUNT(*) FROM product_stocks WHERE product_id = ? AND branch_id = ?`, productID, branchID).Scan(ctx, &count)
	if err != nil {
		return err
	}

	if count > 0 {
		err = tx.NewRaw(`SELECT stock FROM product_stocks WHERE product_id = ? AND branch_id = ?`, productID, branchID).Scan(ctx, &oldStock)
		if err != nil {
			return err
		}

		_, err = tx.NewRaw(`
			UPDATE product_stocks
			SET stock = ?, min_stock = ?, updated_at = NOW()
			WHERE product_id = ? AND branch_id = ?
		`, stockVal, minStockVal, productID, branchID).Exec(ctx)
		if err != nil {
			return err
		}
	} else {
		oldStock = 0
		stockID := generateUUID()
		_, err = tx.NewRaw(`
			INSERT INTO product_stocks (id, product_id, branch_id, stock, min_stock)
			VALUES (?, ?, ?, ?, ?)
		`, stockID, productID, branchID, stockVal, minStockVal).Exec(ctx)
		if err != nil {
			return err
		}
	}

	if stockVal != oldStock {
		diff := stockVal - oldStock
		var fromBranchID, toBranchID *string
		if diff < 0 {
			fromBranchID = &branchID
		} else {
			toBranchID = &branchID
		}

		notesVal := fmt.Sprintf("Opname stok mandiri oleh cabang (Stok lama: %d, Stok baru: %d)", oldStock, stockVal)
		if req.Notes != nil && *req.Notes != "" {
			notesVal = *req.Notes
		}

		mutationID := generateUUID()
		_, err = tx.NewRaw(`
			INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes)
			VALUES (?, ?, ?, ?, ?, 'ADJUSTMENT', ?)
		`, mutationID, productID, fromBranchID, toBranchID, int(math.Abs(float64(diff))), notesVal).Exec(ctx)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *stockRepository) MultiAllocateStockTx(ctx context.Context, req dto_stock.UpdateStockRequest) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	productID := req.ProductID

	for _, bs := range req.BranchStocks {
		bId := bs.BranchID
		stockVal := bs.Stock
		minStockVal := bs.MinStock

		var oldStock int
		var count int
		err = tx.NewRaw(`SELECT COUNT(*) FROM product_stocks WHERE product_id = ? AND branch_id = ?`, productID, bId).Scan(ctx, &count)
		if err != nil {
			return err
		}

		if count > 0 {
			err = tx.NewRaw(`SELECT stock FROM product_stocks WHERE product_id = ? AND branch_id = ?`, productID, bId).Scan(ctx, &oldStock)
			if err != nil {
				return err
			}

			_, err = tx.NewRaw(`
				UPDATE product_stocks
				SET stock = ?, min_stock = ?, updated_at = NOW()
				WHERE product_id = ? AND branch_id = ?
			`, stockVal, minStockVal, productID, bId).Exec(ctx)
			if err != nil {
				return err
			}
		} else {
			oldStock = 0
			stockID := generateUUID()
			_, err = tx.NewRaw(`
				INSERT INTO product_stocks (id, product_id, branch_id, stock, min_stock)
				VALUES (?, ?, ?, ?, ?)
			`, stockID, productID, bId, stockVal, minStockVal).Exec(ctx)
			if err != nil {
				return err
			}
		}

		if stockVal != oldStock {
			diff := stockVal - oldStock
			var fromBranchID, toBranchID *string
			if diff < 0 {
				fromBranchID = &bId
			} else {
				toBranchID = &bId
			}

			notesVal := fmt.Sprintf("Penyesuaian alokasi stok oleh owner (Stok lama: %d, Stok baru: %d)", oldStock, stockVal)
			if req.Notes != nil && *req.Notes != "" {
				notesVal = *req.Notes
			}

			mutationID := generateUUID()
			_, err = tx.NewRaw(`
				INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes)
				VALUES (?, ?, ?, ?, ?, 'ADJUSTMENT', ?)
			`, mutationID, productID, fromBranchID, toBranchID, int(math.Abs(float64(diff))), notesVal).Exec(ctx)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *stockRepository) TransferStockTx(ctx context.Context, req dto_stock.UpdateStockRequest) (*model_stock.StockMutation, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	productID := req.ProductID
	fromBranchID := *req.FromBranchID
	toBranchID := *req.ToBranchID
	qtyVal := *req.Quantity

	// 1. Cek stok di cabang pengirim
	var senderStock int
	var senderCount int
	err = tx.NewRaw(`SELECT COUNT(*) FROM product_stocks WHERE product_id = ? AND branch_id = ?`, productID, fromBranchID).Scan(ctx, &senderCount)
	if err != nil {
		return nil, err
	}

	if senderCount > 0 {
		err = tx.NewRaw(`SELECT stock FROM product_stocks WHERE product_id = ? AND branch_id = ?`, productID, fromBranchID).Scan(ctx, &senderStock)
		if err != nil {
			return nil, err
		}
	} else {
		senderStock = 0
	}

	if senderStock < qtyVal {
		return nil, fmt.Errorf("Stok di cabang pengirim tidak mencukupi untuk melakukan transfer.")
	}

	// 2. Kurangi stok di cabang pengirim
	_, err = tx.NewRaw(`
		UPDATE product_stocks
		SET stock = stock - ?, updated_at = NOW()
		WHERE product_id = ? AND branch_id = ?
	`, qtyVal, productID, fromBranchID).Exec(ctx)
	if err != nil {
		return nil, err
	}

	// 3. Tambah/Upsert stok di cabang penerima
	var receiverCount int
	err = tx.NewRaw(`SELECT COUNT(*) FROM product_stocks WHERE product_id = ? AND branch_id = ?`, productID, toBranchID).Scan(ctx, &receiverCount)
	if err != nil {
		return nil, err
	}

	if receiverCount > 0 {
		_, err = tx.NewRaw(`
			UPDATE product_stocks
			SET stock = stock + ?, updated_at = NOW()
			WHERE product_id = ? AND branch_id = ?
		`, qtyVal, productID, toBranchID).Exec(ctx)
		if err != nil {
			return nil, err
		}
	} else {
		stockID := generateUUID()
		_, err = tx.NewRaw(`
			INSERT INTO product_stocks (id, product_id, branch_id, stock, min_stock)
			VALUES (?, ?, ?, ?, 0)
		`, stockID, productID, toBranchID, qtyVal).Exec(ctx)
		if err != nil {
			return nil, err
		}
	}

	// 4. Catat log mutasi transfer
	mutationID := generateUUID()
	notesVal := "Transfer stok antar cabang"
	if req.Notes != nil && *req.Notes != "" {
		notesVal = *req.Notes
	}

	mutation := &model_stock.StockMutation{
		ID:           mutationID,
		ProductID:    productID,
		FromBranchID: &fromBranchID,
		ToBranchID:   &toBranchID,
		Quantity:     qtyVal,
		Type:         "TRANSFER",
		Notes:        &notesVal,
		CreatedAt:    time.Now(),
	}

	_, err = tx.NewRaw(`
		INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes)
		VALUES (?, ?, ?, ?, ?, 'TRANSFER', ?)
	`, mutation.ID, mutation.ProductID, mutation.FromBranchID, mutation.ToBranchID, mutation.Quantity, mutation.Notes).Exec(ctx)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return mutation, nil
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
