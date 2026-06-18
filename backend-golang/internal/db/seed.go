package db

import (
	"context"
	"log"

	"github.com/uptrace/bun"
	"golang.org/x/crypto/bcrypt"
)

func RunSeed(db *bun.DB) error {
	ctx := context.Background()

	type roleData struct {
		id   string
		name string
	}

	roles := []roleData{
		{"00000000-0000-0000-0000-000000000001", "superadmin"},
		{"00000000-0000-0000-0000-000000000002", "admin"},
		{"00000000-0000-0000-0000-000000000003", "owner"},
		{"00000000-0000-0000-0000-000000000004", "user"},
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

	type permData struct {
		id   string
		name string
	}

	permissions := []permData{
		// Superadmin only
		{"10000000-0000-0000-0000-000000000001", "manage_users"},
		{"10000000-0000-0000-0000-000000000002", "manage_roles"},
		{"10000000-0000-0000-0000-000000000003", "manage_permissions"},
		{"10000000-0000-0000-0000-000000000004", "manage_tenants"},
		{"10000000-0000-0000-0000-000000000018", "view_dashboard"},

		// Admin / Owner
		{"10000000-0000-0000-0000-000000000005", "manage_products"},
		{"10000000-0000-0000-0000-000000000006", "manage_branches"},
		{"10000000-0000-0000-0000-000000000007", "manage_transactions"},
		{"10000000-0000-0000-0000-000000000008", "manage_orders"},
		{"10000000-0000-0000-0000-000000000009", "view_reports"},
		{"10000000-0000-0000-0000-000000000010", "manage_stocks"},
		{"10000000-0000-0000-0000-000000000011", "manage_categories"},
		{"10000000-0000-0000-0000-000000000012", "manage_payment_methods"},
		{"10000000-0000-0000-0000-000000000013", "view_notifications"},
		{"10000000-0000-0000-0000-000000000014", "upload_files"},
		{"10000000-0000-0000-0000-000000000015", "manage_profile"},
		{"10000000-0000-0000-0000-000000000016", "manage_umkm"},
		{"10000000-0000-0000-0000-000000000017", "view_public_store"},
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

	superadminPerms := []string{
		"10000000-0000-0000-0000-000000000001",
		"10000000-0000-0000-0000-000000000002",
		"10000000-0000-0000-0000-000000000003",
		"10000000-0000-0000-0000-000000000004",
		"10000000-0000-0000-0000-000000000005",
		"10000000-0000-0000-0000-000000000006",
		"10000000-0000-0000-0000-000000000007",
		"10000000-0000-0000-0000-000000000008",
		"10000000-0000-0000-0000-000000000009",
		"10000000-0000-0000-0000-000000000010",
		"10000000-0000-0000-0000-000000000011",
		"10000000-0000-0000-0000-000000000012",
		"10000000-0000-0000-0000-000000000013",
		"10000000-0000-0000-0000-000000000014",
		"10000000-0000-0000-0000-000000000015",
		"10000000-0000-0000-0000-000000000016",
		"10000000-0000-0000-0000-000000000017",
		"10000000-0000-0000-0000-000000000018",
	}
	for _, pid := range superadminPerms {
		_, err := db.ExecContext(ctx,
			`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
			"00000000-0000-0000-0000-000000000001", pid,
		)
		if err != nil {
			log.Printf("Gagal assign permission %s ke superadmin: %v", pid, err)
		}
	}

	adminPerms := []string{
		"10000000-0000-0000-0000-000000000005",
		"10000000-0000-0000-0000-000000000006",
		"10000000-0000-0000-0000-000000000007",
		"10000000-0000-0000-0000-000000000008",
		"10000000-0000-0000-0000-000000000009",
		"10000000-0000-0000-0000-000000000010",
		"10000000-0000-0000-0000-000000000011",
		"10000000-0000-0000-0000-000000000012",
		"10000000-0000-0000-0000-000000000013",
		"10000000-0000-0000-0000-000000000014",
		"10000000-0000-0000-0000-000000000015",
		"10000000-0000-0000-0000-000000000016",
		"10000000-0000-0000-0000-000000000017",
		"10000000-0000-0000-0000-000000000018",
	}
	for _, pid := range adminPerms {
		_, err := db.ExecContext(ctx,
			`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
			"00000000-0000-0000-0000-000000000002", pid,
		)
		if err != nil {
			log.Printf("Gagal assign permission %s ke admin: %v", pid, err)
		}
	}

	ownerPerms := []string{
		"10000000-0000-0000-0000-000000000005",
		"10000000-0000-0000-0000-000000000006",
		"10000000-0000-0000-0000-000000000007",
		"10000000-0000-0000-0000-000000000008",
		"10000000-0000-0000-0000-000000000009",
		"10000000-0000-0000-0000-000000000010",
		"10000000-0000-0000-0000-000000000011",
		"10000000-0000-0000-0000-000000000012",
		"10000000-0000-0000-0000-000000000013",
		"10000000-0000-0000-0000-000000000014",
		"10000000-0000-0000-0000-000000000015",
		"10000000-0000-0000-0000-000000000016",
		"10000000-0000-0000-0000-000000000017",
		"10000000-0000-0000-0000-000000000018",
	}
	for _, pid := range ownerPerms {
		_, err := db.ExecContext(ctx,
			`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
			"00000000-0000-0000-0000-000000000003", pid,
		)
		if err != nil {
			log.Printf("Gagal assign permission %s ke owner: %v", pid, err)
		}
	}

	userPerms := []string{
		"10000000-0000-0000-0000-000000000013",
		"10000000-0000-0000-0000-000000000015",
		"10000000-0000-0000-0000-000000000017",
	}
	for _, pid := range userPerms {
		_, err := db.ExecContext(ctx,
			`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
			"00000000-0000-0000-0000-000000000004", pid,
		)
		if err != nil {
			log.Printf("Gagal assign permission %s ke user: %v", pid, err)
		}
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte("sippeto2026"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Gagal hash password: %v", err)
		return err
	}

	_, err = db.ExecContext(ctx,
		`INSERT INTO profiles (id, role_id, email, password, full_name, is_active, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())
		 ON CONFLICT (email) DO UPDATE SET password = ?, full_name = ?, role_id = ?, updated_at = NOW()`,
		"00000000-0000-0000-0000-000000000001",
		"00000000-0000-0000-0000-000000000002",
		"admin@gmail.com",
		string(hashed),
		"Super Admin",
		string(hashed),
		"Super Admin",
		"00000000-0000-0000-0000-000000000002",
	)
	if err != nil {
		log.Printf("Gagal upsert admin: %v", err)
		return err
	}
	log.Println("Admin user upsert: admin@gmail.com / sippeto2026")

	log.Println("Seed data selesai!")
	return nil
}
