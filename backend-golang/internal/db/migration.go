package db

import (
	"context"
	"log"

	"github.com/uptrace/bun"
)

func RunMigration(db *bun.DB) error {
	ctx := context.Background()

	tables := []struct {
		name string
		sql  string
	}{
		{
			name: "roles",
			sql: `CREATE TABLE IF NOT EXISTS roles (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				name varchar(50) NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "permissions",
			sql: `CREATE TABLE IF NOT EXISTS permissions (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				name varchar(100) NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "profiles",
			sql: `CREATE TABLE IF NOT EXISTS profiles (
				id uuid NOT NULL,
				role_id uuid,
				email varchar(255) NOT NULL,
				full_name varchar(255),
				business_name varchar(255),
				phone_number varchar(20),
				address text,
				avatar_url text,
				banner_url text,
				bio text,
				password varchar(255),
				is_active boolean DEFAULT true,
				metadata jsonb DEFAULT '{}',
				created_at timestamptz DEFAULT NOW(),
				updated_at timestamptz DEFAULT NOW(),
				branch_id uuid,
				username varchar(100),
				payment_qr text,
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "branches",
			sql: `CREATE TABLE IF NOT EXISTS branches (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				tenant_id uuid NOT NULL,
				name varchar(100) NOT NULL,
				address text,
				phone_number varchar(20),
				is_active boolean DEFAULT true,
				created_at timestamptz DEFAULT NOW(),
				updated_at timestamptz DEFAULT NOW(),
				payment_qr text,
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "categories",
			sql: `CREATE TABLE IF NOT EXISTS categories (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				profile_id uuid,
				name varchar(100) NOT NULL,
				type varchar(20) NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "payment_methods",
			sql: `CREATE TABLE IF NOT EXISTS payment_methods (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				profile_id uuid,
				name varchar(50) NOT NULL,
				is_active boolean DEFAULT true,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "product_categories",
			sql: `CREATE TABLE IF NOT EXISTS product_categories (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				profile_id uuid,
				name varchar(100) NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "products",
			sql: `CREATE TABLE IF NOT EXISTS products (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				profile_id uuid NOT NULL,
				category_id uuid,
				name varchar(255) NOT NULL,
				description text,
				base_price numeric(15,2) DEFAULT 0 NOT NULL,
				sell_price numeric(15,2) DEFAULT 0 NOT NULL,
				image_url text,
				is_active boolean DEFAULT true,
				created_at timestamptz DEFAULT NOW(),
				updated_at timestamptz DEFAULT NOW(),
				branch_id uuid,
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "product_stocks",
			sql: `CREATE TABLE IF NOT EXISTS product_stocks (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				product_id uuid NOT NULL,
				branch_id uuid NOT NULL,
				stock integer DEFAULT 0 NOT NULL,
				min_stock integer DEFAULT 0 NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				updated_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "stock_mutations",
			sql: `CREATE TABLE IF NOT EXISTS stock_mutations (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				product_id uuid NOT NULL,
				from_branch_id uuid,
				to_branch_id uuid,
				quantity integer NOT NULL,
				type varchar(50) NOT NULL,
				notes text,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "orders",
			sql: `CREATE TABLE IF NOT EXISTS orders (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				profile_id uuid,
				branch_id uuid,
				reference_number varchar(100) NOT NULL,
				customer_name varchar(255) NOT NULL,
				customer_phone varchar(20) NOT NULL,
				customer_address text,
				payment_method varchar(50) NOT NULL,
				total_price numeric(15,2) DEFAULT 0 NOT NULL,
				status varchar(50) DEFAULT 'PENDING' NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				updated_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "order_items",
			sql: `CREATE TABLE IF NOT EXISTS order_items (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				order_id uuid,
				product_id uuid,
				quantity integer DEFAULT 1 NOT NULL,
				price numeric(15,2) DEFAULT 0 NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "transaction_groups",
			sql: `CREATE TABLE IF NOT EXISTS transaction_groups (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				profile_id uuid,
				reference_number varchar(100),
				transaction_date date DEFAULT CURRENT_DATE,
				total_income numeric(15,2) DEFAULT 0,
				total_expense numeric(15,2) DEFAULT 0,
				net_balance numeric(15,2) DEFAULT 0,
				description text,
				created_at timestamptz DEFAULT NOW(),
				branch_id uuid,
				customer_name varchar(255),
				customer_phone varchar(20),
				customer_address text,
				order_status integer DEFAULT 6,
				updated_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "transaction_items",
			sql: `CREATE TABLE IF NOT EXISTS transaction_items (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				group_id uuid,
				category_id uuid,
				payment_method_id uuid,
				type varchar(20) NOT NULL,
				name varchar(255),
				amount numeric(15,2) DEFAULT 0,
				created_at timestamptz DEFAULT NOW(),
				product_id uuid,
				quantity integer DEFAULT 1 NOT NULL,
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "transaction_attachments",
			sql: `CREATE TABLE IF NOT EXISTS transaction_attachments (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				group_id uuid,
				file_url text NOT NULL,
				created_at timestamptz DEFAULT NOW(),
				PRIMARY KEY (id)
			)`,
		},
		{
			name: "role_permissions",
			sql: `CREATE TABLE IF NOT EXISTS role_permissions (
				role_id uuid NOT NULL,
				permission_id uuid NOT NULL,
				PRIMARY KEY (role_id, permission_id)
			)`,
		},
	}

	for _, t := range tables {
		if _, err := db.ExecContext(ctx, t.sql); err != nil {
			log.Printf("Gagal membuat tabel %s: %v", t.name, err)
			return err
		}
		log.Printf("Tabel %s berhasil diverifikasi", t.name)
	}

	indexes := []string{
		`CREATE UNIQUE INDEX IF NOT EXISTS roles_name_key ON roles (name)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_key ON permissions (name)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON profiles (email)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles (username)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS categories_profile_id_name_type_key ON categories (profile_id, name, type)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_profile_id_name_key ON payment_methods (profile_id, name)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS product_categories_profile_id_name_key ON product_categories (profile_id, name)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS product_stocks_product_id_branch_id_key ON product_stocks (product_id, branch_id)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS orders_reference_number_key ON orders (reference_number)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS transaction_groups_reference_number_key ON transaction_groups (reference_number)`,
	}
	for _, idx := range indexes {
		if _, err := db.ExecContext(ctx, idx); err != nil {
			log.Printf("Gagal membuat index: %v", err)
			return err
		}
	}

	foreignKeys := []string{
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_id_fkey') THEN ALTER TABLE profiles ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branches_tenant_id_fkey') THEN ALTER TABLE branches ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_branch_id_fkey') THEN ALTER TABLE profiles ADD CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_profile_id_fkey') THEN ALTER TABLE categories ADD CONSTRAINT categories_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_methods_profile_id_fkey') THEN ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_profile_id_fkey') THEN ALTER TABLE product_categories ADD CONSTRAINT product_categories_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_profile_id_fkey') THEN ALTER TABLE products ADD CONSTRAINT products_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey') THEN ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_branch_id_fkey') THEN ALTER TABLE products ADD CONSTRAINT products_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_stocks_product_id_fkey') THEN ALTER TABLE product_stocks ADD CONSTRAINT product_stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_stocks_branch_id_fkey') THEN ALTER TABLE product_stocks ADD CONSTRAINT product_stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_mutations_product_id_fkey') THEN ALTER TABLE stock_mutations ADD CONSTRAINT stock_mutations_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_mutations_from_branch_id_fkey') THEN ALTER TABLE stock_mutations ADD CONSTRAINT stock_mutations_from_branch_id_fkey FOREIGN KEY (from_branch_id) REFERENCES branches(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_mutations_to_branch_id_fkey') THEN ALTER TABLE stock_mutations ADD CONSTRAINT stock_mutations_to_branch_id_fkey FOREIGN KEY (to_branch_id) REFERENCES branches(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_profile_id_fkey') THEN ALTER TABLE orders ADD CONSTRAINT orders_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_branch_id_fkey') THEN ALTER TABLE orders ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey') THEN ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey') THEN ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_groups_profile_id_fkey') THEN ALTER TABLE transaction_groups ADD CONSTRAINT transaction_groups_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_groups_branch_id_fkey') THEN ALTER TABLE transaction_groups ADD CONSTRAINT transaction_groups_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_group_id_fkey') THEN ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES transaction_groups(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_category_id_fkey') THEN ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_payment_method_id_fkey') THEN ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_product_id_fkey') THEN ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_attachments_group_id_fkey') THEN ALTER TABLE transaction_attachments ADD CONSTRAINT transaction_attachments_group_id_fkey FOREIGN KEY (group_id) REFERENCES transaction_groups(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_fkey') THEN ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE; END IF; END $$`,
		`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_permission_id_fkey') THEN ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE; END IF; END $$`,
	}
	for _, fk := range foreignKeys {
		if _, err := db.ExecContext(ctx, fk); err != nil {
			log.Printf("Gagal membuat foreign key: %v", err)
			return err
		}
	}

	log.Println("Migration selesai! Semua tabel, index, dan foreign key berhasil diverifikasi.")
	return nil
}
