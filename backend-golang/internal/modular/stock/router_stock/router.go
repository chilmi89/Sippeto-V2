package router_stock

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/stock/controller_stock"
	"backend-golang/internal/modular/stock/repository_stock"
	"backend-golang/internal/modular/stock/service_stock"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_stock.NewStockRepository(db)
	svc := service_stock.NewStockService(repo)
	ctrl := controller_stock.NewStockController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/stocks", ctrl.GetStocks)
		api.PATCH("/stocks", ctrl.UpdateStock)
	}
}
