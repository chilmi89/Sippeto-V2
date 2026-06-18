package router_tenant_umkm

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/tenant_umkm/controller_tenant_umkm"
	"backend-golang/internal/modular/tenant_umkm/repository_tenant_umkm"
	"backend-golang/internal/modular/tenant_umkm/service_tenant_umkm"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_tenant_umkm.NewTenantUMKMRepository(db)
	svc := service_tenant_umkm.NewTenantUMKMService(repo)
	ctrl := controller_tenant_umkm.NewTenantUMKMController(svc)

	api := r.Group("/api")
	{
		api.GET("/public/store/:username", ctrl.GetPublicStorefront)
		api.POST("/public/tenant-umkm", ctrl.CreateRegisterUMKM)
		api.PATCH("/public/tenant-umkm", ctrl.UpdateRegisterUMKM)
	}

	apiAuth := r.Group("/api")
	apiAuth.Use(middleware.AuthMiddleware())
	{
		apiAuth.GET("/tenant-umkm", ctrl.GetTenantUMKM)
		apiAuth.PATCH("/tenant-umkm", ctrl.UpdateTenantUMKM)
	}
}
