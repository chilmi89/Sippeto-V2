package controller_payment_method

import (
	"net/http"
	"strconv"

	"backend-golang/internal/modular/payment_method/dto_payment_method"
	"backend-golang/internal/modular/payment_method/service_payment_method"

	"github.com/gin-gonic/gin"
)

type PaymentMethodController struct {
	svc service_payment_method.PaymentMethodService
}

func NewPaymentMethodController(svc service_payment_method.PaymentMethodService) *PaymentMethodController {
	return &PaymentMethodController{svc: svc}
}

func (ctrl *PaymentMethodController) GetPaymentMethods(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	profileID := c.Query("profile_id")
	isActiveParam := c.Query("is_active")

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	var isActiveFilter *bool
	if isActiveParam != "" {
		val := isActiveParam == "true"
		isActiveFilter = &val
	}

	res, err := ctrl.svc.GetPaymentMethods(c.Request.Context(), page, limit, search, profileID, isActiveFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data metode pembayaran"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *PaymentMethodController) CreatePaymentMethod(c *gin.Context) {
	var req dto_payment_method.CreatePaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama metode pembayaran wajib diisi"})
		return
	}

	res, err := ctrl.svc.CreatePaymentMethod(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "metode pembayaran dengan nama ini sudah ada" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan metode pembayaran"})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (ctrl *PaymentMethodController) UpdatePaymentMethod(c *gin.Context) {
	var req dto_payment_method.UpdatePaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	res, err := ctrl.svc.UpdatePaymentMethod(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "metode pembayaran tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Metode pembayaran tidak ditemukan"})
			return
		}
		if err.Error() == "Nama sudah digunakan" {
			c.JSON(http.StatusConflict, gin.H{"error": "Nama sudah digunakan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui metode pembayaran"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *PaymentMethodController) DeletePaymentMethod(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID metode pembayaran tidak ditemukan"})
		return
	}

	err := ctrl.svc.DeletePaymentMethod(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "metode pembayaran tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Metode pembayaran tidak ditemukan"})
			return
		}
		if err.Error() == "Tidak bisa dihapus — metode ini masih digunakan pada transaksi" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus metode pembayaran"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Metode pembayaran berhasil dihapus"})
}
