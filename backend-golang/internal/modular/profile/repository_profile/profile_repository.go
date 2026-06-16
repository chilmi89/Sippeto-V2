package repository_profile

import (
	"context"
	"database/sql"

	"backend-golang/internal/modular/profile/model_profile"

	"github.com/uptrace/bun"
)

type ProfileRepository interface {
	FindByID(ctx context.Context, id string) (*model_profile.Profile, error)
	FindPermissionsByRoleID(ctx context.Context, roleID string) ([]string, error)
}

type profileRepository struct {
	db *bun.DB
}

func NewProfileRepository(db *bun.DB) ProfileRepository {
	return &profileRepository{db: db}
}

func (r *profileRepository) FindByID(ctx context.Context, id string) (*model_profile.Profile, error) {
	profile := new(model_profile.Profile)

	// Menggunakan SQL query syntax (Raw Query) sesuai dengan aturan user_global
	query := `
		SELECT 
			p.id, p.role_id, p.email, p.full_name, p.business_name, p.username,
			p.phone_number, p.address, p.avatar_url, p.banner_url, p.bio, 
			p.is_active, p.created_at, p.updated_at, p.branch_id, p.payment_qr,
			r.name AS role_name
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
		WHERE p.id = ?
	`

	err := r.db.NewRaw(query, id).Scan(ctx, profile)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Memetakan role_name hasil join jika ada
	if profile.RoleName != "" {
		// role_name berhasil dimuat
	}

	return profile, nil
}

func (r *profileRepository) FindPermissionsByRoleID(ctx context.Context, roleID string) ([]string, error) {
	var permissions []string

	// Menggunakan SQL query syntax (Raw Query) sesuai dengan aturan user_global
	query := `
		SELECT pe.name
		FROM role_permissions rp
		JOIN permissions pe ON rp.permission_id = pe.id
		WHERE rp.role_id = ?
	`

	rows, err := r.db.QueryContext(ctx, query, roleID)
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
