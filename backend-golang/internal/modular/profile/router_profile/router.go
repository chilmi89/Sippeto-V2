package router_profile

import (
	"backend-golang/internal/modular/profile/controller_profile"
	"backend-golang/internal/modular/profile/repository_profile"
	"backend-golang/internal/modular/profile/service_profile"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	// Inisialisasi dependensi modular (dependency injection manual)
	repo := repository_profile.NewProfileRepository(db)
	svc := service_profile.NewProfileService(repo)
	ctrl := controller_profile.NewProfileController(svc)

	// Definisikan rute API
	api := r.Group("/api")
	{
		api.GET("/auth/me", ctrl.GetMe)
	}
}
