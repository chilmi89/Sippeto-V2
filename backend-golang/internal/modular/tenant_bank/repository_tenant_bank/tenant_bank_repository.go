package repository_tenant_bank

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"

	"backend-golang/internal/modular/tenant_bank/model_tenant_bank"

	"github.com/uptrace/bun"
)

type TenantBankRepository interface {
	FindByProfileID(ctx context.Context, profileID string) ([]model_tenant_bank.TenantBank, error)
	FindByID(ctx context.Context, id string) (*model_tenant_bank.TenantBank, error)
	Create(ctx context.Context, bank *model_tenant_bank.TenantBank) error
	Update(ctx context.Context, bank *model_tenant_bank.TenantBank) error
	Delete(ctx context.Context, id string) error
	SetPrimary(ctx context.Context, profileID string, id string) error
}

type tenantBankRepository struct {
	db *bun.DB
}

func NewTenantBankRepository(db *bun.DB) TenantBankRepository {
	return &tenantBankRepository{db: db}
}

func (r *tenantBankRepository) FindByProfileID(ctx context.Context, profileID string) ([]model_tenant_bank.TenantBank, error) {
	query := `
		SELECT id, profile_id, bank_name, account_number, account_name, is_active, is_primary, created_at, updated_at
		FROM tenant_banks
		WHERE profile_id = ?
		ORDER BY is_primary DESC, created_at DESC
	`
	var banks []model_tenant_bank.TenantBank
	err := r.db.NewRaw(query, profileID).Scan(ctx, &banks)
	if err != nil {
		return nil, err
	}
	if banks == nil {
		banks = []model_tenant_bank.TenantBank{}
	}
	return banks, nil
}

func (r *tenantBankRepository) FindByID(ctx context.Context, id string) (*model_tenant_bank.TenantBank, error) {
	bank := new(model_tenant_bank.TenantBank)
	query := `
		SELECT id, profile_id, bank_name, account_number, account_name, is_active, is_primary, created_at, updated_at
		FROM tenant_banks
		WHERE id = ?
	`
	err := r.db.NewRaw(query, id).Scan(ctx, bank)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return bank, nil
}

func (r *tenantBankRepository) Create(ctx context.Context, bank *model_tenant_bank.TenantBank) error {
	if bank.ID == "" {
		bank.ID = generateUUID()
	}
	query := `
		INSERT INTO tenant_banks (id, profile_id, bank_name, account_number, account_name, is_active, is_primary)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		RETURNING id, profile_id, bank_name, account_number, account_name, is_active, is_primary, created_at, updated_at
	`
	err := r.db.NewRaw(query, bank.ID, bank.ProfileID, bank.BankName, bank.AccountNumber, bank.AccountName, bank.IsActive, bank.IsPrimary).Scan(ctx, bank)
	return err
}

func (r *tenantBankRepository) Update(ctx context.Context, bank *model_tenant_bank.TenantBank) error {
	query := `
		UPDATE tenant_banks
		SET bank_name = ?, account_number = ?, account_name = ?, is_active = ?, is_primary = ?, updated_at = NOW()
		WHERE id = ?
		RETURNING id, profile_id, bank_name, account_number, account_name, is_active, is_primary, created_at, updated_at
	`
	err := r.db.NewRaw(query, bank.BankName, bank.AccountNumber, bank.AccountName, bank.IsActive, bank.IsPrimary, bank.ID).Scan(ctx, bank)
	return err
}

func (r *tenantBankRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.NewRaw(`DELETE FROM tenant_banks WHERE id = ?`, id).Exec(ctx)
	return err
}

func (r *tenantBankRepository) SetPrimary(ctx context.Context, profileID string, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Reset is_primary = false untuk semua rekening milik profile_id ini
	_, err = tx.NewRaw(`UPDATE tenant_banks SET is_primary = false WHERE profile_id = ?`, profileID).Exec(ctx)
	if err != nil {
		return err
	}

	// 2. Set is_primary = true untuk id yang dipilih
	_, err = tx.NewRaw(`UPDATE tenant_banks SET is_primary = true WHERE id = ? AND profile_id = ?`, id, profileID).Exec(ctx)
	if err != nil {
		return err
	}

	return tx.Commit()
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
