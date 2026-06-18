package repository_auth

import (
	"context"
	"database/sql"

	"backend-golang/internal/modular/auth/model_auth"

	"github.com/uptrace/bun"
)

type AuthRepository interface {
	FindByEmail(ctx context.Context, email string) (*model_auth.Profile, error)
	UpdatePassword(ctx context.Context, email string, hashedPassword string) error
	CreateProfile(ctx context.Context, id, fullName, email, hashedPassword string) error
}

type authRepository struct {
	db *bun.DB
}

func NewAuthRepository(db *bun.DB) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) FindByEmail(ctx context.Context, email string) (*model_auth.Profile, error) {
	profile := new(model_auth.Profile)
	err := r.db.NewSelect().
		Model(profile).
		Relation("Role").
		Where("p.email = ?", email).
		Scan(ctx)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return profile, nil
}

func (r *authRepository) UpdatePassword(ctx context.Context, email string, hashedPassword string) error {
	// Menggunakan SQL query syntax (Raw Query) sesuai dengan aturan user_global
	query := "UPDATE profiles SET password = ?, updated_at = NOW() WHERE email = ?"
	_, err := r.db.NewRaw(query, hashedPassword, email).Exec(ctx)
	return err
}

func (r *authRepository) CreateProfile(ctx context.Context, id, fullName, email, hashedPassword string) error {
	query := "INSERT INTO profiles (id, full_name, email, password, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, true, NOW(), NOW())"
	_, err := r.db.NewRaw(query, id, fullName, email, hashedPassword).Exec(ctx)
	return err
}


