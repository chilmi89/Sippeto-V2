package main

import (
	"log"
	"net/http"

	"backend-golang/internal/db"
	"backend-golang/internal/modular/auth/router_auth"
	"backend-golang/internal/modular/profile/router_profile"
	"backend-golang/internal/modular/role/router_role"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Memuat environment variables (.env lokal di backend-golang memiliki prioritas lebih tinggi)
	err := godotenv.Load()
	if err != nil {
		// Fallback ke file .env di folder frontend jika tidak ada .env lokal
		err = godotenv.Load("../frontend/.env")
		if err != nil {
			log.Println("Info: File .env tidak ditemukan di backend-golang maupun frontend, menggunakan env var sistem")
		}
	}

	// Menginisialisasi koneksi database Bun ORM
	database, err := db.InitDB()
	if err != nil {
		log.Printf("Peringatan: Gagal terhubung ke database: %v\n", err)
	} else {
		log.Println("Berhasil terhubung ke database menggunakan Bun ORM!")
		// Pastikan koneksi ditutup saat aplikasi selesai
		defer database.Close()
	}

	// Membuat router default Gin
	r := gin.Default()

	// Menambahkan middleware CORS sederhana
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Endpoint pengetesan (Health Check)
	r.GET("/ping", func(c *gin.Context) {
		dbStatus := "disconnected"
		if database != nil && database.Ping() == nil {
			dbStatus = "connected"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":    "success",
			"message":   "pong",
			"database":  dbStatus,
		})
	})

	// Menginisialisasi router modular
	if database != nil {
		router_role.SetupRouter(r, database)
		router_auth.SetupRouter(r, database)
		router_profile.SetupRouter(r, database)
	}

	// Menjalankan server pada port 8080 secara default
	r.Run(":8080")
}

