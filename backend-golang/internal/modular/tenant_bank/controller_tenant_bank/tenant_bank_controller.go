package controller_tenant_bank

import (
	"net/http"

	"backend-golang/internal/modular/tenant_bank/dto_tenant_bank"
	"backend-golang/internal/modular/tenant_bank/service_tenant_bank"

	"github.com/gin-gonic/gin"
)

type TenantBankController struct {
	svc service_tenant_bank.TenantBankService
}

func NewTenantBankController(svc service_tenant_bank.TenantBankService) *TenantBankController {
	return &TenantBankController{svc: svc}
}

func (c *TenantBankController) GetBanks(ctx *gin.Context) {
	profileID := ctx.Query("profile_id")
	if profileID == "" {
		if val, exists := ctx.Get("user_id"); exists {
			profileID = val.(string)
		} else if val, exists := ctx.Get("profile_id"); exists {
			profileID = val.(string)
		}
	}

	if profileID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "profile_id wajib disertakan"})
		return
	}

	banks, err := c.svc.GetTenantBanks(ctx.Request.Context(), profileID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": banks})
}

func (c *TenantBankController) GetBankByID(ctx *gin.Context) {
	id := ctx.Param("id")
	bank, err := c.svc.GetTenantBankByID(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": bank})
}

func (c *TenantBankController) CreateBank(ctx *gin.Context) {
	var req dto_tenant_bank.CreateTenantBankRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ProfileID == "" {
		if val, exists := ctx.Get("user_id"); exists {
			req.ProfileID = val.(string)
		} else if val, exists := ctx.Get("profile_id"); exists {
			req.ProfileID = val.(string)
		}
	}

	if req.ProfileID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "profile_id wajib diisi"})
		return
	}

	bank, err := c.svc.CreateTenantBank(ctx.Request.Context(), req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Berhasil menambahkan rekening bank", "data": bank})
}

func (c *TenantBankController) UpdateBank(ctx *gin.Context) {
	id := ctx.Param("id")
	var req dto_tenant_bank.UpdateTenantBankRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = id

	bank, err := c.svc.UpdateTenantBank(ctx.Request.Context(), req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Berhasil memperbarui rekening bank", "data": bank})
}

func (c *TenantBankController) DeleteBank(ctx *gin.Context) {
	id := ctx.Param("id")
	err := c.svc.DeleteTenantBank(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Berhasil menghapus rekening bank"})
}

func (c *TenantBankController) SetPrimaryBank(ctx *gin.Context) {
	id := ctx.Param("id")
	profileID := ""
	if val, exists := ctx.Get("user_id"); exists {
		profileID = val.(string)
	} else if val, exists := ctx.Get("profile_id"); exists {
		profileID = val.(string)
	}

	if profileID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "profile_id tidak valid"})
		return
	}

	err := c.svc.SetPrimaryBank(ctx.Request.Context(), profileID, id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Berhasil mengatur rekening utama"})
}
