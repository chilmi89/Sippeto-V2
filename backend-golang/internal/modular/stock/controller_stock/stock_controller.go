package controller_stock

import (
	"net/http"

	"backend-golang/internal/modular/stock/dto_stock"
	"backend-golang/internal/modular/stock/service_stock"

	"github.com/gin-gonic/gin"
)

type StockController struct {
	svc service_stock.StockService
}

func NewStockController(svc service_stock.StockService) *StockController {
	return &StockController{svc: svc}
}

func (ctrl *StockController) GetStocks(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	data, err := ctrl.svc.GetStocksPageData(c.Request.Context(), userID)
	if err != nil {
		if err.Error() == "akses ditolak" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak. Anda tidak memiliki izin kelola_stok."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data stok"})
		return
	}

	c.JSON(http.StatusOK, data)
}

func (ctrl *StockController) UpdateStock(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	var req dto_stock.UpdateStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	res, err := ctrl.svc.UpdateStock(c.Request.Context(), userID, req)
	if err != nil {
		if err.Error() == "akses ditolak" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak. Anda tidak memiliki izin kelola_stok."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui stok"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    res,
		"message": "Stok berhasil diperbarui",
	})
}
