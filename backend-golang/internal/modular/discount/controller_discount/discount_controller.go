package controller_discount

import (
	"net/http"
	"strconv"

	"backend-golang/internal/modular/discount/dto_discount"
	"backend-golang/internal/modular/discount/service_discount"
	"github.com/gin-gonic/gin"
)

type DiscountController struct {
	service service_discount.DiscountService
}

func NewDiscountController(service service_discount.DiscountService) *DiscountController {
	return &DiscountController{service: service}
}

func (c *DiscountController) GetDiscounts(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	search := ctx.Query("search")
	profileID := ctx.Query("profile_id")

	res, err := c.service.GetDiscounts(ctx.Request.Context(), page, limit, search, profileID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       res.Data,
		"total":      res.Total,
		"page":       res.Page,
		"totalPages": res.TotalPages,
	})
}

func (c *DiscountController) GetDiscountByID(ctx *gin.Context) {
	id := ctx.Param("id")
	res, err := c.service.GetDiscountByID(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"success": true, "data": res})
}

func (c *DiscountController) CreateDiscount(ctx *gin.Context) {
	var req dto_discount.CreateDiscountRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := c.service.CreateDiscount(ctx.Request.Context(), &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Diskon berhasil dibuat",
		"data":    res,
	})
}

func (c *DiscountController) UpdateDiscount(ctx *gin.Context) {
	id := ctx.Param("id")
	var req dto_discount.UpdateDiscountRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = id

	res, err := c.service.UpdateDiscount(ctx.Request.Context(), &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Diskon berhasil diperbarui",
		"data":    res,
	})
}

func (c *DiscountController) DeleteDiscount(ctx *gin.Context) {
	id := ctx.Param("id")
	err := c.service.DeleteDiscount(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Diskon berhasil dihapus",
	})
}

func (c *DiscountController) ValidateDiscount(ctx *gin.Context) {
	var req dto_discount.ValidateDiscountRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := c.service.ValidateDiscount(ctx.Request.Context(), &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    res,
	})
}

func (c *DiscountController) GetDiscountProducts(ctx *gin.Context) {
	discountID := ctx.Param("id")
	productIDs, err := c.service.GetDiscountProductIDs(ctx.Request.Context(), discountID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":     true,
		"product_ids": productIDs,
	})
}

func (c *DiscountController) ToggleDiscountProduct(ctx *gin.Context) {
	discountID := ctx.Param("id")
	var req dto_discount.ToggleDiscountProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := c.service.ToggleDiscountProduct(ctx.Request.Context(), discountID, req.ProductID, req.Enabled)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Status diskon produk berhasil diperbarui",
	})
}
