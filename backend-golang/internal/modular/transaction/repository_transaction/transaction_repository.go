package repository_transaction

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"time"

	"backend-golang/internal/modular/transaction/dto_transaction"

	"github.com/uptrace/bun"
)

type TransactionRepository interface {
	GetGroup(ctx context.Context, id string) (*dto_transaction.TransactionGroupResponse, error)
	GetGroups(ctx context.Context, profileID, branchID, search, dateStart, dateEnd string, page, limit int) ([]dto_transaction.TransactionGroupResponse, int, error)
	CreateGroup(ctx context.Context, req dto_transaction.CreateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error)
	UpdateGroup(ctx context.Context, req dto_transaction.UpdateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error)
	UpdateGroupStatusDirect(ctx context.Context, id string, status int) (*dto_transaction.TransactionGroupResponse, error)
	DeleteGroup(ctx context.Context, id string) error

	// Items
	GetItems(ctx context.Context, groupID, categoryID, itemType string, page, limit int) ([]dto_transaction.TransactionItemResponse, int, error)
	GetItem(ctx context.Context, id string) (*dto_transaction.TransactionItemResponse, error)
	CreateItemDirect(ctx context.Context, req dto_transaction.CreateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error)
	UpdateItemDirect(ctx context.Context, req dto_transaction.UpdateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error)
	DeleteItemDirect(ctx context.Context, id string) (string, error) // Returns groupID

	// Attachments
	GetAttachments(ctx context.Context, groupID string, page, limit int) ([]dto_transaction.TransactionAttachmentResponse, int, error)
	CreateAttachment(ctx context.Context, req dto_transaction.CreateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error)
	UpdateAttachment(ctx context.Context, req dto_transaction.UpdateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error)
	DeleteAttachment(ctx context.Context, id string) error

	// Helper
	UpdateGroupTotals(ctx context.Context, tx bun.Tx, groupID string) error
}

type transactionRepository struct {
	db *bun.DB
}

func NewTransactionRepository(db *bun.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

// ─── HELPER: Map type ───
func mapType(t string) string {
	switch t {
	case "pemasukan", "income", "INCOME":
		return "INCOME"
	case "pengeluaran", "expense", "EXPENSE":
		return "EXPENSE"
	default:
		return "INCOME"
	}
}

// ─── IMPLEMENTASI DETIL GROUP KASIR ───

func (r *transactionRepository) GetGroup(ctx context.Context, id string) (*dto_transaction.TransactionGroupResponse, error) {
	var g dto_transaction.TransactionGroupResponse
	query := `
		SELECT id, profile_id, branch_id, reference_number, transaction_date::timestamp, description,
		       total_income, total_expense, net_balance, customer_name, customer_phone, customer_address,
		       order_status, created_at, updated_at
		FROM transaction_groups
		WHERE id = ?
	`
	err := r.db.NewRaw(query, id).Scan(ctx, &g.ID, &g.ProfileID, &g.BranchID, &g.ReferenceNumber, &g.TransactionDate, &g.Description,
		&g.TotalIncome, &g.TotalExpense, &g.NetBalance, &g.CustomerName, &g.CustomerPhone, &g.CustomerAddress,
		&g.OrderStatus, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Ambil items
	g.TransactionItems, err = r.getItemsForGroup(ctx, g.ID)
	if err != nil {
		return nil, err
	}

	// Ambil attachments
	g.TransactionAttachments, err = r.getAttachmentsForGroup(ctx, g.ID)
	if err != nil {
		return nil, err
	}

	return &g, nil
}

func (r *transactionRepository) GetGroups(ctx context.Context, profileID, branchID, search, dateStart, dateEnd string, page, limit int) ([]dto_transaction.TransactionGroupResponse, int, error) {
	whereClause := " WHERE 1=1"
	args := []interface{}{}

	if profileID != "" {
		whereClause += " AND profile_id = ?"
		args = append(args, profileID)
	}
	if branchID != "" {
		whereClause += " AND branch_id = ?"
		args = append(args, branchID)
	}
	if search != "" {
		whereClause += " AND reference_number ILIKE ?"
		args = append(args, "%"+search+"%")
	}
	if dateStart != "" {
		whereClause += " AND transaction_date >= ?"
		args = append(args, dateStart)
	}
	if dateEnd != "" {
		whereClause += " AND transaction_date <= ?"
		args = append(args, dateEnd)
	}

	// Hitung total
	countQuery := `SELECT COUNT(*) FROM transaction_groups` + whereClause
	var total int
	err := r.db.NewRaw(countQuery, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	// Ambil data
	offset := (page - 1) * limit
	selectQuery := fmt.Sprintf(`
		SELECT id, profile_id, branch_id, reference_number, transaction_date::timestamp, description,
		       total_income, total_expense, net_balance, customer_name, customer_phone, customer_address,
		       order_status, created_at, updated_at
		FROM transaction_groups
		%s
		ORDER BY transaction_date DESC, created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	selectArgs := append(args, limit, offset)
	rows, err := r.db.QueryContext(ctx, selectQuery, selectArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var groups []dto_transaction.TransactionGroupResponse
	for rows.Next() {
		var g dto_transaction.TransactionGroupResponse
		err := rows.Scan(&g.ID, &g.ProfileID, &g.BranchID, &g.ReferenceNumber, &g.TransactionDate, &g.Description,
			&g.TotalIncome, &g.TotalExpense, &g.NetBalance, &g.CustomerName, &g.CustomerPhone, &g.CustomerAddress,
			&g.OrderStatus, &g.CreatedAt, &g.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}

		g.TransactionItems, err = r.getItemsForGroup(ctx, g.ID)
		if err != nil {
			return nil, 0, err
		}

		g.TransactionAttachments, err = r.getAttachmentsForGroup(ctx, g.ID)
		if err != nil {
			return nil, 0, err
		}

		groups = append(groups, g)
	}

	return groups, total, nil
}

func (r *transactionRepository) CreateGroup(ctx context.Context, req dto_transaction.CreateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Hitung total income & expense
	var totalIncome, totalExpense float64
	for _, item := range req.Items {
		mType := mapType(item.Type)
		if mType == "INCOME" {
			totalIncome += item.Amount
		} else {
			totalExpense += item.Amount
		}
	}
	netBalance := totalIncome - totalExpense

	// 2. Insert transaction group
	var groupID string
	var createdAt, updatedAt time.Time
	orderStatus := 6
	if req.OrderStatus != nil {
		orderStatus = *req.OrderStatus
	}

	var txDate time.Time
	if req.TransactionDate != nil && *req.TransactionDate != "" {
		txDate, err = time.Parse(time.RFC3339, *req.TransactionDate)
		if err != nil {
			// fallback
			txDate = time.Now()
		}
	} else {
		txDate = time.Now()
	}

	groupID = generateUUID()
	insertGroupQuery := `
		INSERT INTO transaction_groups (
			id, profile_id, branch_id, reference_number, transaction_date, description,
			total_income, total_expense, net_balance, customer_name, customer_phone, customer_address,
			order_status, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	err = tx.NewRaw(insertGroupQuery, groupID, req.ProfileID, req.BranchID, req.ReferenceNumber, txDate, req.Description,
		totalIncome, totalExpense, netBalance, req.CustomerName, req.CustomerPhone, req.CustomerAddress, orderStatus).
		Scan(ctx, &groupID, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	// 3. Insert items & handle stock deduction
	for _, item := range req.Items {
		itemID := generateUUID()
		qty := 1
		if item.Quantity != nil {
			qty = *item.Quantity
		}
		insertItemQuery := `
			INSERT INTO transaction_items (
				id, group_id, category_id, payment_method_id, type, name, amount, product_id, quantity, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
			RETURNING id
		`
		err = tx.NewRaw(insertItemQuery, itemID, groupID, item.CategoryID, item.PaymentMethodID, mapType(item.Type), item.Name,
			item.Amount, item.ProductID, qty).Scan(ctx, &itemID)
		if err != nil {
			return nil, err
		}

		// Deduct stock if branch_id is present and status is completed/lunas (6) and product_id exists
		if req.BranchID != nil && *req.BranchID != "" && orderStatus == 6 && item.ProductID != nil && *item.ProductID != "" {
			// Decrement stock
			updateStockQuery := `
				UPDATE product_stocks
				SET stock = stock - ?
				WHERE product_id = ? AND branch_id = ?
			`
			_, err = tx.NewRaw(updateStockQuery, qty, *item.ProductID, *req.BranchID).Exec(ctx)
			if err != nil {
				return nil, err
			}

			// Log stock mutation
			refNum := ""
			if req.ReferenceNumber != nil {
				refNum = *req.ReferenceNumber
			} else {
				refNum = groupID[:8]
			}
			notes := fmt.Sprintf("Penjualan POS Kasir - Nota #%s", refNum)
			mutationID := generateUUID()
			insertMutationQuery := `
				INSERT INTO stock_mutations (
					id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at
				) VALUES (?, ?, ?, NULL, ?, 'SALE', ?, NOW())
			`
			_, err = tx.NewRaw(insertMutationQuery, mutationID, *item.ProductID, *req.BranchID, qty, notes).Exec(ctx)
			if err != nil {
				return nil, err
			}
		}
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return r.GetGroup(ctx, groupID)
}

func (r *transactionRepository) UpdateGroup(ctx context.Context, req dto_transaction.UpdateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Fetch current transaction group
	var oldStatus int
	var oldBranchID *string
	var oldRefNumber *string
	var profileID string
	queryOld := `SELECT order_status, branch_id, reference_number, profile_id FROM transaction_groups WHERE id = ?`
	err = tx.NewRaw(queryOld, req.ID).Scan(ctx, &oldStatus, &oldBranchID, &oldRefNumber, &profileID)
	if err != nil {
		return nil, err
	}

	// 2. Ambil old items untuk revert stock
	var oldItems []struct {
		ProductID *string
		Quantity  int
	}
	rows, err := tx.QueryContext(ctx, `SELECT product_id, quantity FROM transaction_items WHERE group_id = ?`, req.ID)
	if err == nil {
		for rows.Next() {
			var oi struct {
				ProductID *string
				Quantity  int
			}
			if err := rows.Scan(&oi.ProductID, &oi.Quantity); err == nil {
				oldItems = append(oldItems, oi)
			}
		}
		rows.Close()
	}

	// 3. Revert old stock if old status was completed (6) and had branch
	if oldStatus == 6 && oldBranchID != nil && *oldBranchID != "" {
		for _, item := range oldItems {
			if item.ProductID != nil && *item.ProductID != "" {
				// Revert (increment) stock
				_, err = tx.NewRaw(`UPDATE product_stocks SET stock = stock + ? WHERE product_id = ? AND branch_id = ?`, item.Quantity, *item.ProductID, *oldBranchID).Exec(ctx)
				if err != nil {
					return nil, err
				}

				// Log reversal mutation
				ref := ""
				if oldRefNumber != nil {
					ref = *oldRefNumber
				} else {
					ref = req.ID[:8]
				}
				notes := fmt.Sprintf("Koreksi Reversal Edit POS - Nota #%s", ref)
				mutationID := generateUUID()
				_, err = tx.NewRaw(`INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at) VALUES (?, ?, NULL, ?, ?, 'ADJUSTMENT', ?, NOW())`, mutationID, *item.ProductID, *oldBranchID, item.Quantity, notes).Exec(ctx)
				if err != nil {
					return nil, err
				}
			}
		}
	}

	// 4. Delete old items
	_, err = tx.NewRaw(`DELETE FROM transaction_items WHERE group_id = ?`, req.ID).Exec(ctx)
	if err != nil {
		return nil, err
	}

	// 5. Hitung total baru
	var totalIncome, totalExpense float64
	for _, item := range req.Items {
		mType := mapType(item.Type)
		if mType == "INCOME" {
			totalIncome += item.Amount
		} else {
			totalExpense += item.Amount
		}
	}
	netBalance := totalIncome - totalExpense

	// 6. Update Group
	setClause := "updated_at = NOW(), total_income = ?, total_expense = ?, net_balance = ?"
	args := []interface{}{totalIncome, totalExpense, netBalance}

	if req.BranchID != nil {
		setClause += ", branch_id = ?"
		args = append(args, *req.BranchID)
	}
	if req.ReferenceNumber != nil {
		setClause += ", reference_number = ?"
		args = append(args, *req.ReferenceNumber)
	}
	if req.TransactionDate != nil && *req.TransactionDate != "" {
		txDate, _ := time.Parse(time.RFC3339, *req.TransactionDate)
		setClause += ", transaction_date = ?"
		args = append(args, txDate)
	}
	if req.Description != nil {
		setClause += ", description = ?"
		args = append(args, *req.Description)
	}
	if req.CustomerName != nil {
		setClause += ", customer_name = ?"
		args = append(args, *req.CustomerName)
	}
	if req.CustomerPhone != nil {
		setClause += ", customer_phone = ?"
		args = append(args, *req.CustomerPhone)
	}
	if req.CustomerAddress != nil {
		setClause += ", customer_address = ?"
		args = append(args, *req.CustomerAddress)
	}
	if req.OrderStatus != nil {
		setClause += ", order_status = ?"
		args = append(args, *req.OrderStatus)
	}

	args = append(args, req.ID)
	updateGroupQuery := `UPDATE transaction_groups SET ` + setClause + ` WHERE id = ?`
	_, err = tx.NewRaw(updateGroupQuery, args...).Exec(ctx)
	if err != nil {
		return nil, err
	}

	// Resolve status & branch baru
	newStatus := oldStatus
	if req.OrderStatus != nil {
		newStatus = *req.OrderStatus
	}
	newBranchID := oldBranchID
	if req.BranchID != nil {
		newBranchID = req.BranchID
	}

	// 7. Insert items baru & handle stock deduction
	for _, item := range req.Items {
		qty := 1
		if item.Quantity != nil {
			qty = *item.Quantity
		}

		itemID := generateUUID()
		insertItemQuery := `
			INSERT INTO transaction_items (
				id, group_id, category_id, payment_method_id, type, name, amount, product_id, quantity, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
		`
		_, err = tx.NewRaw(insertItemQuery, itemID, req.ID, item.CategoryID, item.PaymentMethodID, mapType(item.Type), item.Name,
			item.Amount, item.ProductID, qty).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Potong stok baru jika lunas (6)
		if newStatus == 6 && newBranchID != nil && *newBranchID != "" && item.ProductID != nil && *item.ProductID != "" {
			_, err = tx.NewRaw(`UPDATE product_stocks SET stock = stock - ? WHERE product_id = ? AND branch_id = ?`, qty, *item.ProductID, *newBranchID).Exec(ctx)
			if err != nil {
				return nil, err
			}

			ref := ""
			if req.ReferenceNumber != nil {
				ref = *req.ReferenceNumber
			} else if oldRefNumber != nil {
				ref = *oldRefNumber
			} else {
				ref = req.ID[:8]
			}
			notes := fmt.Sprintf("Penjualan POS Kasir (Update) - Nota #%s", ref)
			mutationID := generateUUID()
			_, err = tx.NewRaw(`INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at) VALUES (?, ?, ?, NULL, ?, 'SALE', ?, NOW())`, mutationID, *item.ProductID, *newBranchID, qty, notes).Exec(ctx)
			if err != nil {
				return nil, err
			}
		}
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return r.GetGroup(ctx, req.ID)
}

func (r *transactionRepository) UpdateGroupStatusDirect(ctx context.Context, id string, status int) (*dto_transaction.TransactionGroupResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Fetch old status & branch
	var oldStatus int
	var branchID *string
	var refNum *string
	err = tx.NewRaw(`SELECT order_status, branch_id, reference_number FROM transaction_groups WHERE id = ?`, id).Scan(ctx, &oldStatus, &branchID, &refNum)
	if err != nil {
		return nil, err
	}

	if oldStatus == status {
		return r.GetGroup(ctx, id)
	}

	// Fetch items
	var items []struct {
		ProductID *string
		Quantity  int
	}
	rows, err := tx.QueryContext(ctx, `SELECT product_id, quantity FROM transaction_items WHERE group_id = ?`, id)
	if err == nil {
		for rows.Next() {
			var oi struct {
				ProductID *string
				Quantity  int
			}
			if err := rows.Scan(&oi.ProductID, &oi.Quantity); err == nil {
				items = append(items, oi)
			}
		}
		rows.Close()
	}

	// 1. Transisi dari Lunas (6) ke tidak Lunas -> kembalikan stok
	if oldStatus == 6 && status != 6 && branchID != nil && *branchID != "" {
		for _, item := range items {
			if item.ProductID != nil && *item.ProductID != "" {
				_, err = tx.NewRaw(`UPDATE product_stocks SET stock = stock + ? WHERE product_id = ? AND branch_id = ?`, item.Quantity, *item.ProductID, *branchID).Exec(ctx)
				if err != nil {
					return nil, err
				}

				ref := ""
				if refNum != nil {
					ref = *refNum
				} else {
					ref = id[:8]
				}
				notes := fmt.Sprintf("Pembatalan/Perubahan Pesanan - Nota #%s", ref)
				mutationID := generateUUID()
				_, err = tx.NewRaw(`INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at) VALUES (?, ?, NULL, ?, ?, 'ADJUSTMENT', ?, NOW())`, mutationID, *item.ProductID, *branchID, item.Quantity, notes).Exec(ctx)
				if err != nil {
					return nil, err
				}
			}
		}
	}

	// 2. Transisi dari tidak Lunas ke Lunas (6) -> potong stok
	if oldStatus != 6 && status == 6 && branchID != nil && *branchID != "" {
		for _, item := range items {
			if item.ProductID != nil && *item.ProductID != "" {
				_, err = tx.NewRaw(`UPDATE product_stocks SET stock = stock - ? WHERE product_id = ? AND branch_id = ?`, item.Quantity, *item.ProductID, *branchID).Exec(ctx)
				if err != nil {
					return nil, err
				}

				ref := ""
				if refNum != nil {
					ref = *refNum
				} else {
					ref = id[:8]
				}
				notes := fmt.Sprintf("Penyelesaian Pesanan - Nota #%s", ref)
				mutationID := generateUUID()
				_, err = tx.NewRaw(`INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at) VALUES (?, ?, ?, NULL, ?, 'SALE', ?, NOW())`, mutationID, *item.ProductID, *branchID, item.Quantity, notes).Exec(ctx)
				if err != nil {
					return nil, err
				}
			}
		}
	}

	// Update order status
	_, err = tx.NewRaw(`UPDATE transaction_groups SET order_status = ?, updated_at = NOW() WHERE id = ?`, status, id).Exec(ctx)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return r.GetGroup(ctx, id)
}

func (r *transactionRepository) DeleteGroup(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Fetch group status, branch, and ref
	var oldStatus int
	var branchID *string
	var refNum *string
	err = tx.NewRaw(`SELECT order_status, branch_id, reference_number FROM transaction_groups WHERE id = ?`, id).Scan(ctx, &oldStatus, &branchID, &refNum)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil // Nothing to delete
		}
		return err
	}

	// Revert stock if lunas (6)
	if oldStatus == 6 && branchID != nil && *branchID != "" {
		var items []struct {
			ProductID *string
			Quantity  int
		}
		rows, err := tx.QueryContext(ctx, `SELECT product_id, quantity FROM transaction_items WHERE group_id = ?`, id)
		if err == nil {
			for rows.Next() {
				var oi struct {
					ProductID *string
					Quantity  int
				}
				if err := rows.Scan(&oi.ProductID, &oi.Quantity); err == nil {
					items = append(items, oi)
				}
			}
			rows.Close()
		}

		for _, item := range items {
			if item.ProductID != nil && *item.ProductID != "" {
				_, err = tx.NewRaw(`UPDATE product_stocks SET stock = stock + ? WHERE product_id = ? AND branch_id = ?`, item.Quantity, *item.ProductID, *branchID).Exec(ctx)
				if err != nil {
					return err
				}

				ref := ""
				if refNum != nil {
					ref = *refNum
				} else {
					ref = id[:8]
				}
				notes := fmt.Sprintf("Reversal Hapus Transaksi - Nota #%s", ref)
				mutationID := generateUUID()
				_, err = tx.NewRaw(`INSERT INTO stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at) VALUES (?, ?, NULL, ?, ?, 'ADJUSTMENT', ?, NOW())`, mutationID, *item.ProductID, *branchID, item.Quantity, notes).Exec(ctx)
				if err != nil {
					return err
				}
			}
		}
	}

	// Delete items & group
	_, err = tx.NewRaw(`DELETE FROM transaction_items WHERE group_id = ?`, id).Exec(ctx)
	if err != nil {
		return err
	}
	_, err = tx.NewRaw(`DELETE FROM transaction_groups WHERE id = ?`, id).Exec(ctx)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// ─── IMPLEMENTASI DETIL ITEMS ───

func (r *transactionRepository) GetItems(ctx context.Context, groupID, categoryID, itemType string, page, limit int) ([]dto_transaction.TransactionItemResponse, int, error) {
	whereClause := " WHERE 1=1"
	args := []interface{}{}

	if groupID != "" {
		whereClause += " AND group_id = ?"
		args = append(args, groupID)
	}
	if categoryID != "" {
		whereClause += " AND category_id = ?"
		args = append(args, categoryID)
	}
	if itemType != "" {
		whereClause += " AND type = ?"
		args = append(args, itemType)
	}

	var total int
	err := r.db.NewRaw(`SELECT COUNT(*) FROM transaction_items`+whereClause, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := fmt.Sprintf(`
		SELECT id, group_id, category_id, payment_method_id, type, name, amount, product_id, quantity, created_at
		FROM transaction_items
		%s
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	args = append(args, limit, offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []dto_transaction.TransactionItemResponse
	for rows.Next() {
		var item dto_transaction.TransactionItemResponse
		err := rows.Scan(&item.ID, &item.GroupID, &item.CategoryID, &item.PaymentMethodID, &item.Type, &item.Name,
			&item.Amount, &item.ProductID, &item.Quantity, &item.CreatedAt)
		if err != nil {
			return nil, 0, err
		}

		item.Categories = r.getCategoryMinInfo(ctx, item.CategoryID)
		item.PaymentMethods = r.getPaymentMethodMinInfo(ctx, item.PaymentMethodID)

		items = append(items, item)
	}

	return items, total, nil
}

func (r *transactionRepository) GetItem(ctx context.Context, id string) (*dto_transaction.TransactionItemResponse, error) {
	var item dto_transaction.TransactionItemResponse
	query := `
		SELECT id, group_id, category_id, payment_method_id, type, name, amount, product_id, quantity, created_at
		FROM transaction_items
		WHERE id = ?
	`
	err := r.db.NewRaw(query, id).Scan(ctx, &item.ID, &item.GroupID, &item.CategoryID, &item.PaymentMethodID, &item.Type, &item.Name,
		&item.Amount, &item.ProductID, &item.Quantity, &item.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	item.Categories = r.getCategoryMinInfo(ctx, item.CategoryID)
	item.PaymentMethods = r.getPaymentMethodMinInfo(ctx, item.PaymentMethodID)

	return &item, nil
}

func (r *transactionRepository) CreateItemDirect(ctx context.Context, req dto_transaction.CreateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	itemID := generateUUID()
	query := `
		INSERT INTO transaction_items (id, group_id, category_id, payment_method_id, type, name, amount, quantity, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
		RETURNING id
	`
	err = tx.NewRaw(query, itemID, req.GroupID, req.CategoryID, req.PaymentMethodID, mapType(req.Type), req.Name, req.Amount).Scan(ctx, &itemID)
	if err != nil {
		return nil, err
	}

	// Recalculate group totals
	err = r.UpdateGroupTotals(ctx, tx, req.GroupID)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return r.GetItem(ctx, itemID)
}

func (r *transactionRepository) UpdateItemDirect(ctx context.Context, req dto_transaction.UpdateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Get groupID first
	var groupID string
	err = tx.NewRaw(`SELECT group_id FROM transaction_items WHERE id = ?`, req.ID).Scan(ctx, &groupID)
	if err != nil {
		return nil, err
	}

	setClause := "created_at = created_at" // Dummy
	args := []interface{}{}

	if req.CategoryID != nil {
		setClause += ", category_id = ?"
		args = append(args, *req.CategoryID)
	}
	if req.PaymentMethodID != nil {
		setClause += ", payment_method_id = ?"
		args = append(args, *req.PaymentMethodID)
	}
	if req.Type != nil {
		setClause += ", type = ?"
		args = append(args, mapType(*req.Type))
	}
	if req.Name != nil {
		setClause += ", name = ?"
		args = append(args, *req.Name)
	}
	if req.Amount != nil {
		setClause += ", amount = ?"
		args = append(args, *req.Amount)
	}

	args = append(args, req.ID)
	query := `UPDATE transaction_items SET ` + setClause + ` WHERE id = ?`
	_, err = tx.NewRaw(query, args...).Exec(ctx)
	if err != nil {
		return nil, err
	}

	err = r.UpdateGroupTotals(ctx, tx, groupID)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return r.GetItem(ctx, req.ID)
}

func (r *transactionRepository) DeleteItemDirect(ctx context.Context, id string) (string, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	var groupID string
	err = tx.NewRaw(`SELECT group_id FROM transaction_items WHERE id = ?`, id).Scan(ctx, &groupID)
	if err != nil {
		return "", err
	}

	_, err = tx.NewRaw(`DELETE FROM transaction_items WHERE id = ?`, id).Exec(ctx)
	if err != nil {
		return "", err
	}

	err = r.UpdateGroupTotals(ctx, tx, groupID)
	if err != nil {
		return "", err
	}

	err = tx.Commit()
	if err != nil {
		return "", err
	}

	return groupID, nil
}

// ─── IMPLEMENTASI DETIL ATTACHMENTS ───

func (r *transactionRepository) GetAttachments(ctx context.Context, groupID string, page, limit int) ([]dto_transaction.TransactionAttachmentResponse, int, error) {
	whereClause := " WHERE 1=1"
	args := []interface{}{}

	if groupID != "" {
		whereClause += " AND group_id = ?"
		args = append(args, groupID)
	}

	var total int
	err := r.db.NewRaw(`SELECT COUNT(*) FROM transaction_attachments`+whereClause, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := fmt.Sprintf(`
		SELECT id, group_id, file_url, created_at
		FROM transaction_attachments
		%s
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	args = append(args, limit, offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var atts []dto_transaction.TransactionAttachmentResponse
	for rows.Next() {
		var a dto_transaction.TransactionAttachmentResponse
		err := rows.Scan(&a.ID, &a.GroupID, &a.FileURL, &a.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		atts = append(atts, a)
	}

	return atts, total, nil
}

func (r *transactionRepository) CreateAttachment(ctx context.Context, req dto_transaction.CreateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error) {
	var id string
	var createdAt time.Time
	query := `
		INSERT INTO transaction_attachments (group_id, file_url, created_at)
		VALUES (?, ?, NOW())
		RETURNING id, created_at
	`
	err := r.db.NewRaw(query, req.GroupID, req.FileURL).Scan(ctx, &id, &createdAt)
	if err != nil {
		return nil, err
	}

	return &dto_transaction.TransactionAttachmentResponse{
		ID:        id,
		GroupID:   req.GroupID,
		FileURL:   req.FileURL,
		CreatedAt: createdAt,
	}, nil
}

func (r *transactionRepository) UpdateAttachment(ctx context.Context, req dto_transaction.UpdateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error) {
	setClause := "created_at = created_at"
	args := []interface{}{}

	if req.GroupID != nil {
		setClause += ", group_id = ?"
		args = append(args, *req.GroupID)
	}
	if req.FileURL != nil {
		setClause += ", file_url = ?"
		args = append(args, *req.FileURL)
	}

	args = append(args, req.ID)
	query := `
		UPDATE transaction_attachments
		SET ` + setClause + `
		WHERE id = ?
		RETURNING id, group_id, file_url, created_at
	`

	var res dto_transaction.TransactionAttachmentResponse
	err := r.db.NewRaw(query, args...).Scan(ctx, &res.ID, &res.GroupID, &res.FileURL, &res.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &res, nil
}

func (r *transactionRepository) DeleteAttachment(ctx context.Context, id string) error {
	_, err := r.db.NewRaw(`DELETE FROM transaction_attachments WHERE id = ?`, id).Exec(ctx)
	return err
}

// ─── PRIVATE & HELPER METHODS ───

func (r *transactionRepository) UpdateGroupTotals(ctx context.Context, tx bun.Tx, groupID string) error {
	var totalIncome, totalExpense float64
	rows, err := tx.QueryContext(ctx, `SELECT type, amount, quantity FROM transaction_items WHERE group_id = ?`, groupID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var iType string
		var amount float64
		var qty int
		if err := rows.Scan(&iType, &amount, &qty); err == nil {
			mType := mapType(iType)
			fullAmount := amount * float64(qty)
			if mType == "INCOME" {
				totalIncome += fullAmount
			} else {
				totalExpense += fullAmount
			}
		}
	}

	netBalance := totalIncome - totalExpense
	_, err = tx.NewRaw(`UPDATE transaction_groups SET total_income = ?, total_expense = ?, net_balance = ?, updated_at = NOW() WHERE id = ?`, totalIncome, totalExpense, netBalance, groupID).Exec(ctx)
	return err
}

func (r *transactionRepository) getItemsForGroup(ctx context.Context, groupID string) ([]dto_transaction.TransactionItemResponse, error) {
	query := `
		SELECT id, group_id, category_id, payment_method_id, type, name, amount, product_id, quantity, created_at
		FROM transaction_items
		WHERE group_id = ?
		ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_transaction.TransactionItemResponse
	for rows.Next() {
		var item dto_transaction.TransactionItemResponse
		err := rows.Scan(&item.ID, &item.GroupID, &item.CategoryID, &item.PaymentMethodID, &item.Type, &item.Name,
			&item.Amount, &item.ProductID, &item.Quantity, &item.CreatedAt)
		if err != nil {
			return nil, err
		}

		item.Categories = r.getCategoryMinInfo(ctx, item.CategoryID)
		item.PaymentMethods = r.getPaymentMethodMinInfo(ctx, item.PaymentMethodID)

		items = append(items, item)
	}
	return items, nil
}

func (r *transactionRepository) getAttachmentsForGroup(ctx context.Context, groupID string) ([]dto_transaction.TransactionAttachmentResponse, error) {
	query := `
		SELECT id, group_id, file_url, created_at
		FROM transaction_attachments
		WHERE group_id = ?
		ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var atts []dto_transaction.TransactionAttachmentResponse
	for rows.Next() {
		var a dto_transaction.TransactionAttachmentResponse
		err := rows.Scan(&a.ID, &a.GroupID, &a.FileURL, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		atts = append(atts, a)
	}
	return atts, nil
}

func (r *transactionRepository) getCategoryMinInfo(ctx context.Context, catID *string) *dto_transaction.CategoryMinInfo {
	if catID == nil || *catID == "" {
		return nil
	}
	var c dto_transaction.CategoryMinInfo
	err := r.db.NewRaw(`SELECT id, name, type FROM categories WHERE id = ?`, *catID).Scan(ctx, &c.ID, &c.Name, &c.Type)
	if err != nil {
		return nil
	}
	return &c
}

func (r *transactionRepository) getPaymentMethodMinInfo(ctx context.Context, pmID *string) *dto_transaction.PaymentMethodMinInfo {
	if pmID == nil || *pmID == "" {
		return nil
	}
	var p dto_transaction.PaymentMethodMinInfo
	err := r.db.NewRaw(`SELECT id, name FROM payment_methods WHERE id = ?`, *pmID).Scan(ctx, &p.ID, &p.Name)
	if err != nil {
		return nil
	}
	return &p
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

