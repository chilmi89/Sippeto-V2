package router_discount

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/discount/controller_discount"
	"backend-golang/internal/modular/discount/repository_discount"
	"backend-golang/internal/modular/discount/service_discount"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_discount.NewDiscountRepository(db)
	svc := service_discount.NewDiscountService(repo)
	ctrl := controller_discount.NewDiscountController(svc)

	api := r.Group("/api")
	{
		// Public / Customer / POS validation route (no auth header needed if validated via profile_id & code)
		api.POST("/discounts/validate", ctrl.ValidateDiscount)

		// Protected CRUD routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/discounts", ctrl.GetDiscounts)
			protected.GET("/discounts/:id", ctrl.GetDiscountByID)
			protected.GET("/discounts/:id/products", ctrl.GetDiscountProducts)
			protected.POST("/discounts", ctrl.CreateDiscount)
			protected.POST("/discounts/:id/products/toggle", ctrl.ToggleDiscountProduct)
			protected.PATCH("/discounts/:id", ctrl.UpdateDiscount)
			protected.DELETE("/discounts/:id", ctrl.DeleteDiscount)
		}
	}
}
