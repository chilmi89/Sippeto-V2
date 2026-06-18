package router_dashboard

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/superadmin/dashboard/controller_dashboard"
	"backend-golang/internal/modular/superadmin/dashboard/repository_dashboard"
	"backend-golang/internal/modular/superadmin/dashboard/service_dashboard"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_dashboard.NewDashboardRepository(db)
	svc := service_dashboard.NewDashboardService(repo)
	ctrl := controller_dashboard.NewDashboardController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/admin/dashboard/stats", ctrl.GetStats)
	}
}
