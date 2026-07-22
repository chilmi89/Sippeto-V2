package repository_discount

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"backend-golang/internal/modular/discount/model_discount"
	"github.com/uptrace/bun"
)

type DiscountRepository interface {
	FindDiscountsPaginated(ctx context.Context, page, limit int, search, profileID string) ([]model_discount.Discount, int, error)
	FindDiscountByID(ctx context.Context, id string) (*model_discount.Discount, error)
	FindDiscountByCode(ctx context.Context, profileID, code string) (*model_discount.Discount, error)
	CreateDiscount(ctx context.Context, disc *model_discount.Discount) error
	UpdateDiscount(ctx context.Context, disc *model_discount.Discount) error
	DeleteDiscount(ctx context.Context, id string) error
	GetDiscountProductIDs(ctx context.Context, discountID string) ([]string, error)
	ToggleDiscountProduct(ctx context.Context, discountID, productID string, enabled bool) error
}

type discountRepository struct {
	db *bun.DB
}

func NewDiscountRepository(db *bun.DB) DiscountRepository {
	return &discountRepository{db: db}
}

type rawDiscount struct {
	ID          string          `bun:"id"`
	ProfileID   string          `bun:"profile_id"`
	Code        sql.NullString  `bun:"code"`
	Name        string          `bun:"name"`
	Type        string          `bun:"type"`
	Value       float64         `bun:"value"`
	MinPurchase float64         `bun:"min_purchase"`
	MaxDiscount sql.NullFloat64 `bun:"max_discount"`
	StartDate   sql.NullTime    `bun:"start_date"`
	EndDate     sql.NullTime    `bun:"end_date"`
	IsActive    bool            `bun:"is_active"`
	CreatedAt   time.Time       `bun:"created_at"`
}

func (r *discountRepository) FindDiscountsPaginated(ctx context.Context, page, limit int, search, profileID string) ([]model_discount.Discount, int, error) {
	offset := (page - 1) * limit
	whereClause := " WHERE 1=1"
	var args []interface{}

	if profileID != "" {
		whereClause += " AND profile_id = ?"
		args = append(args, profileID)
	}

	if search != "" {
		whereClause += " AND (name ILIKE ? OR code ILIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	countQuery := `SELECT COUNT(*) FROM discounts` + whereClause
	var total int
	err := r.db.NewRaw(countQuery, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	args = append(args, limit, offset)
	dataQuery := `
		SELECT id, profile_id, code, name, type, value, min_purchase, max_discount, start_date, end_date, is_active, created_at
		FROM discounts
	` + whereClause + `
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	var rows []rawDiscount
	err = r.db.NewRaw(dataQuery, args...).Scan(ctx, &rows)
	if err != nil {
		return nil, 0, err
	}

	var result []model_discount.Discount
	for _, row := range rows {
		var codePtr *string
		if row.Code.Valid {
			c := row.Code.String
			codePtr = &c
		}

		var maxDiscPtr *float64
		if row.MaxDiscount.Valid {
			m := row.MaxDiscount.Float64
			maxDiscPtr = &m
		}

		var startPtr *time.Time
		if row.StartDate.Valid {
			s := row.StartDate.Time
			startPtr = &s
		}

		var endPtr *time.Time
		if row.EndDate.Valid {
			e := row.EndDate.Time
			endPtr = &e
		}

		result = append(result, model_discount.Discount{
			ID:          row.ID,
			ProfileID:   row.ProfileID,
			Code:        codePtr,
			Name:        row.Name,
			Type:        row.Type,
			Value:       row.Value,
			MinPurchase: row.MinPurchase,
			MaxDiscount: maxDiscPtr,
			StartDate:   startPtr,
			EndDate:     endPtr,
			IsActive:    row.IsActive,
			CreatedAt:   row.CreatedAt,
		})
	}

	return result, total, nil
}

func (r *discountRepository) FindDiscountByID(ctx context.Context, id string) (*model_discount.Discount, error) {
	query := `
		SELECT id, profile_id, code, name, type, value, min_purchase, max_discount, start_date, end_date, is_active, created_at
		FROM discounts
		WHERE id = ?
	`
	var row rawDiscount
	err := r.db.NewRaw(query, id).Scan(ctx, &row)
	if err != nil {
		return nil, err
	}

	var codePtr *string
	if row.Code.Valid {
		c := row.Code.String
		codePtr = &c
	}
	var maxDiscPtr *float64
	if row.MaxDiscount.Valid {
		m := row.MaxDiscount.Float64
		maxDiscPtr = &m
	}
	var startPtr *time.Time
	if row.StartDate.Valid {
		s := row.StartDate.Time
		startPtr = &s
	}
	var endPtr *time.Time
	if row.EndDate.Valid {
		e := row.EndDate.Time
		endPtr = &e
	}

	return &model_discount.Discount{
		ID:          row.ID,
		ProfileID:   row.ProfileID,
		Code:        codePtr,
		Name:        row.Name,
		Type:        row.Type,
		Value:       row.Value,
		MinPurchase: row.MinPurchase,
		MaxDiscount: maxDiscPtr,
		StartDate:   startPtr,
		EndDate:     endPtr,
		IsActive:    row.IsActive,
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *discountRepository) FindDiscountByCode(ctx context.Context, profileID, code string) (*model_discount.Discount, error) {
	query := `
		SELECT id, profile_id, code, name, type, value, min_purchase, max_discount, start_date, end_date, is_active, created_at
		FROM discounts
		WHERE profile_id = ? AND UPPER(code) = UPPER(?) AND is_active = true
		LIMIT 1
	`
	var row rawDiscount
	err := r.db.NewRaw(query, profileID, code).Scan(ctx, &row)
	if err != nil {
		return nil, err
	}

	var codePtr *string
	if row.Code.Valid {
		c := row.Code.String
		codePtr = &c
	}
	var maxDiscPtr *float64
	if row.MaxDiscount.Valid {
		m := row.MaxDiscount.Float64
		maxDiscPtr = &m
	}
	var startPtr *time.Time
	if row.StartDate.Valid {
		s := row.StartDate.Time
		startPtr = &s
	}
	var endPtr *time.Time
	if row.EndDate.Valid {
		e := row.EndDate.Time
		endPtr = &e
	}

	return &model_discount.Discount{
		ID:          row.ID,
		ProfileID:   row.ProfileID,
		Code:        codePtr,
		Name:        row.Name,
		Type:        row.Type,
		Value:       row.Value,
		MinPurchase: row.MinPurchase,
		MaxDiscount: maxDiscPtr,
		StartDate:   startPtr,
		EndDate:     endPtr,
		IsActive:    row.IsActive,
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *discountRepository) CreateDiscount(ctx context.Context, disc *model_discount.Discount) error {
	query := `
		INSERT INTO discounts (profile_id, code, name, type, value, min_purchase, max_discount, start_date, end_date, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		RETURNING id, created_at
	`
	err := r.db.NewRaw(query,
		disc.ProfileID,
		disc.Code,
		disc.Name,
		disc.Type,
		disc.Value,
		disc.MinPurchase,
		disc.MaxDiscount,
		disc.StartDate,
		disc.EndDate,
		disc.IsActive,
	).Scan(ctx, disc)
	return err
}

func (r *discountRepository) UpdateDiscount(ctx context.Context, disc *model_discount.Discount) error {
	query := `
		UPDATE discounts
		SET code = ?, name = ?, type = ?, value = ?, min_purchase = ?, max_discount = ?, start_date = ?, end_date = ?, is_active = ?
		WHERE id = ?
	`
	res, err := r.db.ExecContext(ctx, query,
		disc.Code,
		disc.Name,
		disc.Type,
		disc.Value,
		disc.MinPurchase,
		disc.MaxDiscount,
		disc.StartDate,
		disc.EndDate,
		disc.IsActive,
		disc.ID,
	)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("diskon tidak ditemukan")
	}
	return nil
}

func (r *discountRepository) DeleteDiscount(ctx context.Context, id string) error {
	query := `DELETE FROM discounts WHERE id = ?`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("diskon tidak ditemukan")
	}
	return nil
}

func (r *discountRepository) GetDiscountProductIDs(ctx context.Context, discountID string) ([]string, error) {
	query := `SELECT product_id FROM discount_products WHERE discount_id = ?`
	var productIDs []string
	err := r.db.NewRaw(query, discountID).Scan(ctx, &productIDs)
	if err != nil {
		return nil, err
	}
	if productIDs == nil {
		productIDs = []string{}
	}
	return productIDs, nil
}

func (r *discountRepository) ToggleDiscountProduct(ctx context.Context, discountID, productID string, enabled bool) error {
	if enabled {
		query := `
			INSERT INTO discount_products (discount_id, product_id)
			VALUES (?, ?)
			ON CONFLICT (discount_id, product_id) DO NOTHING
		`
		_, err := r.db.ExecContext(ctx, query, discountID, productID)
		return err
	}
	query := `DELETE FROM discount_products WHERE discount_id = ? AND product_id = ?`
	_, err := r.db.ExecContext(ctx, query, discountID, productID)
	return err
}
