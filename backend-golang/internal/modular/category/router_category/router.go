package router_category

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/category/controller_category"
	"backend-golang/internal/modular/category/repository_category"
	"backend-golang/internal/modular/category/service_category"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_category.NewCategoryRepository(db)
	svc := service_category.NewCategoryService(repo)
	ctrl := controller_category.NewCategoryController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/kategori", ctrl.GetCategories)
		api.POST("/kategori", ctrl.CreateCategory)
		api.PATCH("/kategori", ctrl.UpdateCategory)
		api.DELETE("/kategori", ctrl.DeleteCategory)
	}
}
