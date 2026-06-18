package repository_tenant_umkm

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"time"

	"backend-golang/internal/modular/profile/model_profile"
	"backend-golang/internal/modular/tenant_umkm/dto_tenant_umkm"

	"github.com/uptrace/bun"
)

type TenantUMKMRepository interface {
	GetProfile(ctx context.Context, userID string) (*dto_tenant_umkm.TenantProfileInfo, error)
	GetBranchTenantOwner(ctx context.Context, branchID string) (string, error)
	GetTransactionsForYear(ctx context.Context, tenantOwnerID, branchID string, start, end time.Time) ([]rawTxRow, error)
	UpdateProfile(ctx context.Context, userID string, req dto_tenant_umkm.UpdateTenantUMKMRequest) (*dto_tenant_umkm.UpdateTenantUMKMResponse, error)
	GetProfileByUsername(ctx context.Context, username string) (*dto_tenant_umkm.TenantProfileInfo, error)
	GetPublicProducts(ctx context.Context, profileID string) ([]dto_tenant_umkm.PublicProductInfo, error)
	GetPublicBranches(ctx context.Context, profileID string) ([]dto_tenant_umkm.PublicBranchInfo, error)
	CreateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error)
	UpdateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error)
}

type tenantUMKMRepository struct {
	db *bun.DB
}

func NewTenantUMKMRepository(db *bun.DB) TenantUMKMRepository {
	return &tenantUMKMRepository{db: db}
}

type rawTxRow struct {
	TransactionDate time.Time
	TotalIncome     float64
	TotalExpense    float64
	NetBalance      float64
}

func (r *tenantUMKMRepository) GetProfile(ctx context.Context, userID string) (*dto_tenant_umkm.TenantProfileInfo, error) {
	profileModel := new(model_profile.Profile)

	query := `
		SELECT p.id, p.role_id, p.email, p.full_name, p.business_name, p.username,
		       p.phone_number, p.address, p.avatar_url, p.banner_url, p.bio, 
		       COALESCE(p.is_active, true) AS is_active, 
		       COALESCE(p.metadata, '{}') AS metadata, 
		       COALESCE(p.created_at, NOW()) AS created_at, 
		       COALESCE(p.updated_at, NOW()) AS updated_at, 
		       p.branch_id, p.payment_qr,
		       COALESCE(r.name, '') AS role_name
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
		WHERE p.id = ?
	`
	err := r.db.NewRaw(query, userID).Scan(ctx, profileModel)
	if err != nil {
		log.Printf("GetProfile Scan Error: %v\n", err)
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("profil tidak ditemukan")
		}
		return nil, err
	}

	profile := &dto_tenant_umkm.TenantProfileInfo{
		ID:            profileModel.ID,
		FullName:      profileModel.FullName,
		BusinessName:  profileModel.BusinessName,
		Email:         profileModel.Email,
		PhoneNumber:   profileModel.PhoneNumber,
		Address:       profileModel.Address,
		AvatarURL:     profileModel.AvatarURL,
		BannerURL:     profileModel.BannerURL,
		Bio:           profileModel.Bio,
		IsActive:      profileModel.IsActive,
		CreatedAt:     profileModel.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     profileModel.UpdatedAt.Format(time.RFC3339),
		BranchID:      profileModel.BranchID,
		Username:      profileModel.Username,
		UserRole:      profileModel.RoleName,
		Metadata:      profileModel.Metadata,
		PaymentQR:     profileModel.PaymentQR,
	}

	return profile, nil
}

func (r *tenantUMKMRepository) GetBranchTenantOwner(ctx context.Context, branchID string) (string, error) {
	var tenantID string
	query := `SELECT tenant_id FROM branches WHERE id = ?`
	err := r.db.NewRaw(query, branchID).Scan(ctx, &tenantID)
	if err != nil {
		return "", err
	}
	return tenantID, nil
}

func (r *tenantUMKMRepository) GetTransactionsForYear(ctx context.Context, tenantOwnerID, branchID string, start, end time.Time) ([]rawTxRow, error) {
	whereClause := " WHERE profile_id = ? AND transaction_date >= ? AND transaction_date <= ?"
	args := []interface{}{tenantOwnerID, start, end}

	if branchID != "" && branchID != "all" {
		whereClause += " AND branch_id = ?"
		args = append(args, branchID)
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

	var txs []rawTxRow
	for rows.Next() {
		var t rawTxRow
		if err := rows.Scan(&t.TransactionDate, &t.TotalIncome, &t.TotalExpense, &t.NetBalance); err != nil {
			return nil, err
		}
		txs = append(txs, t)
	}
	return txs, nil
}

func (r *tenantUMKMRepository) UpdateProfile(ctx context.Context, userID string, req dto_tenant_umkm.UpdateTenantUMKMRequest) (*dto_tenant_umkm.UpdateTenantUMKMResponse, error) {
	if req.Username != nil && *req.Username != "" {
		var count int
		err := r.db.NewRaw("SELECT COUNT(*) FROM profiles WHERE username = ? AND id != ?", *req.Username, userID).Scan(ctx, &count)
		if err != nil {
			return nil, err
		}
		if count > 0 {
			return nil, fmt.Errorf("Username toko ini sudah digunakan oleh UMKM lain. Silakan pilih username lain.")
		}
	}

	setClause := "updated_at = NOW()"
	args := []interface{}{}

	if req.FullName != nil {
		setClause += ", full_name = ?"
		args = append(args, *req.FullName)
	}
	if req.BusinessName != nil {
		setClause += ", business_name = ?"
		args = append(args, *req.BusinessName)
	}
	if req.PhoneNumber != nil {
		setClause += ", phone_number = ?"
		args = append(args, *req.PhoneNumber)
	}
	if req.Address != nil {
		setClause += ", address = ?"
		args = append(args, *req.Address)
	}
	if req.Bio != nil {
		setClause += ", bio = ?"
		args = append(args, *req.Bio)
	}
	if req.AvatarURL != nil {
		setClause += ", avatar_url = ?"
		args = append(args, *req.AvatarURL)
	}
	if req.BannerURL != nil {
		setClause += ", banner_url = ?"
		args = append(args, *req.BannerURL)
	}
	if req.Username != nil {
		setClause += ", username = ?"
		args = append(args, *req.Username)
	}
	if req.PaymentQR != nil {
		setClause += ", payment_qr = ?"
		args = append(args, *req.PaymentQR)
	}
	if len(req.Metadata) > 0 {
		setClause += ", metadata = ?"
		args = append(args, req.Metadata)
	}

	args = append(args, userID)
	query := `
		UPDATE profiles
		SET ` + setClause + `
		WHERE id = ?
		RETURNING id, full_name, business_name, phone_number, address, bio, avatar_url, banner_url, username, payment_qr, metadata, updated_at
	`

	var res dto_tenant_umkm.UpdateTenantUMKMResponse
	var updatedAt time.Time
	err := r.db.NewRaw(query, args...).Scan(ctx, &res.ID, &res.FullName, &res.BusinessName, &res.PhoneNumber,
		&res.Address, &res.Bio, &res.AvatarURL, &res.BannerURL, &res.Username, &res.PaymentQR, &res.Metadata, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("profil tidak ditemukan")
		}
		return nil, err
	}

	res.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &res, nil
}

func (r *tenantUMKMRepository) GetProfileByUsername(ctx context.Context, username string) (*dto_tenant_umkm.TenantProfileInfo, error) {
	profileModel := new(model_profile.Profile)

	query := `
		SELECT p.id, p.role_id, p.email, p.full_name, p.business_name, p.username,
		       p.phone_number, p.address, p.avatar_url, p.banner_url, p.bio, 
		       COALESCE(p.is_active, true) AS is_active, 
		       COALESCE(p.metadata, '{}') AS metadata, 
		       COALESCE(p.created_at, NOW()) AS created_at, 
		       COALESCE(p.updated_at, NOW()) AS updated_at, 
		       p.branch_id, p.payment_qr,
		       COALESCE(r.name, '') AS role_name
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
		WHERE p.username = ?
	`
	err := r.db.NewRaw(query, username).Scan(ctx, profileModel)
	if err != nil {
		log.Printf("GetProfileByUsername Scan Error: %v\n", err)
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("profil tidak ditemukan")
		}
		return nil, err
	}

	profile := &dto_tenant_umkm.TenantProfileInfo{
		ID:            profileModel.ID,
		FullName:      profileModel.FullName,
		BusinessName:  profileModel.BusinessName,
		Email:         profileModel.Email,
		PhoneNumber:   profileModel.PhoneNumber,
		Address:       profileModel.Address,
		AvatarURL:     profileModel.AvatarURL,
		BannerURL:     profileModel.BannerURL,
		Bio:           profileModel.Bio,
		IsActive:      profileModel.IsActive,
		CreatedAt:     profileModel.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     profileModel.UpdatedAt.Format(time.RFC3339),
		BranchID:      profileModel.BranchID,
		Username:      profileModel.Username,
		UserRole:      profileModel.RoleName,
		TenantOwnerID: profileModel.ID,
		Metadata:      profileModel.Metadata,
		PaymentQR:     profileModel.PaymentQR,
	}

	return profile, nil
}

func (r *tenantUMKMRepository) GetPublicProducts(ctx context.Context, profileID string) ([]dto_tenant_umkm.PublicProductInfo, error) {
	query := `
		SELECT p.id, p.profile_id, p.category_id, p.name, p.description, p.base_price, p.sell_price, p.image_url, p.is_active,
		       c.name AS category_name
		FROM products p
		LEFT JOIN product_categories c ON p.category_id = c.id
		WHERE p.profile_id = ? AND p.is_active = true
		ORDER BY p.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []dto_tenant_umkm.PublicProductInfo
	for rows.Next() {
		var p dto_tenant_umkm.PublicProductInfo
		var catName sql.NullString
		err := rows.Scan(&p.ID, &p.ProfileID, &p.CategoryID, &p.Name, &p.Description, &p.BasePrice, &p.SellPrice, &p.ImageURL, &p.IsActive, &catName)
		if err != nil {
			return nil, err
		}
		if catName.Valid && catName.String != "" {
			p.ProductCategories = &dto_tenant_umkm.PublicProductCategory{Name: catName.String}
		}
		products = append(products, p)
	}

	// Ambil stock untuk setiap product
	for i, prod := range products {
		stockQuery := `SELECT stock, branch_id FROM product_stocks WHERE product_id = ?`
		stockRows, err := r.db.QueryContext(ctx, stockQuery, prod.ID)
		if err != nil {
			continue
		}
		var stocks []dto_tenant_umkm.PublicProductStock
		for stockRows.Next() {
			var s dto_tenant_umkm.PublicProductStock
			if err := stockRows.Scan(&s.Stock, &s.BranchID); err == nil {
				stocks = append(stocks, s)
			}
		}
		stockRows.Close()
		products[i].ProductStocks = stocks
	}

	return products, nil
}

func (r *tenantUMKMRepository) GetPublicBranches(ctx context.Context, profileID string) ([]dto_tenant_umkm.PublicBranchInfo, error) {
	query := `
		SELECT id, name, address, phone_number, payment_qr
		FROM branches
		WHERE tenant_id = ? AND is_active = true
		ORDER BY name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var branches []dto_tenant_umkm.PublicBranchInfo
	for rows.Next() {
		var b dto_tenant_umkm.PublicBranchInfo
		err := rows.Scan(&b.ID, &b.Name, &b.Address, &b.PhoneNumber, &b.PaymentQR)
		if err != nil {
			return nil, err
		}
		branches = append(branches, b)
	}
	return branches, nil
}

func (r *tenantUMKMRepository) CreateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error) {
	var ownerRoleID string
	err := r.db.NewRaw("SELECT id FROM roles WHERE LOWER(name) = LOWER('Owner') LIMIT 1").Scan(ctx, &ownerRoleID)
	if err != nil {
		return nil, fmt.Errorf("role Owner tidak ditemukan")
	}

	id := req.ID
	if id == "" {
		id = generateUUID()
	}

	query := `
		INSERT INTO profiles (
			id, full_name, email, business_name, phone_number, address, role_id, is_active, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			full_name = EXCLUDED.full_name,
			business_name = EXCLUDED.business_name,
			phone_number = EXCLUDED.phone_number,
			address = EXCLUDED.address,
			role_id = EXCLUDED.role_id,
			is_active = true,
			updated_at = NOW()
		RETURNING id, full_name, business_name, email, phone_number, address, avatar_url, banner_url, bio, is_active, created_at, updated_at, branch_id, username, metadata, payment_qr
	`

	profile := new(dto_tenant_umkm.TenantProfileInfo)
	var createdAt, updatedAt time.Time
	var metadataBytes []byte
	err = r.db.NewRaw(query, id, req.FullName, req.Email, req.BusinessName, req.PhoneNumber, req.Address, ownerRoleID).
		Scan(ctx, &profile.ID, &profile.FullName, &profile.BusinessName, &profile.Email, &profile.PhoneNumber, &profile.Address,
			&profile.AvatarURL, &profile.BannerURL, &profile.Bio, &profile.IsActive, &createdAt, &updatedAt, &profile.BranchID,
			&profile.Username, &metadataBytes, &profile.PaymentQR)
	if err != nil {
		return nil, err
	}

	if len(metadataBytes) > 0 {
		profile.Metadata = metadataBytes
	}

	profile.CreatedAt = createdAt.Format(time.RFC3339)
	profile.UpdatedAt = updatedAt.Format(time.RFC3339)
	return profile, nil
}

func (r *tenantUMKMRepository) UpdateRegisterUMKM(ctx context.Context, req dto_tenant_umkm.CompleteRegisterUMKMRequest) (*dto_tenant_umkm.TenantProfileInfo, error) {
	if req.Username != nil && *req.Username != "" {
		var count int
		err := r.db.NewRaw("SELECT COUNT(*) FROM profiles WHERE username = ? AND id != ?", *req.Username, req.ID).Scan(ctx, &count)
		if err != nil {
			return nil, err
		}
		if count > 0 {
			return nil, fmt.Errorf("Username toko ini sudah digunakan oleh UMKM lain. Silakan pilih username lain.")
		}
	}

	var ownerRoleID string
	err := r.db.NewRaw("SELECT id FROM roles WHERE LOWER(name) = LOWER('Owner') LIMIT 1").Scan(ctx, &ownerRoleID)
	if err != nil {
		return nil, fmt.Errorf("role Owner tidak ditemukan")
	}

	setClause := "updated_at = NOW(), role_id = ?"
	args := []interface{}{ownerRoleID}

	if req.FullName != nil {
		setClause += ", full_name = ?"
		args = append(args, *req.FullName)
	}
	if req.BusinessName != nil {
		setClause += ", business_name = ?"
		args = append(args, *req.BusinessName)
	}
	if req.PhoneNumber != nil {
		setClause += ", phone_number = ?"
		args = append(args, *req.PhoneNumber)
	}
	if req.Address != nil {
		setClause += ", address = ?"
		args = append(args, *req.Address)
	}
	if req.Bio != nil {
		setClause += ", bio = ?"
		args = append(args, *req.Bio)
	}
	if req.AvatarURL != nil {
		setClause += ", avatar_url = ?"
		args = append(args, *req.AvatarURL)
	}
	if req.BannerURL != nil {
		setClause += ", banner_url = ?"
		args = append(args, *req.BannerURL)
	}
	if req.Username != nil {
		setClause += ", username = ?"
		args = append(args, *req.Username)
	}
	if req.PaymentQR != nil {
		setClause += ", payment_qr = ?"
		args = append(args, *req.PaymentQR)
	}
	if len(req.Metadata) > 0 {
		setClause += ", metadata = ?"
		args = append(args, req.Metadata)
	}

	args = append(args, req.ID)
	query := `
		UPDATE profiles
		SET ` + setClause + `
		WHERE id = ?
		RETURNING id, full_name, business_name, email, phone_number, address, avatar_url, banner_url, bio, is_active, created_at, updated_at, branch_id, username, metadata, payment_qr
	`

	profile := new(dto_tenant_umkm.TenantProfileInfo)
	var createdAt, updatedAt time.Time
	var metadataBytes []byte
	err = r.db.NewRaw(query, args...).
		Scan(ctx, &profile.ID, &profile.FullName, &profile.BusinessName, &profile.Email, &profile.PhoneNumber, &profile.Address,
			&profile.AvatarURL, &profile.BannerURL, &profile.Bio, &profile.IsActive, &createdAt, &updatedAt, &profile.BranchID,
			&profile.Username, &metadataBytes, &profile.PaymentQR)
	if err != nil {
		return nil, err
	}

	if len(metadataBytes) > 0 {
		profile.Metadata = metadataBytes
	}

	profile.CreatedAt = createdAt.Format(time.RFC3339)
	profile.UpdatedAt = updatedAt.Format(time.RFC3339)
	return profile, nil
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

