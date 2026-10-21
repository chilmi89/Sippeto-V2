package repository_auth

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"backend-golang/internal/modular/auth/model_auth"

	"github.com/uptrace/bun"
)

type AuthRepository interface {
	FindByEmail(ctx context.Context, email string) (*model_auth.Profile, error)
	FindByEmailAndPhone(ctx context.Context, email, phone string) (*model_auth.Profile, error)
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
	query := `INSERT INTO profiles (id, role_id, full_name, email, password, is_active, created_at, updated_at) 
	          VALUES (?, (SELECT id FROM roles WHERE LOWER(name) = 'owner' LIMIT 1), ?, ?, ?, true, NOW(), NOW())`
	_, err := r.db.NewRaw(query, id, fullName, email, hashedPassword).Exec(ctx)
	return err
}

func (r *authRepository) FindByEmailAndPhone(ctx context.Context, email, phone string) (*model_auth.Profile, error) {
	profile, err := r.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, errors.New("Akun dengan email tersebut tidak ditemukan.")
	}

	cleanInput := cleanPhone(phone)
	cleanStored := cleanPhone(profile.PhoneNumber)

	if cleanInput == "" || cleanStored == "" {
		return nil, errors.New("Nomor telepon tidak valid atau belum terdaftar pada akun ini.")
	}

	normInput := strings.TrimPrefix(cleanInput, "0")
	normStored := strings.TrimPrefix(cleanStored, "0")

	if normInput != normStored {
		return nil, errors.New("Nomor telepon tidak cocok dengan nomor terdaftar.")
	}

	return profile, nil
}

func cleanPhone(p string) string {
	var digits strings.Builder
	for _, r := range p {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	s := digits.String()
	if strings.HasPrefix(s, "62") {
		s = "0" + s[2:]
	}
	return s
}


