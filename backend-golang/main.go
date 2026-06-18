package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"backend-golang/internal/db"
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/auth/router_auth"
	"backend-golang/internal/modular/branch/router_branch"
	"backend-golang/internal/modular/category/router_category"
	"backend-golang/internal/modular/payment_method/router_payment_method"
	"backend-golang/internal/modular/product/router_product"
	"backend-golang/internal/modular/profile/router_profile"
	"backend-golang/internal/modular/stock/router_stock"
	"backend-golang/internal/modular/superadmin/dashboard/router_dashboard"
	"backend-golang/internal/modular/superadmin/permission/router_permission"
	"backend-golang/internal/modular/superadmin/role/router_role"
	"backend-golang/internal/modular/superadmin/tenant/router_tenant"
	"backend-golang/internal/modular/tenant_umkm/router_tenant_umkm"
	"backend-golang/internal/modular/transaction/router_transaction"
	"backend-golang/internal/modular/order/router_order"
	"backend-golang/internal/modular/notification/router_notification"
	"backend-golang/internal/modular/report/router_report"
	"backend-golang/internal/modular/storage/router_storage"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	godotenv.Load("../frontend/.env")

	database, err := db.InitDB()
	if err != nil {
		log.Printf("Peringatan: Gagal terhubung ke database: %v\n", err)
	} else {
		log.Println("Berhasil terhubung ke database menggunakan Bun ORM!")
		_, err = database.Exec("ALTER TABLE transaction_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();")
		if err != nil {
			log.Printf("Peringatan: Gagal memverifikasi/menambahkan kolom updated_at: %v\n", err)
		} else {
			log.Println("Verifikasi kolom updated_at di transaction_groups berhasil!")
		}
		defer database.Close()
	}

	r := gin.Default()

	r.Use(corsMiddleware())
	r.Use(middleware.RateLimiter())

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "pong",
		})
	})

	if database != nil {
		router_role.SetupRouter(r, database)
		router_permission.SetupRouter(r, database)
		router_auth.SetupRouter(r, database)
		router_profile.SetupRouter(r, database)
		router_branch.SetupRouter(r, database)
		router_product.SetupRouter(r, database)
		router_stock.SetupRouter(r, database)
		router_dashboard.SetupRouter(r, database)
		router_tenant.SetupRouter(r, database)
		router_category.SetupRouter(r, database)
		router_payment_method.SetupRouter(r, database)
		router_tenant_umkm.SetupRouter(r, database)
		router_transaction.SetupRouter(r, database)
		router_order.SetupRouter(r, database)
		router_notification.SetupRouter(r, database)
		router_report.SetupRouter(r, database)
		router_storage.SetupRouter(r, database)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server berjalan di port %s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Gagal menjalankan server: %v\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Server dimatikan...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced shutdown: %v\n", err)
	}

	log.Println("Server berhenti dengan aman")
}

func corsMiddleware() gin.HandlerFunc {
	allowedOrigin := os.Getenv("CORS_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}

	allowedOrigins := strings.Split(allowedOrigin, ",")
	for i := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if origin != "" {
			allowed := false
			for _, o := range allowedOrigins {
				if origin == o {
					allowed = true
					break
				}
			}
			if allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
