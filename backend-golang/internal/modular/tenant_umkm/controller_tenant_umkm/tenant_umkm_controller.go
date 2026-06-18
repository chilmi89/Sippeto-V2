package controller_tenant_umkm

import (
	"log"
	"net/http"

	"backend-golang/internal/modular/tenant_umkm/dto_tenant_umkm"
	"backend-golang/internal/modular/tenant_umkm/service_tenant_umkm"

	"github.com/gin-gonic/gin"
)

type TenantUMKMController struct {
	svc service_tenant_umkm.TenantUMKMService
}

func NewTenantUMKMController(svc service_tenant_umkm.TenantUMKMService) *TenantUMKMController {
	return &TenantUMKMController{svc: svc}
}

func (ctrl *TenantUMKMController) GetTenantUMKM(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	branchID := c.Query("branch_id")

	res, err := ctrl.svc.GetTenantUMKM(c.Request.Context(), userID.(string), branchID)
	if err != nil {
		log.Printf("GetTenantUMKM Controller Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data UMKM"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TenantUMKMController) UpdateTenantUMKM(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	var req dto_tenant_umkm.UpdateTenantUMKMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	res, err := ctrl.svc.UpdateTenantUMKM(c.Request.Context(), userID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui data UMKM"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TenantUMKMController) GetPublicStorefront(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username wajib diisi"})
		return
	}

	res, err := ctrl.svc.GetPublicStorefront(c.Request.Context(), username)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Toko tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TenantUMKMController) CreateRegisterUMKM(c *gin.Context) {
	var req dto_tenant_umkm.CompleteRegisterUMKMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	res, err := ctrl.svc.CreateRegisterUMKM(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftarkan UMKM"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Registrasi UMKM Berhasil. Anda sekarang adalah Owner.", "profile": res})
}

func (ctrl *TenantUMKMController) UpdateRegisterUMKM(c *gin.Context) {
	var req dto_tenant_umkm.CompleteRegisterUMKMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	res, err := ctrl.svc.UpdateRegisterUMKM(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profil UMKM"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profil UMKM Berhasil Dilengkapi. Role Anda telah di-upgrade menjadi Owner.", "profile": res})
}
