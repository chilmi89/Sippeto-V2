package repository_branch

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"

	"backend-golang/internal/modular/branch/dto_branch"
	"backend-golang/internal/modular/branch/model_branch"

	"github.com/uptrace/bun"
	"golang.org/x/crypto/bcrypt"
)

type BranchRepository interface {
	FindByID(ctx context.Context, id string) (*model_branch.Branch, error)
	FindByTenantID(ctx context.Context, tenantID string) ([]model_branch.Branch, error)
	GetStaffByBranchID(ctx context.Context, branchID string) ([]dto_branch.BranchStaffResponse, error)
	GetTransactionCountByBranchID(ctx context.Context, branchID string) (int, error)
	Create(ctx context.Context, branch *model_branch.Branch, managerReq *dto_branch.CreateBranchRequest) error
	Update(ctx context.Context, branch *model_branch.Branch) error
	Delete(ctx context.Context, id string) error
	CheckEmailExists(ctx context.Context, email string) (bool, error)
	ResolveTenantID(ctx context.Context, userID string) (string, error)
}

type branchRepository struct {
	db *bun.DB
}

func NewBranchRepository(db *bun.DB) BranchRepository {
	return &branchRepository{db: db}
}

func (r *branchRepository) FindByID(ctx context.Context, id string) (*model_branch.Branch, error) {
	branch := new(model_branch.Branch)
	query := `
		SELECT id, tenant_id, name, address, phone_number, is_active, created_at, updated_at, payment_qr
		FROM branches
		WHERE id = ?
	`
	err := r.db.NewRaw(query, id).Scan(ctx, branch)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return branch, nil
}

func (r *branchRepository) FindByTenantID(ctx context.Context, tenantID string) ([]model_branch.Branch, error) {
	var branches []model_branch.Branch
	query := `
		SELECT id, tenant_id, name, address, phone_number, is_active, created_at, updated_at, payment_qr
		FROM branches
		WHERE tenant_id = ?
		ORDER BY name ASC
	`
	err := r.db.NewRaw(query, tenantID).Scan(ctx, &branches)
	if err != nil {
		return nil, err
	}
	return branches, nil
}

func (r *branchRepository) GetStaffByBranchID(ctx context.Context, branchID string) ([]dto_branch.BranchStaffResponse, error) {
	var staff []dto_branch.BranchStaffResponse
	query := `
		SELECT id, full_name, email, is_active
		FROM profiles
		WHERE branch_id = ?
		ORDER BY full_name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, branchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s dto_branch.BranchStaffResponse
		if err := rows.Scan(&s.ID, &s.FullName, &s.Email, &s.IsActive); err != nil {
			return nil, err
		}
		staff = append(staff, s)
	}
	return staff, nil
}

func (r *branchRepository) GetTransactionCountByBranchID(ctx context.Context, branchID string) (int, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM transaction_groups
		WHERE branch_id = ?
	`
	err := r.db.NewRaw(query, branchID).Scan(ctx, &count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *branchRepository) CheckEmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(SELECT 1 FROM profiles WHERE email = ?)
	`
	err := r.db.NewRaw(query, email).Scan(ctx, &exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (r *branchRepository) Create(ctx context.Context, branch *model_branch.Branch, managerReq *dto_branch.CreateBranchRequest) error {
	branch.ID = generateUUID()

	// Mulai transaksi database jika ada input pengelola
	if managerReq != nil && managerReq.ManagerEmail != nil && *managerReq.ManagerEmail != "" {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer tx.Rollback()

		// A. Insert Cabang
		queryBranch := `
			INSERT INTO branches (id, tenant_id, name, address, phone_number, is_active, payment_qr)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			RETURNING id, created_at, updated_at
		`
		err = tx.NewRaw(queryBranch,
			branch.ID, branch.TenantID, branch.Name, branch.Address, branch.PhoneNumber, branch.IsActive, branch.PaymentQR,
		).Scan(ctx, branch)
		if err != nil {
			return err
		}

		// B. Buat Akun Pengelola
		// Cari ID Role 'UMKM' atau 'owner'
		var roleID string
		queryRole := `SELECT id FROM roles WHERE name = 'UMKM' OR name = 'owner' LIMIT 1`
		err = tx.NewRaw(queryRole).Scan(ctx, &roleID)
		if err != nil {
			return err
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*managerReq.ManagerPassword), 10)
		if err != nil {
			return err
		}

		businessName := fmt.Sprintf("%s (Franchise/Cabang)", branch.Name)
		managerID := generateUUID()

		queryProfile := `
			INSERT INTO profiles (id, role_id, email, password, full_name, business_name, phone_number, address, branch_id, is_active)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)
		`
		_, err = tx.NewRaw(queryProfile,
			managerID, roleID, *managerReq.ManagerEmail, string(hashedPassword),
			*managerReq.ManagerName, businessName, branch.PhoneNumber, branch.Address, branch.ID,
		).Exec(ctx)
		if err != nil {
			return err
		}

		return tx.Commit()
	}

	// Jika tidak ada data pengelola, lakukan insert cabang biasa
	queryBranch := `
		INSERT INTO branches (id, tenant_id, name, address, phone_number, is_active, payment_qr)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		RETURNING id, created_at, updated_at
	`
	err := r.db.NewRaw(queryBranch,
		branch.ID, branch.TenantID, branch.Name, branch.Address, branch.PhoneNumber, branch.IsActive, branch.PaymentQR,
	).Scan(ctx, branch)
	return err
}

func (r *branchRepository) Update(ctx context.Context, branch *model_branch.Branch) error {
	query := `
		UPDATE branches SET
			name = ?, address = ?, phone_number = ?, is_active = ?, payment_qr = ?,
			updated_at = NOW()
		WHERE id = ?
		RETURNING id, created_at, updated_at
	`
	err := r.db.NewRaw(query,
		branch.Name, branch.Address, branch.PhoneNumber, branch.IsActive, branch.PaymentQR,
		branch.ID,
	).Scan(ctx, branch)
	return err
}

func (r *branchRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM branches WHERE id = ?`
	_, err := r.db.NewRaw(query, id).Exec(ctx)
	return err
}

func (r *branchRepository) ResolveTenantID(ctx context.Context, userID string) (string, error) {
	var branchID sql.NullString
	queryProfile := `SELECT branch_id FROM profiles WHERE id = ?`
	err := r.db.NewRaw(queryProfile, userID).Scan(ctx, &branchID)
	if err != nil {
		return "", err
	}

	if branchID.Valid && branchID.String != "" {
		var tenantID string
		queryBranch := `SELECT tenant_id FROM branches WHERE id = ?`
		err = r.db.NewRaw(queryBranch, branchID.String).Scan(ctx, &tenantID)
		if err != nil {
			return "", err
		}
		return tenantID, nil
	}

	return userID, nil
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
