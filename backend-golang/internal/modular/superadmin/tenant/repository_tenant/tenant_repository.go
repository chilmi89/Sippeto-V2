package repository_tenant

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"backend-golang/internal/modular/superadmin/tenant/dto_tenant"

	"github.com/uptrace/bun"
)

type TenantRepository interface {
	FindTenants(ctx context.Context, page, limit int, search, status string) ([]dto_tenant.TenantResponse, int, error)
	GetTenantStats(ctx context.Context) (dto_tenant.TenantStats, error)
	UpdateTenant(ctx context.Context, req dto_tenant.UpdateTenantRequest) (*dto_tenant.TenantResponse, error)
}

type tenantRepository struct {
	db *bun.DB
}

func NewTenantRepository(db *bun.DB) TenantRepository {
	return &tenantRepository{db: db}
}

type rawTenantRow struct {
	ID           string
	FullName     sql.NullString
	BusinessName sql.NullString
	Email        string
	PhoneNumber  sql.NullString
	IsActive     bool
	CreatedAt    time.Time
	AvatarURL    sql.NullString
	Metadata     sql.NullString
	RoleName     sql.NullString
}

func (r *tenantRepository) FindTenants(ctx context.Context, page, limit int, search, status string) ([]dto_tenant.TenantResponse, int, error) {
	offset := (page - 1) * limit
	whereClause := " WHERE 1=1"
	args := []interface{}{}

	if search != "" {
		whereClause += " AND (p.full_name ILIKE ? OR p.business_name ILIKE ? OR p.email ILIKE ?)"
		likeArg := "%" + search + "%"
		args = append(args, likeArg, likeArg, likeArg)
	}

	if status == "aktif" {
		whereClause += " AND p.is_active = true"
	} else if status == "nonaktif" {
		whereClause += " AND p.is_active = false"
	}

	// Count query
	countQuery := `SELECT COUNT(*) FROM profiles p` + whereClause
	var total int
	err := r.db.NewRaw(countQuery, args...).Scan(ctx, &total)
	if err != nil {
		return nil, 0, err
	}

	// Data query
	args = append(args, limit, offset)
	dataQuery := `
		SELECT p.id, p.full_name, p.business_name, p.email, p.phone_number, p.is_active, p.created_at, p.avatar_url, p.metadata, r.name AS role_name
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
	` + whereClause + `
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	var rows []rawTenantRow
	err = r.db.NewRaw(dataQuery, args...).Scan(ctx, &rows)
	if err != nil {
		return nil, 0, err
	}

	var tenants []dto_tenant.TenantResponse
	for _, row := range rows {
		var meta map[string]interface{}
		if row.Metadata.Valid && row.Metadata.String != "" {
			_ = json.Unmarshal([]byte(row.Metadata.String), &meta)
		}
		if meta == nil {
			meta = make(map[string]interface{})
		}

		var fullName *string
		if row.FullName.Valid {
			fullName = &row.FullName.String
		}
		var businessName *string
		if row.BusinessName.Valid {
			businessName = &row.BusinessName.String
		}
		var phoneNumber *string
		if row.PhoneNumber.Valid {
			phoneNumber = &row.PhoneNumber.String
		}
		var avatarURL *string
		if row.AvatarURL.Valid {
			avatarURL = &row.AvatarURL.String
		}

		var roleInfo *dto_tenant.TenantRoleInfo
		if row.RoleName.Valid {
			roleInfo = &dto_tenant.TenantRoleInfo{Name: row.RoleName.String}
		}

		tenants = append(tenants, dto_tenant.TenantResponse{
			ID:           row.ID,
			FullName:     fullName,
			BusinessName: businessName,
			Email:        row.Email,
			PhoneNumber:  phoneNumber,
			IsActive:     row.IsActive,
			CreatedAt:    row.CreatedAt.Format(time.RFC3339),
			AvatarURL:    avatarURL,
			Metadata:     meta,
			Roles:        roleInfo,
		})
	}

	return tenants, total, nil
}

func (r *tenantRepository) GetTenantStats(ctx context.Context) (dto_tenant.TenantStats, error) {
	var stats dto_tenant.TenantStats

	err := r.db.NewRaw(`SELECT COUNT(*) FROM profiles`).Scan(ctx, &stats.Total)
	if err != nil {
		return stats, err
	}

	err = r.db.NewRaw(`SELECT COUNT(*) FROM profiles WHERE is_active = true`).Scan(ctx, &stats.Aktif)
	if err != nil {
		return stats, err
	}

	err = r.db.NewRaw(`SELECT COUNT(*) FROM profiles WHERE is_active = false`).Scan(ctx, &stats.Nonaktif)
	if err != nil {
		return stats, err
	}

	stats.Menunggu = stats.Nonaktif
	return stats, nil
}

func (r *tenantRepository) UpdateTenant(ctx context.Context, req dto_tenant.UpdateTenantRequest) (*dto_tenant.TenantResponse, error) {
	// 1. Ambil data lama
	var existingMetadata sql.NullString
	var existingIsActive bool
	err := r.db.NewRaw(`SELECT metadata, is_active FROM profiles WHERE id = ?`, req.ID).Scan(ctx, &existingMetadata, &existingIsActive)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("tenant tidak ditemukan")
		}
		return nil, err
	}

	// 2. Siapkan update metadata
	var meta map[string]interface{}
	if existingMetadata.Valid && existingMetadata.String != "" {
		_ = json.Unmarshal([]byte(existingMetadata.String), &meta)
	}
	if meta == nil {
		meta = make(map[string]interface{})
	}

	if req.BranchesEnabled != nil {
		meta["branches_enabled"] = *req.BranchesEnabled
	}

	metaBytes, err := json.Marshal(meta)
	if err != nil {
		return nil, err
	}

	isActiveVal := existingIsActive
	if req.IsActive != nil {
		isActiveVal = *req.IsActive
	}

	// 3. Update profil
	_, err = r.db.NewRaw(`
		UPDATE profiles
		SET is_active = ?, metadata = ?, updated_at = NOW()
		WHERE id = ?
	`, isActiveVal, string(metaBytes), req.ID).Exec(ctx)
	if err != nil {
		return nil, err
	}

	// 4. Ambil profil terupdate untuk dikembalikan
	var updatedRow rawTenantRow
	err = r.db.NewRaw(`
		SELECT p.id, p.full_name, p.business_name, p.email, p.phone_number, p.is_active, p.created_at, p.avatar_url, p.metadata, r.name AS role_name
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
		WHERE p.id = ?
	`, req.ID).Scan(ctx, &updatedRow)
	if err != nil {
		return nil, err
	}

	var updatedMeta map[string]interface{}
	if updatedRow.Metadata.Valid && updatedRow.Metadata.String != "" {
		_ = json.Unmarshal([]byte(updatedRow.Metadata.String), &updatedMeta)
	}
	if updatedMeta == nil {
		updatedMeta = make(map[string]interface{})
	}

	var fullName *string
	if updatedRow.FullName.Valid {
		fullName = &updatedRow.FullName.String
	}
	var businessName *string
	if updatedRow.BusinessName.Valid {
		businessName = &updatedRow.BusinessName.String
	}
	var phoneNumber *string
	if updatedRow.PhoneNumber.Valid {
		phoneNumber = &updatedRow.PhoneNumber.String
	}
	var avatarURL *string
	if updatedRow.AvatarURL.Valid {
		avatarURL = &updatedRow.AvatarURL.String
	}

	var roleInfo *dto_tenant.TenantRoleInfo
	if updatedRow.RoleName.Valid {
		roleInfo = &dto_tenant.TenantRoleInfo{Name: updatedRow.RoleName.String}
	}

	return &dto_tenant.TenantResponse{
		ID:           updatedRow.ID,
		FullName:     fullName,
		BusinessName: businessName,
		Email:        updatedRow.Email,
		PhoneNumber:  phoneNumber,
		IsActive:     updatedRow.IsActive,
		CreatedAt:    updatedRow.CreatedAt.Format(time.RFC3339),
		AvatarURL:    avatarURL,
		Metadata:     updatedMeta,
		Roles:        roleInfo,
	}, nil
}
