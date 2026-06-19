package repository_profile

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"

	"backend-golang/internal/modular/profile/model_profile"

	"github.com/uptrace/bun"
)

type ProfileRepository interface {
	FindByID(ctx context.Context, id string) (*model_profile.Profile, error)
	FindPermissionsByRoleID(ctx context.Context, roleID string) ([]string, error)
	FindAll(ctx context.Context) ([]model_profile.Profile, error)
	FindByEmail(ctx context.Context, email string) (*model_profile.Profile, error)
	Create(ctx context.Context, profile *model_profile.Profile) error
	Update(ctx context.Context, profile *model_profile.Profile) error
	Delete(ctx context.Context, id string) error
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
			p.password, p.is_active, p.metadata, p.created_at, p.updated_at, p.branch_id, p.payment_qr,
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

func (r *profileRepository) FindAll(ctx context.Context) ([]model_profile.Profile, error) {
	var profiles []model_profile.Profile
	query := `
		SELECT 
			p.id, p.role_id, p.email, p.full_name, p.business_name, p.username,
			p.phone_number, p.address, p.avatar_url, p.banner_url, p.bio, 
			p.is_active, p.metadata, p.created_at, p.updated_at, p.branch_id, p.payment_qr,
			r.name AS role_name
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
		ORDER BY p.created_at DESC
	`
	err := r.db.NewRaw(query).Scan(ctx, &profiles)
	if err != nil {
		return nil, err
	}
	return profiles, nil
}

func (r *profileRepository) FindByEmail(ctx context.Context, email string) (*model_profile.Profile, error) {
	profile := new(model_profile.Profile)
	query := `
		SELECT 
			p.id, p.role_id, p.email, p.full_name, p.business_name, p.username,
			p.phone_number, p.address, p.avatar_url, p.banner_url, p.bio, 
			p.password, p.is_active, p.metadata, p.created_at, p.updated_at, p.branch_id, p.payment_qr,
			r.name AS role_name
		FROM profiles p
		LEFT JOIN roles r ON p.role_id = r.id
		WHERE p.email = ?
	`
	err := r.db.NewRaw(query, email).Scan(ctx, profile)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return profile, nil
}

func (r *profileRepository) Create(ctx context.Context, profile *model_profile.Profile) error {
	profile.ID = generateUUID()
	query := `
		INSERT INTO profiles (
			id, role_id, email, password, full_name, business_name, 
			phone_number, is_active, branch_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		RETURNING id, created_at, updated_at
	`
	err := r.db.NewRaw(query, 
		profile.ID, profile.RoleID, profile.Email, profile.Password, 
		profile.FullName, profile.BusinessName, profile.PhoneNumber, 
		profile.IsActive, profile.BranchID,
	).Scan(ctx, profile)
	return err
}

func (r *profileRepository) Update(ctx context.Context, profile *model_profile.Profile) error {
	query := `
		UPDATE profiles SET 
			role_id = ?, email = ?, password = ?, full_name = ?, 
			business_name = ?, phone_number = ?, is_active = ?, branch_id = ?,
			updated_at = NOW()
		WHERE id = ?
		RETURNING id, created_at, updated_at
	`
	err := r.db.NewRaw(query, 
		profile.RoleID, profile.Email, profile.Password, profile.FullName, 
		profile.BusinessName, profile.PhoneNumber, profile.IsActive, profile.BranchID,
		profile.ID,
	).Scan(ctx, profile)
	return err
}

func (r *profileRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM profiles WHERE id = ?"
	_, err := r.db.NewRaw(query, id).Exec(ctx)
	return err
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
