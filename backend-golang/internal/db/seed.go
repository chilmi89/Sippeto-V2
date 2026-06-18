package db

import (
	"context"
	"log"

	"github.com/uptrace/bun"
	"golang.org/x/crypto/bcrypt"
)

func RunSeed(db *bun.DB) error {
	ctx := context.Background()

	type rolePerm struct {
		roleID       string
		permissionID string
	}

	roles := []struct {
		id   string
		name string
	}{
		{"9120f34a-0591-49f8-a041-0e8e11404774", "Admin"},
		{"d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776", "UMKM"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "owner"},
		{"58146efc-e1a4-4a0e-b557-3ccec075f132", "kurir"},
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
		id   string
		name string
	}{
		{"b3eace0e-700d-45a0-b867-7a7bf6e9384c", "kelola_produk"},
		{"d6775f3b-7df4-4ce1-803f-80a189d5e549", "kelola_stok"},
		{"5fada4cf-54e9-4104-9c75-dc5f6dfb08f7", "kelola_cabang"},
		{"d88ff953-3cf5-415e-a4f0-0a2205f66e02", "custom-jurnal-transaksi"},
		{"bd671e9e-2883-4bce-9d7b-8fc9155583f7", "profile"},
		{"bc736b42-dbf4-462d-9a14-f24e11525254", "management-karyawan"},
		{"08861d45-80a1-4607-8d26-43300d49f4ea", "laporan-keuangan"},
		{"cab1d87b-6315-4b5e-aede-bc951d27649a", "data-penjualan"},
		{"f4366f10-e808-4f70-9318-5b4be7aedd16", "view dashboard packing"},
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

	rolePerms := []rolePerm{
		// Admin → all permissions
		{"9120f34a-0591-49f8-a041-0e8e11404774", "b3eace0e-700d-45a0-b867-7a7bf6e9384c"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "d6775f3b-7df4-4ce1-803f-80a189d5e549"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "5fada4cf-54e9-4104-9c75-dc5f6dfb08f7"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "d88ff953-3cf5-415e-a4f0-0a2205f66e02"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "bd671e9e-2883-4bce-9d7b-8fc9155583f7"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "bc736b42-dbf4-462d-9a14-f24e11525254"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "08861d45-80a1-4607-8d26-43300d49f4ea"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "cab1d87b-6315-4b5e-aede-bc951d27649a"},
		{"9120f34a-0591-49f8-a041-0e8e11404774", "f4366f10-e808-4f70-9318-5b4be7aedd16"},
		// UMKM
		{"d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776", "b3eace0e-700d-45a0-b867-7a7bf6e9384c"},
		{"d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776", "d6775f3b-7df4-4ce1-803f-80a189d5e549"},
		{"d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776", "5fada4cf-54e9-4104-9c75-dc5f6dfb08f7"},
		{"d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776", "cab1d87b-6315-4b5e-aede-bc951d27649a"},
		{"d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776", "bd671e9e-2883-4bce-9d7b-8fc9155583f7"},
		// owner
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "b3eace0e-700d-45a0-b867-7a7bf6e9384c"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "d6775f3b-7df4-4ce1-803f-80a189d5e549"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "5fada4cf-54e9-4104-9c75-dc5f6dfb08f7"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "d88ff953-3cf5-415e-a4f0-0a2205f66e02"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "bd671e9e-2883-4bce-9d7b-8fc9155583f7"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "bc736b42-dbf4-462d-9a14-f24e11525254"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "08861d45-80a1-4607-8d26-43300d49f4ea"},
		{"7b14cbcd-a375-4e49-a9f7-43251c00d39e", "cab1d87b-6315-4b5e-aede-bc951d27649a"},
		// kurir
		{"58146efc-e1a4-4a0e-b557-3ccec075f132", "bd671e9e-2883-4bce-9d7b-8fc9155583f7"},
		{"58146efc-e1a4-4a0e-b557-3ccec075f132", "cab1d87b-6315-4b5e-aede-bc951d27649a"},
	}

	for _, rp := range rolePerms {
		_, err := db.ExecContext(ctx,
			`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
			rp.roleID, rp.permissionID,
		)
		if err != nil {
			log.Printf("Gagal assign permission: %v", err)
		}
	}

	var adminCount int
	err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM profiles WHERE email = 'admin@gmail.com'").Scan(&adminCount)
	if err != nil {
		log.Printf("Gagal cek admin: %v", err)
	}

	if adminCount == 0 {
		hashed, err := bcrypt.GenerateFromPassword([]byte("sippeto2026"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Gagal hash password: %v", err)
			return err
		}
		_, err = db.ExecContext(ctx,
			`INSERT INTO profiles (id, role_id, email, password, full_name, is_active, metadata, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, true, '{"system": "master"}', NOW(), NOW())`,
			"0f34733d-b653-43a4-914b-f96aa62bead0",
			"9120f34a-0591-49f8-a041-0e8e11404774",
			"admin@gmail.com",
			string(hashed),
			"Super Admin SiPetto",
		)
		if err != nil {
			log.Printf("Gagal insert admin: %v", err)
			return err
		}
		log.Println("Admin created: admin@gmail.com / sippeto2026 (role: Admin)")
	} else {
		log.Println("Admin already exists")
	}

	log.Println("Seed selesai!")
	return nil
}
