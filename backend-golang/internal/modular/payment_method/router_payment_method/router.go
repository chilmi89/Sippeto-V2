package router_payment_method

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/payment_method/controller_payment_method"
	"backend-golang/internal/modular/payment_method/repository_payment_method"
	"backend-golang/internal/modular/payment_method/service_payment_method"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_payment_method.NewPaymentMethodRepository(db)
	svc := service_payment_method.NewPaymentMethodService(repo)
	ctrl := controller_payment_method.NewPaymentMethodController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/payment_kategori", ctrl.GetPaymentMethods)
		api.POST("/payment_kategori", ctrl.CreatePaymentMethod)
		api.PATCH("/payment_kategori", ctrl.UpdatePaymentMethod)
		api.DELETE("/payment_kategori", ctrl.DeletePaymentMethod)
	}
}
