package controller_role

import (
	"net/http"

	"backend-golang/internal/modular/superadmin/role/dto_role"
	"backend-golang/internal/modular/superadmin/role/service_role"

	"github.com/gin-gonic/gin"
)

type RoleController struct {
	svc service_role.RoleService
}

func NewRoleController(svc service_role.RoleService) *RoleController {
	return &RoleController{svc: svc}
}

func (ctrl *RoleController) GetRoles(c *gin.Context) {
	roles, err := ctrl.svc.GetRoles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil data peran",
		})
		return
	}

	// Langsung kembalikan array JSON agar sesuai dengan ekspektasi frontend
	c.JSON(http.StatusOK, roles)
}

func (ctrl *RoleController) GetRoleByID(c *gin.Context) {
	id := c.Param("id")
	role, err := ctrl.svc.GetRoleByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "Peran tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Peran tidak ditemukan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil detail peran",
		})
		return
	}

	c.JSON(http.StatusOK, role)
}

func (ctrl *RoleController) CreateRole(c *gin.Context) {
	var req dto_role.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama peran wajib diisi",
		})
		return
	}

	newRole, err := ctrl.svc.CreateRole(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "Nama peran sudah ada" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Nama peran sudah ada",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat peran baru",
		})
		return
	}

	c.JSON(http.StatusCreated, newRole)
}

func (ctrl *RoleController) UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var req dto_role.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama peran tidak boleh kosong",
		})
		return
	}

	updatedRole, err := ctrl.svc.UpdateRole(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "Peran tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Peran tidak ditemukan",
			})
			return
		}
		if err.Error() == "Nama peran sudah digunakan" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Nama peran sudah digunakan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memperbarui peran",
		})
		return
	}

	c.JSON(http.StatusOK, updatedRole)
}

func (ctrl *RoleController) DeleteRole(c *gin.Context) {
	id := c.Param("id")
	err := ctrl.svc.DeleteRole(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "Peran tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Peran tidak ditemukan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal menghapus peran",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Peran berhasil dihapus",
	})
}

func (ctrl *RoleController) GetRolePermissions(c *gin.Context) {
	roleID := c.Query("role_id")
	mappings, err := ctrl.svc.GetRolePermissions(c.Request.Context(), roleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil data izin peran",
		})
		return
	}

	c.JSON(http.StatusOK, mappings)
}

func (ctrl *RoleController) AssignPermission(c *gin.Context) {
	var req dto_role.RolePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID Peran dan ID Izin wajib diisi",
		})
		return
	}

	err := ctrl.svc.AssignPermission(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memberikan izin ke peran",
		})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (ctrl *RoleController) RevokePermission(c *gin.Context) {
	var req dto_role.RolePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID Peran dan ID Izin wajib diisi",
		})
		return
	}

	err := ctrl.svc.RevokePermission(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal menghapus izin dari peran",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Izin berhasil dihapus dari peran",
	})
}

