package controller_permission

import (
	"net/http"

	"backend-golang/internal/modular/superadmin/permission/dto_permission"
	"backend-golang/internal/modular/superadmin/permission/service_permission"

	"github.com/gin-gonic/gin"
)

type PermissionController struct {
	svc service_permission.PermissionService
}

func NewPermissionController(svc service_permission.PermissionService) *PermissionController {
	return &PermissionController{svc: svc}
}

func (ctrl *PermissionController) GetPermissions(c *gin.Context) {
	perms, err := ctrl.svc.GetPermissions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil data izin",
		})
		return
	}

	c.JSON(http.StatusOK, perms)
}

func (ctrl *PermissionController) GetPermissionByID(c *gin.Context) {
	id := c.Param("id")
	perm, err := ctrl.svc.GetPermissionByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "Izin tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Izin tidak ditemukan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil detail izin",
		})
		return
	}

	c.JSON(http.StatusOK, perm)
}

func (ctrl *PermissionController) CreatePermission(c *gin.Context) {
	var req dto_permission.CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama izin wajib diisi",
		})
		return
	}

	newPerm, err := ctrl.svc.CreatePermission(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "Nama izin sudah ada" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Nama izin sudah ada",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat izin baru",
		})
		return
	}

	c.JSON(http.StatusCreated, newPerm)
}

func (ctrl *PermissionController) UpdatePermission(c *gin.Context) {
	id := c.Param("id")
	var req dto_permission.UpdatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama izin tidak boleh kosong",
		})
		return
	}

	updatedPerm, err := ctrl.svc.UpdatePermission(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "Izin tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Izin tidak ditemukan",
			})
			return
		}
		if err.Error() == "Nama izin sudah digunakan" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Nama izin sudah digunakan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memperbarui izin",
		})
		return
	}

	c.JSON(http.StatusOK, updatedPerm)
}

func (ctrl *PermissionController) DeletePermission(c *gin.Context) {
	id := c.Param("id")
	err := ctrl.svc.DeletePermission(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "Izin tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Izin tidak ditemukan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal menghapus izin",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Izin berhasil dihapus",
	})
}
