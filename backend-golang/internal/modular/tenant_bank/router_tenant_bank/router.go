package router_tenant_bank

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/tenant_bank/controller_tenant_bank"
	"backend-golang/internal/modular/tenant_bank/repository_tenant_bank"
	"backend-golang/internal/modular/tenant_bank/service_tenant_bank"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_tenant_bank.NewTenantBankRepository(db)
	svc := service_tenant_bank.NewTenantBankService(repo)
	ctrl := controller_tenant_bank.NewTenantBankController(svc)

	api := r.Group("/api")
	{
		// Public route (pembeli e-catalog dapat melihat rekening bank tenant)
		api.GET("/tenant-banks", ctrl.GetBanks)
		api.GET("/tenant-banks/:id", ctrl.GetBankByID)

		// Protected routes (Tenant Owner CRUD bank)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.POST("/tenant-banks", ctrl.CreateBank)
			protected.PUT("/tenant-banks/:id", ctrl.UpdateBank)
			protected.DELETE("/tenant-banks/:id", ctrl.DeleteBank)
			protected.PATCH("/tenant-banks/:id/primary", ctrl.SetPrimaryBank)
		}
	}
}
