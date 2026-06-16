package db

import (
	"database/sql"
	"os"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

var DB *bun.DB

// InitDB menginisialisasi koneksi database menggunakan Bun ORM
func InitDB() (*bun.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Default fallback jika env var tidak diatur
		dsn = "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	}

	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))

	db := bun.NewDB(sqldb, pgdialect.New())
	DB = db

	// Ping database untuk memastikan koneksi berhasil
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}
