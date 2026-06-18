package controller_tenant

import (
	"net/http"
	"strconv"

	"backend-golang/internal/modular/superadmin/tenant/dto_tenant"
	"backend-golang/internal/modular/superadmin/tenant/service_tenant"

	"github.com/gin-gonic/gin"
)

type TenantController struct {
	svc service_tenant.TenantService
}

func NewTenantController(svc service_tenant.TenantService) *TenantController {
	return &TenantController{svc: svc}
}

func (ctrl *TenantController) GetTenants(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.DefaultQuery("status", "semua")

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	res, err := ctrl.svc.GetTenants(c.Request.Context(), page, limit, search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data tenant"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TenantController) UpdateTenant(c *gin.Context) {
	var req dto_tenant.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tenant wajib disertakan"})
		return
	}

	res, err := ctrl.svc.UpdateTenant(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "tenant tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tenant tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status tenant"})
		return
	}

	c.JSON(http.StatusOK, res)
}
