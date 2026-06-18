package controller_branch

import (
	"net/http"

	"backend-golang/internal/modular/branch/dto_branch"
	"backend-golang/internal/modular/branch/service_branch"

	"github.com/gin-gonic/gin"
)

type BranchController struct {
	svc service_branch.BranchService
}

func NewBranchController(svc service_branch.BranchService) *BranchController {
	return &BranchController{svc: svc}
}

func (ctrl *BranchController) GetBranches(c *gin.Context) {
	id := c.Query("id")
	tenantID := c.Query("tenant_id")

	if id != "" {
		branch, err := ctrl.svc.GetBranchByID(c.Request.Context(), id)
		if err != nil {
			if err.Error() == "cabang tidak ditemukan" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Cabang tidak ditemukan"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data cabang"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": []dto_branch.BranchResponse{*branch}})
		return
	}

	if tenantID == "" {
		if userID, exists := c.Get("user_id"); exists {
			if resolvedID, err := ctrl.svc.ResolveTenantID(c.Request.Context(), userID.(string)); err == nil && resolvedID != "" {
				tenantID = resolvedID
			}
		}
	}

	if tenantID != "" {
		branches, err := ctrl.svc.GetBranchesByTenant(c.Request.Context(), tenantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data cabang"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": branches})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Query param id atau tenant_id wajib disertakan"})
}

func (ctrl *BranchController) CreateBranch(c *gin.Context) {
	var req dto_branch.CreateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newBranch, err := ctrl.svc.CreateBranch(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membuat cabang"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    newBranch,
		"message": "Cabang dan akun pengelola berhasil dibuat",
	})
}

func (ctrl *BranchController) UpdateBranch(c *gin.Context) {
	var req dto_branch.UpdateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var id string
	id = c.Query("id")
	if id == "" && req.ID != nil {
		id = *req.ID
	}

	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID cabang wajib disertakan"})
		return
	}

	updatedBranch, err := ctrl.svc.UpdateBranch(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal memperbarui cabang"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    updatedBranch,
		"message": "Informasi cabang berhasil diperbarui",
	})
}

func (ctrl *BranchController) DeleteBranch(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID cabang tidak ditemukan"})
		return
	}

	err := ctrl.svc.DeleteBranch(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal menghapus cabang"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cabang berhasil dihapus",
	})
}
