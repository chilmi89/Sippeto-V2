package router_product

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/product/controller_product"
	"backend-golang/internal/modular/product/repository_product"
	"backend-golang/internal/modular/product/service_product"
	"backend-golang/internal/modular/storage/repository_storage"
	"backend-golang/internal/modular/storage/service_storage"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_product.NewProductRepository(db)
	storageRepo := repository_storage.NewStorageRepository(db)
	storageSvc := service_storage.NewStorageService(storageRepo)
	svc := service_product.NewProductService(repo, storageSvc)
	ctrl := controller_product.NewProductController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Kategori Produk
		api.GET("/product-categories", ctrl.GetCategories)
		api.POST("/product-categories", ctrl.CreateCategory)
		api.PATCH("/product-categories", ctrl.UpdateCategory)
		api.DELETE("/product-categories", ctrl.DeleteCategory)

		// Produk
		api.GET("/products", ctrl.GetProducts)
		api.POST("/products", ctrl.CreateProduct)
		api.PATCH("/products", ctrl.UpdateProduct)
		api.DELETE("/products", ctrl.DeleteProduct)
	}
}
