package router_auth

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/auth/controller_auth"
	"backend-golang/internal/modular/auth/repository_auth"
	"backend-golang/internal/modular/auth/service_auth"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	// Inisialisasi dependensi modular (dependency injection manual)
	repo := repository_auth.NewAuthRepository(db)
	svc := service_auth.NewAuthService(repo)
	ctrl := controller_auth.NewAuthController(svc)

	// Definisikan rute API — strict rate limit untuk login/register/forgot-password
	api := r.Group("/api")
	api.Use(middleware.StrictRateLimiter())
	{
		api.POST("/auth/login", ctrl.Login)
		api.POST("/auth/logout", ctrl.Logout)
		api.POST("/auth/refresh", ctrl.Refresh)
		api.POST("/auth/forgot-password", ctrl.ForgotPassword)
		api.POST("/auth/reset-password", ctrl.ResetPassword)
		api.POST("/auth/register", ctrl.Register)
	}
}
