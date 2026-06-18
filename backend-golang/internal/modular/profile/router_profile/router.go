package router_profile

import (
	"backend-golang/internal/middleware"
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
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/auth/me", ctrl.GetMe)

		api.GET("/users", ctrl.GetUsers)
		api.POST("/users", ctrl.CreateUser)
		api.GET("/users/:id", ctrl.GetUserByID)
		api.PUT("/users/:id", ctrl.UpdateUser)
		api.DELETE("/users/:id", ctrl.DeleteUser)
	}
}
