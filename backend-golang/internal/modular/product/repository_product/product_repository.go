package repository_product

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"

	"backend-golang/internal/modular/product/dto_product"
	"backend-golang/internal/modular/product/model_product"

	"github.com/uptrace/bun"
)

type ProductRepository interface {
	// Kategori
	FindCategoriesPaginated(ctx context.Context, page, limit int, scope, search string, profileID string) ([]model_product.ProductCategory, int, error)
	FindCategoryByID(ctx context.Context, id string) (*model_product.ProductCategory, error)
	CreateCategory(ctx context.Context, cat *model_product.ProductCategory) error
	UpdateCategory(ctx context.Context, cat *model_product.ProductCategory) error
	DeleteCategory(ctx context.Context, id string) error

	// Produk
	FindAllProducts(ctx context.Context) ([]dto_product.ProductResponse, error)
	FindProductsByTenant(ctx context.Context, tenantID string) ([]dto_product.ProductResponse, error)
	FindProductsByBranch(ctx context.Context, branchID string) ([]dto_product.ProductResponse, error)
	FindProductByID(ctx context.Context, id string) (*dto_product.ProductResponse, error)
	CreateProduct(ctx context.Context, req dto_product.CreateProductRequest) (*model_product.Product, error)
	UpdateProduct(ctx context.Context, req dto_product.UpdateProductRequest) (*model_product.Product, error)
	DeleteProduct(ctx context.Context, id string) error

	// Stok
	GetStocksByProductID(ctx context.Context, productID string) ([]dto_product.ProductStockInfo, error)
	GetStockByProductAndBranch(ctx context.Context, productID, branchID string) (int, int, error)
}

type productRepository struct {
	db *bun.DB
}

func NewProductRepository(db *bun.DB) ProductRepository {
	return &productRepository{db: db}
}

// ─── Kategori ────────────────────────────────────────────────────────────────

func (r *productRepository) FindCategoriesPaginated(ctx context.Context, page, limit int, scope, search string, profileID string) ([]model_product.ProductCategory, int, error) {
	offset := (page - 1) * limit

	whereClause := ""
	args := []interface{}{}

	if scope == "global" {
		whereClause += " AND pc.profile_id IS NULL"
	} else if scope == "tenant" {
		whereClause += " AND pc.profile_id IS NOT NULL"
	}

	if profileID != "" {
		whereClause += " AND (pc.profile_id IS NULL OR pc.profile_id = ?)"
		args = append(args, profileID)
	}

	if search != "" {
		whereClause += " AND pc.name ILIKE ?"
		args = append(args, "%"+search+"%")
	}

	// Hitung total
	countQuery := `SELECT COUNT(*) FROM product_categories pc WHERE 1=1` + whereClause
	var total int
	err := r.db.NewRaw(countQuery, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	// Tambah argumen pagination
	args = append(args, limit, offset)
	dataQuery := `
		SELECT pc.id, pc.profile_id, pc.name, pc.created_at,
			pr.business_name, pr.email
		FROM product_categories pc
		LEFT JOIN profiles pr ON pc.profile_id = pr.id
		WHERE 1=1` + whereClause + `
		ORDER BY pc.created_at DESC
		LIMIT ? OFFSET ?`

	var cats []model_product.ProductCategory
	err = r.db.NewRaw(dataQuery, args...).Scan(ctx, &cats)
	if err != nil {
		return nil, 0, err
	}
	return cats, total, nil
}

func (r *productRepository) FindCategoryByID(ctx context.Context, id string) (*model_product.ProductCategory, error) {
	cat := new(model_product.ProductCategory)
	query := `SELECT id, profile_id, name, created_at FROM product_categories WHERE id = ?`
	err := r.db.NewRaw(query, id).Scan(ctx, cat)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return cat, nil
}

func (r *productRepository) CreateCategory(ctx context.Context, cat *model_product.ProductCategory) error {
	cat.ID = generateUUID()
	query := `
		INSERT INTO product_categories (id, profile_id, name)
		VALUES (?, ?, ?)
		RETURNING id, created_at
	`
	err := r.db.NewRaw(query, cat.ID, cat.ProfileID, cat.Name).Scan(ctx, cat)
	return err
}

func (r *productRepository) UpdateCategory(ctx context.Context, cat *model_product.ProductCategory) error {
	query := `
		UPDATE product_categories SET name = ?
		WHERE id = ?
		RETURNING id, created_at
	`
	err := r.db.NewRaw(query, cat.Name, cat.ID).Scan(ctx, cat)
	return err
}

func (r *productRepository) DeleteCategory(ctx context.Context, id string) error {
	_, err := r.db.NewRaw(`DELETE FROM product_categories WHERE id = ?`, id).Exec(ctx)
	return err
}

// ─── Produk ──────────────────────────────────────────────────────────────────

var productSelectCols = `
	pr.id, pr.profile_id, pr.category_id, pr.branch_id, pr.name, pr.description,
	pr.base_price, pr.sell_price, pr.image_url, pr.is_active, pr.created_at, pr.updated_at,
	pc.name AS category_name,
	p.business_name, p.email AS profile_email`

func (r *productRepository) FindAllProducts(ctx context.Context) ([]dto_product.ProductResponse, error) {
	query := `
		SELECT ` + productSelectCols + `
		FROM products pr
		LEFT JOIN product_categories pc ON pr.category_id = pc.id
		LEFT JOIN profiles p ON pr.profile_id = p.id
		ORDER BY pr.name ASC
	`
	var products []model_product.Product
	err := r.db.NewRaw(query).Scan(ctx, &products)
	if err != nil {
		return nil, err
	}
	return r.mapProductsToResponse(ctx, products, "")
}

func (r *productRepository) FindProductsByTenant(ctx context.Context, tenantID string) ([]dto_product.ProductResponse, error) {
	query := `
		SELECT ` + productSelectCols + `
		FROM products pr
		LEFT JOIN product_categories pc ON pr.category_id = pc.id
		LEFT JOIN profiles p ON pr.profile_id = p.id
		WHERE pr.profile_id = ?
		ORDER BY pr.name ASC
	`
	var products []model_product.Product
	err := r.db.NewRaw(query, tenantID).Scan(ctx, &products)
	if err != nil {
		return nil, err
	}
	return r.mapProductsToResponse(ctx, products, "")
}

func (r *productRepository) FindProductsByBranch(ctx context.Context, branchID string) ([]dto_product.ProductResponse, error) {
	// Ambil tenant_id dari branch
	var tenantID string
	err := r.db.NewRaw(`SELECT tenant_id FROM branches WHERE id = ?`, branchID).Scan(ctx, &tenantID)
	if err != nil {
		return nil, fmt.Errorf("cabang tidak ditemukan")
	}

	query := `
		SELECT ` + productSelectCols + `
		FROM products pr
		LEFT JOIN product_categories pc ON pr.category_id = pc.id
		LEFT JOIN profiles p ON pr.profile_id = p.id
		WHERE pr.profile_id = ?
		  AND (pr.branch_id IS NULL OR pr.branch_id = ?)
		ORDER BY pr.name ASC
	`
	var products []model_product.Product
	err = r.db.NewRaw(query, tenantID, branchID).Scan(ctx, &products)
	if err != nil {
		return nil, err
	}
	return r.mapProductsToResponse(ctx, products, branchID)
}

func (r *productRepository) FindProductByID(ctx context.Context, id string) (*dto_product.ProductResponse, error) {
	query := `
		SELECT ` + productSelectCols + `
		FROM products pr
		LEFT JOIN product_categories pc ON pr.category_id = pc.id
		LEFT JOIN profiles p ON pr.profile_id = p.id
		WHERE pr.id = ?
	`
	product := new(model_product.Product)
	err := r.db.NewRaw(query, id).Scan(ctx, product)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	results, err := r.mapProductsToResponse(ctx, []model_product.Product{*product}, "")
	if err != nil || len(results) == 0 {
		return nil, err
	}
	return &results[0], nil
}

func (r *productRepository) CreateProduct(ctx context.Context, req dto_product.CreateProductRequest) (*model_product.Product, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	productID := generateUUID()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// A. Insert Produk
	product := new(model_product.Product)
	queryProduct := `
		INSERT INTO products (id, profile_id, branch_id, category_id, name, description, base_price, sell_price, image_url, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		RETURNING id, profile_id, branch_id, category_id, name, description, base_price, sell_price, image_url, is_active, created_at, updated_at
	`
	err = tx.NewRaw(queryProduct,
		productID, req.ProfileID, req.BranchID, req.CategoryID, req.Name,
		req.Description, req.BasePrice, req.SellPrice, req.ImageURL, isActive,
	).Scan(ctx, product)
	if err != nil {
		return nil, err
	}

	// B. Inisialisasi stok di cabang
	if req.BranchID != nil && *req.BranchID != "" {
		// Stok di cabang spesifik
		stock := 0
		minStock := 0
		for _, bs := range req.BranchStocks {
			if bs.BranchID == *req.BranchID {
				stock = bs.Stock
				minStock = bs.MinStock
				break
			}
		}

		stockID := generateUUID()
		_, err = tx.NewRaw(`
			INSERT INTO product_stocks (id, product_id, branch_id, stock, min_stock)
			VALUES (?, ?, ?, ?, ?)
		`, stockID, product.ID, *req.BranchID, stock, minStock).Exec(ctx)
		if err != nil {
			return nil, err
		}
	} else {
		// Produk pusat: inisialisasi stok hanya untuk cabang yang dikirim datanya
		for _, bs := range req.BranchStocks {
			stockID := generateUUID()
			_, err = tx.NewRaw(`
				INSERT INTO product_stocks (id, product_id, branch_id, stock, min_stock)
				VALUES (?, ?, ?, ?, ?)
			`, stockID, product.ID, bs.BranchID, bs.Stock, bs.MinStock).Exec(ctx)
			if err != nil {
				return nil, err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return product, nil
}

func (r *productRepository) UpdateProduct(ctx context.Context, req dto_product.UpdateProductRequest) (*model_product.Product, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Bangun SET clause secara dinamis
	setClauses := "updated_at = NOW()"
	args := []interface{}{}

	if req.CategoryID != nil {
		setClauses += ", category_id = ?"
		args = append(args, req.CategoryID)
	}
	if req.Name != nil {
		setClauses += ", name = ?"
		args = append(args, *req.Name)
	}
	if req.Description != nil {
		setClauses += ", description = ?"
		args = append(args, req.Description)
	}
	if req.BasePrice != nil {
		setClauses += ", base_price = ?"
		args = append(args, *req.BasePrice)
	}
	if req.SellPrice != nil {
		setClauses += ", sell_price = ?"
		args = append(args, *req.SellPrice)
	}
	if req.ImageURL != nil {
		setClauses += ", image_url = ?"
		args = append(args, req.ImageURL)
	}
	if req.IsActive != nil {
		setClauses += ", is_active = ?"
		args = append(args, *req.IsActive)
	}

	args = append(args, req.ID)
	query := `UPDATE products SET ` + setClauses + ` WHERE id = ? RETURNING id, profile_id, branch_id, category_id, name, description, base_price, sell_price, image_url, is_active, created_at, updated_at`

	product := new(model_product.Product)
	err = tx.NewRaw(query, args...).Scan(ctx, product)
	if err != nil {
		return nil, err
	}

	// 2. Update stok cabang jika diberikan
	if len(req.BranchStocks) > 0 {
		for _, bs := range req.BranchStocks {
			// Cek apakah stok untuk cabang ini sudah ada
			var count int
			err = tx.NewRaw(`SELECT COUNT(*) FROM product_stocks WHERE product_id = ? AND branch_id = ?`, req.ID, bs.BranchID).Scan(ctx, &count)
			if err != nil {
				return nil, err
			}

			if count > 0 {
				_, err = tx.NewRaw(`
					UPDATE product_stocks 
					SET stock = ?, min_stock = ? 
					WHERE product_id = ? AND branch_id = ?
				`, bs.Stock, bs.MinStock, req.ID, bs.BranchID).Exec(ctx)
			} else {
				stockID := generateUUID()
				_, err = tx.NewRaw(`
					INSERT INTO product_stocks (id, product_id, branch_id, stock, min_stock)
					VALUES (?, ?, ?, ?, ?)
				`, stockID, req.ID, bs.BranchID, bs.Stock, bs.MinStock).Exec(ctx)
			}
			if err != nil {
				return nil, err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return product, nil
}

func (r *productRepository) DeleteProduct(ctx context.Context, id string) error {
	_, err := r.db.NewRaw(`DELETE FROM products WHERE id = ?`, id).Exec(ctx)
	return err
}

// ─── Stok ────────────────────────────────────────────────────────────────────

func (r *productRepository) GetStocksByProductID(ctx context.Context, productID string) ([]dto_product.ProductStockInfo, error) {
	var stocks []dto_product.ProductStockInfo
	rows, err := r.db.QueryContext(ctx, `SELECT id, branch_id, stock, min_stock FROM product_stocks WHERE product_id = ?`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var s dto_product.ProductStockInfo
		if err := rows.Scan(&s.ID, &s.BranchID, &s.Stock, &s.MinStock); err != nil {
			return nil, err
		}
		stocks = append(stocks, s)
	}
	return stocks, nil
}

func (r *productRepository) GetStockByProductAndBranch(ctx context.Context, productID, branchID string) (int, int, error) {
	var stock, minStock int
	err := r.db.NewRaw(`
		SELECT stock, min_stock FROM product_stocks WHERE product_id = ? AND branch_id = ?
	`, productID, branchID).Scan(ctx, &stock, &minStock)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, 0, nil
		}
		return 0, 0, err
	}
	return stock, minStock, nil
}

// ─── Helper ──────────────────────────────────────────────────────────────────

func (r *productRepository) mapProductsToResponse(ctx context.Context, products []model_product.Product, filterBranchID string) ([]dto_product.ProductResponse, error) {
	var results []dto_product.ProductResponse
	for _, p := range products {
		stocks, err := r.GetStocksByProductID(ctx, p.ID)
		if err != nil {
			return nil, err
		}
		if stocks == nil {
			stocks = []dto_product.ProductStockInfo{}
		}

		resp := dto_product.ProductResponse{
			ID:            p.ID,
			ProfileID:     p.ProfileID,
			CategoryID:    p.CategoryID,
			BranchID:      p.BranchID,
			Name:          p.Name,
			Description:   p.Description,
			BasePrice:     p.BasePrice,
			SellPrice:     p.SellPrice,
			ImageURL:      p.ImageURL,
			IsActive:      p.IsActive,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			ProductStocks: stocks,
		}

		if p.CategoryName != "" {
			resp.ProductCategories = &dto_product.ProductCategoryInfo{Name: p.CategoryName}
		}

		resp.Profiles = &dto_product.ProductProfileInfo{
			BusinessName: p.BusinessName,
			Email:        p.ProfileEmail,
		}

		// Jika filter by branch, tambahkan current_branch_stock
		if filterBranchID != "" {
			stock, minStock, err := r.GetStockByProductAndBranch(ctx, p.ID, filterBranchID)
			if err != nil {
				return nil, err
			}
			resp.CurrentBranchStock = stock
			resp.CurrentBranchMinStock = minStock
		}

		results = append(results, resp)
	}
	return results, nil
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
