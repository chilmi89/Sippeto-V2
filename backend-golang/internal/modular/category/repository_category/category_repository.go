package repository_category

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"time"

	"backend-golang/internal/modular/category/dto_category"

	"github.com/uptrace/bun"
)

type CategoryRepository interface {
	FindCategories(ctx context.Context, page, limit int, typeFilter, search, profileID string) ([]dto_category.CategoryResponse, int, error)
	CreateCategory(ctx context.Context, req dto_category.CreateCategoryRequest) (*dto_category.CategoryResponse, error)
	UpdateCategory(ctx context.Context, req dto_category.UpdateCategoryRequest) (*dto_category.CategoryResponse, error)
	DeleteCategory(ctx context.Context, id string) error
}

type categoryRepository struct {
	db *bun.DB
}

func NewCategoryRepository(db *bun.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

type rawCategory struct {
	ID        string
	ProfileID sql.NullString
	Name      string
	Type      string
	CreatedAt time.Time
}

func (r *categoryRepository) FindCategories(ctx context.Context, page, limit int, typeFilter, search, profileID string) ([]dto_category.CategoryResponse, int, error) {
	offset := (page - 1) * limit
	whereClause := " WHERE 1=1"
	args := []interface{}{}

	if profileID != "" {
		whereClause += " AND (profile_id = ? OR profile_id IS NULL)"
		args = append(args, profileID)
	}

	if typeFilter != "" {
		whereClause += " AND type = ?"
		args = append(args, typeFilter)
	}

	if search != "" {
		whereClause += " AND name ILIKE ?"
		args = append(args, "%"+search+"%")
	}

	// Count
	countQuery := `SELECT COUNT(*) FROM categories` + whereClause
	var total int
	err := r.db.NewRaw(countQuery, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	// Data
	args = append(args, limit, offset)
	dataQuery := `
		SELECT id, profile_id, name, type, created_at
		FROM categories
	` + whereClause + `
		ORDER BY name ASC
		LIMIT ? OFFSET ?
	`

	var rows []rawCategory
	err = r.db.NewRaw(dataQuery, args...).Scan(ctx, &rows)
	if err != nil {
		return nil, 0, err
	}

	var categories []dto_category.CategoryResponse
	for _, row := range rows {
		var profID *string
		if row.ProfileID.Valid {
			profID = &row.ProfileID.String
		}

		categories = append(categories, dto_category.CategoryResponse{
			ID:        row.ID,
			ProfileID: profID,
			Name:      row.Name,
			Type:      row.Type,
			CreatedAt: row.CreatedAt.Format(time.RFC3339),
		})
	}

	return categories, total, nil
}

func (r *categoryRepository) CreateCategory(ctx context.Context, req dto_category.CreateCategoryRequest) (*dto_category.CategoryResponse, error) {
	id := generateUUID()
	query := `
		INSERT INTO categories (id, profile_id, name, type)
		VALUES (?, ?, ?, ?)
		RETURNING id, profile_id, name, type, created_at
	`
	var row rawCategory
	err := r.db.NewRaw(query, id, req.ProfileID, req.Name, req.Type).Scan(ctx, &row)
	if err != nil {
		return nil, err
	}

	var profID *string
	if row.ProfileID.Valid {
		profID = &row.ProfileID.String
	}

	return &dto_category.CategoryResponse{
		ID:        row.ID,
		ProfileID: profID,
		Name:      row.Name,
		Type:      row.Type,
		CreatedAt: row.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (r *categoryRepository) UpdateCategory(ctx context.Context, req dto_category.UpdateCategoryRequest) (*dto_category.CategoryResponse, error) {
	setClause := ""
	args := []interface{}{}

	if req.Name != nil {
		setClause += "name = ?"
		args = append(args, *req.Name)
	}

	if req.Type != nil {
		if setClause != "" {
			setClause += ", "
		}
		setClause += "type = ?"
		args = append(args, *req.Type)
	}

	if setClause == "" {
		return nil, fmt.Errorf("tidak ada data yang diupdate")
	}

	args = append(args, req.ID)
	query := `
		UPDATE categories
		SET ` + setClause + `
		WHERE id = ?
		RETURNING id, profile_id, name, type, created_at
	`

	var row rawCategory
	err := r.db.NewRaw(query, args...).Scan(ctx, &row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("kategori tidak ditemukan")
		}
		return nil, err
	}

	var profID *string
	if row.ProfileID.Valid {
		profID = &row.ProfileID.String
	}

	return &dto_category.CategoryResponse{
		ID:        row.ID,
		ProfileID: profID,
		Name:      row.Name,
		Type:      row.Type,
		CreatedAt: row.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (r *categoryRepository) DeleteCategory(ctx context.Context, id string) error {
	res, err := r.db.NewRaw(`DELETE FROM categories WHERE id = ?`, id).Exec(ctx)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("kategori tidak ditemukan")
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
