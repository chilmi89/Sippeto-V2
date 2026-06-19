package router_storage

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/storage/controller_storage"
	"backend-golang/internal/modular/storage/repository_storage"
	"backend-golang/internal/modular/storage/service_storage"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_storage.NewStorageRepository(db)
	svc := service_storage.NewStorageService(repo)
	ctrl := controller_storage.NewStorageController(svc)

	// Public static file server proxy ke MinIO
	r.GET("/storage-bucket/*filepath", ctrl.ServeFile)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.POST("/storage/upload", ctrl.UploadFile)
		api.POST("/storage/delete", ctrl.DeleteFile)
	}
}
