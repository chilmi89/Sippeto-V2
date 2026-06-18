package db

import (
	"context"
	"log"

	"github.com/uptrace/bun"
	"golang.org/x/crypto/bcrypt"
)

func RunSeed(db *bun.DB) error {
	ctx := context.Background()

	roles := []struct {
		name string
		id   string
	}{
		{"superadmin", "00000000-0000-0000-0000-000000000001"},
		{"admin", "00000000-0000-0000-0000-000000000002"},
		{"owner", "00000000-0000-0000-0000-000000000003"},
		{"user", "00000000-0000-0000-0000-000000000004"},
	}

	for _, r := range roles {
		_, err := db.ExecContext(ctx,
			`INSERT INTO roles (id, name, created_at) VALUES (?, ?, NOW()) ON CONFLICT (name) DO NOTHING`,
			r.id, r.name,
		)
		if err != nil {
			log.Printf("Gagal insert role %s: %v", r.name, err)
		}
	}

	permissions := []struct {
		name string
		id   string
	}{
		{"manage_users", "10000000-0000-0000-0000-000000000001"},
		{"manage_roles", "10000000-0000-0000-0000-000000000002"},
		{"manage_permissions", "10000000-0000-0000-0000-000000000003"},
		{"manage_tenants", "10000000-0000-0000-0000-000000000004"},
		{"manage_products", "10000000-0000-0000-0000-000000000005"},
		{"manage_branches", "10000000-0000-0000-0000-000000000006"},
		{"manage_transactions", "10000000-0000-0000-0000-000000000007"},
		{"manage_orders", "10000000-0000-0000-0000-000000000008"},
		{"view_reports", "10000000-0000-0000-0000-000000000009"},
		{"manage_stocks", "10000000-0000-0000-0000-000000000010"},
	}

	for _, p := range permissions {
		_, err := db.ExecContext(ctx,
			`INSERT INTO permissions (id, name, created_at) VALUES (?, ?, NOW()) ON CONFLICT (name) DO NOTHING`,
			p.id, p.name,
		)
		if err != nil {
			log.Printf("Gagal insert permission %s: %v", p.name, err)
		}
	}

	for _, p := range permissions {
		_, err := db.ExecContext(ctx,
			`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
			"00000000-0000-0000-0000-000000000001", p.id,
		)
		if err != nil {
			log.Printf("Gagal assign permission %s ke superadmin: %v", p.name, err)
		}
	}

	var adminExists int
	err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM profiles WHERE email = 'admin@sippeto.com'").Scan(&adminExists)
	if err != nil {
		log.Printf("Gagal cek admin user: %v", err)
	}

	if adminExists == 0 {
		hashed, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Gagal hash password: %v", err)
			return err
		}
		_, err = db.ExecContext(ctx,
			`INSERT INTO profiles (id, role_id, email, password, full_name, is_active, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())`,
			"00000000-0000-0000-0000-000000000001",
			"00000000-0000-0000-0000-000000000001",
			"admin@sippeto.com",
			string(hashed),
			"Super Admin",
		)
		if err != nil {
			log.Printf("Gagal insert admin: %v", err)
			return err
		}
		log.Println("Admin user created: admin@sippeto.com / admin123")
	}

	log.Println("Seed data selesai!")
	return nil
}
