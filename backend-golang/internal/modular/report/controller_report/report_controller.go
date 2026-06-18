package controller_report

import (
	"net/http"

	"backend-golang/internal/modular/report/service_report"

	"github.com/gin-gonic/gin"
)

type ReportController struct {
	svc service_report.ReportService
}

func NewReportController(svc service_report.ReportService) *ReportController {
	return &ReportController{svc: svc}
}

func (ctrl *ReportController) GetSalesReport(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	branchID := c.DefaultQuery("branch_id", "all")
	reportType := c.DefaultQuery("type", "daily")
	dateStart := c.Query("date_start")
	dateEnd := c.Query("date_end")

	res, err := ctrl.svc.GetReport(c.Request.Context(), userID.(string), branchID, reportType, dateStart, dateEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil laporan"})
		return
	}

	c.JSON(http.StatusOK, res)
}
