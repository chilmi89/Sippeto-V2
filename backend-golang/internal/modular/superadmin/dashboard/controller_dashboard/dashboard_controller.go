package controller_dashboard

import (
	"net/http"

	"backend-golang/internal/modular/superadmin/dashboard/service_dashboard"

	"github.com/gin-gonic/gin"
)

type DashboardController struct {
	svc service_dashboard.DashboardService
}

func NewDashboardController(svc service_dashboard.DashboardService) *DashboardController {
	return &DashboardController{svc: svc}
}

func (ctrl *DashboardController) GetStats(c *gin.Context) {
	stats, err := ctrl.svc.GetDashboardStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil statistik bisnis"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
