package db

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

var DB *bun.DB

func InitDB() (*bun.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	}

	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))

	sqldb.SetMaxOpenConns(25)
	sqldb.SetMaxIdleConns(5)
	sqldb.SetConnMaxLifetime(5 * time.Minute)
	sqldb.SetConnMaxIdleTime(1 * time.Minute)

	db := bun.NewDB(sqldb, pgdialect.New())
	DB = db

	if err := db.Ping(); err != nil {
		return nil, err
	}

	log.Println("Menjalankan auto-migration...")
	if err := RunMigration(db); err != nil {
		log.Printf("Peringatan: Auto-migration gagal: %v", err)
	}

	log.Println("Menjalankan seed data...")
	if err := RunSeed(db); err != nil {
		log.Printf("Peringatan: Seed data gagal: %v", err)
	}

	return db, nil
}
