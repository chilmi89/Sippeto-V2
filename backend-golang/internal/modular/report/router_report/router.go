package router_report

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/report/controller_report"
	"backend-golang/internal/modular/report/repository_report"
	"backend-golang/internal/modular/report/service_report"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_report.NewReportRepository(db)
	svc := service_report.NewReportService(repo)
	ctrl := controller_report.NewReportController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/reports/sales", ctrl.GetSalesReport)
	}
}
