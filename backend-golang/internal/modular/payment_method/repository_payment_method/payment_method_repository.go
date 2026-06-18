package repository_payment_method

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"time"

	"backend-golang/internal/modular/payment_method/dto_payment_method"

	"github.com/uptrace/bun"
)

type PaymentMethodRepository interface {
	FindPaymentMethods(ctx context.Context, page, limit int, search, profileID string, isActiveFilter *bool) ([]dto_payment_method.PaymentMethodResponse, int, error)
	CreatePaymentMethod(ctx context.Context, req dto_payment_method.CreatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error)
	UpdatePaymentMethod(ctx context.Context, req dto_payment_method.UpdatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error)
	DeletePaymentMethod(ctx context.Context, id string) error
}

type paymentMethodRepository struct {
	db *bun.DB
}

func NewPaymentMethodRepository(db *bun.DB) PaymentMethodRepository {
	return &paymentMethodRepository{db: db}
}

type rawPaymentMethod struct {
	ID        string
	ProfileID sql.NullString
	Name      string
	IsActive  bool
	CreatedAt time.Time
}

func (r *paymentMethodRepository) FindPaymentMethods(ctx context.Context, page, limit int, search, profileID string, isActiveFilter *bool) ([]dto_payment_method.PaymentMethodResponse, int, error) {
	offset := (page - 1) * limit
	whereClause := " WHERE 1=1"
	args := []interface{}{}

	if profileID != "" {
		whereClause += " AND (profile_id = ? OR profile_id IS NULL)"
		args = append(args, profileID)
	}

	if search != "" {
		whereClause += " AND name ILIKE ?"
		args = append(args, "%"+search+"%")
	}

	if isActiveFilter != nil {
		whereClause += " AND is_active = ?"
		args = append(args, *isActiveFilter)
	}

	// Count
	countQuery := `SELECT COUNT(*) FROM payment_methods` + whereClause
	var total int
	err := r.db.NewRaw(countQuery, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	// Data
	args = append(args, limit, offset)
	dataQuery := `
		SELECT id, profile_id, name, is_active, created_at
		FROM payment_methods
	` + whereClause + `
		ORDER BY name ASC
		LIMIT ? OFFSET ?
	`

	var rows []rawPaymentMethod
	err = r.db.NewRaw(dataQuery, args...).Scan(ctx, &rows)
	if err != nil {
		return nil, 0, err
	}

	var methods []dto_payment_method.PaymentMethodResponse
	for _, row := range rows {
		var profID *string
		if row.ProfileID.Valid {
			profID = &row.ProfileID.String
		}

		methods = append(methods, dto_payment_method.PaymentMethodResponse{
			ID:        row.ID,
			ProfileID: profID,
			Name:      row.Name,
			IsActive:  row.IsActive,
			CreatedAt: row.CreatedAt.Format(time.RFC3339),
		})
	}

	return methods, total, nil
}

func (r *paymentMethodRepository) CreatePaymentMethod(ctx context.Context, req dto_payment_method.CreatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error) {
	// Check unique constraint: profile_id + name
	var count int
	if req.ProfileID != nil {
		_ = r.db.NewRaw(`SELECT COUNT(*) FROM payment_methods WHERE profile_id = ? AND name = ?`, req.ProfileID, req.Name).Scan(ctx, &count)
	} else {
		_ = r.db.NewRaw(`SELECT COUNT(*) FROM payment_methods WHERE profile_id IS NULL AND name = ?`, req.Name).Scan(ctx, &count)
	}
	if count > 0 {
		return nil, fmt.Errorf("metode pembayaran dengan nama ini sudah ada")
	}

	id := generateUUID()
	isActiveVal := true
	if req.IsActive != nil {
		isActiveVal = *req.IsActive
	}

	query := `
		INSERT INTO payment_methods (id, profile_id, name, is_active)
		VALUES (?, ?, ?, ?)
		RETURNING id, profile_id, name, is_active, created_at
	`
	var row rawPaymentMethod
	err := r.db.NewRaw(query, id, req.ProfileID, req.Name, isActiveVal).Scan(ctx, &row)
	if err != nil {
		return nil, err
	}

	var profID *string
	if row.ProfileID.Valid {
		profID = &row.ProfileID.String
	}

	return &dto_payment_method.PaymentMethodResponse{
		ID:        row.ID,
		ProfileID: profID,
		Name:      row.Name,
		IsActive:  row.IsActive,
		CreatedAt: row.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (r *paymentMethodRepository) UpdatePaymentMethod(ctx context.Context, req dto_payment_method.UpdatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error) {
	setClause := ""
	args := []interface{}{}

	if req.Name != nil {
		// Check unique constraint if name changes
		var existingProfileID sql.NullString
		_ = r.db.NewRaw(`SELECT profile_id FROM payment_methods WHERE id = ?`, req.ID).Scan(ctx, &existingProfileID)

		var count int
		if existingProfileID.Valid {
			_ = r.db.NewRaw(`SELECT COUNT(*) FROM payment_methods WHERE profile_id = ? AND name = ? AND id != ?`, existingProfileID.String, *req.Name, req.ID).Scan(ctx, &count)
		} else {
			_ = r.db.NewRaw(`SELECT COUNT(*) FROM payment_methods WHERE profile_id IS NULL AND name = ? AND id != ?`, *req.Name, req.ID).Scan(ctx, &count)
		}
		if count > 0 {
			return nil, fmt.Errorf("Nama sudah digunakan")
		}

		setClause += "name = ?"
		args = append(args, *req.Name)
	}

	if req.IsActive != nil {
		if setClause != "" {
			setClause += ", "
		}
		setClause += "is_active = ?"
		args = append(args, *req.IsActive)
	}

	if setClause == "" {
		return nil, fmt.Errorf("tidak ada data yang diupdate")
	}

	args = append(args, req.ID)
	query := `
		UPDATE payment_methods
		SET ` + setClause + `
		WHERE id = ?
		RETURNING id, profile_id, name, is_active, created_at
	`

	var row rawPaymentMethod
	err := r.db.NewRaw(query, args...).Scan(ctx, &row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("metode pembayaran tidak ditemukan")
		}
		return nil, err
	}

	var profID *string
	if row.ProfileID.Valid {
		profID = &row.ProfileID.String
	}

	return &dto_payment_method.PaymentMethodResponse{
		ID:        row.ID,
		ProfileID: profID,
		Name:      row.Name,
		IsActive:  row.IsActive,
		CreatedAt: row.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (r *paymentMethodRepository) DeletePaymentMethod(ctx context.Context, id string) error {
	// Check if payment method is used in transaction items (foreign key constraint)
	var count int
	_ = r.db.NewRaw(`SELECT COUNT(*) FROM transaction_items WHERE payment_method_id = ?`, id).Scan(ctx, &count)
	if count > 0 {
		return fmt.Errorf("Tidak bisa dihapus — metode ini masih digunakan pada transaksi")
	}

	res, err := r.db.NewRaw(`DELETE FROM payment_methods WHERE id = ?`, id).Exec(ctx)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("metode pembayaran tidak ditemukan")
	}
	return nil
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
