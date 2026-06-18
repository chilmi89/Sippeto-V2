package router_tenant

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/superadmin/tenant/controller_tenant"
	"backend-golang/internal/modular/superadmin/tenant/repository_tenant"
	"backend-golang/internal/modular/superadmin/tenant/service_tenant"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_tenant.NewTenantRepository(db)
	svc := service_tenant.NewTenantService(repo)
	ctrl := controller_tenant.NewTenantController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/admin/tenant", ctrl.GetTenants)
		api.PATCH("/admin/tenant", ctrl.UpdateTenant)
	}
}
