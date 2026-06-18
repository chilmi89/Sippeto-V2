package router_order

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/order/controller_order"
	"backend-golang/internal/modular/order/repository_order"
	"backend-golang/internal/modular/order/service_order"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_order.NewOrderRepository(db)
	svc := service_order.NewOrderService(repo)
	ctrl := controller_order.NewOrderController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/tenant/orders", ctrl.GetOrders)
		api.PATCH("/tenant/orders", ctrl.UpdateOrderStatus)
	}

	apiPublic := r.Group("/api")
	{
		apiPublic.POST("/store/checkout", ctrl.Checkout)
	}
}
