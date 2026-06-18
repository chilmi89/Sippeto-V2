package controller_order

import (
	"fmt"
	"net/http"

	"backend-golang/internal/modular/order/dto_order"
	"backend-golang/internal/modular/order/service_order"

	"github.com/gin-gonic/gin"
)

type OrderController struct {
	svc service_order.OrderService
}

func NewOrderController(svc service_order.OrderService) *OrderController {
	return &OrderController{svc: svc}
}

func (ctrl *OrderController) GetOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	page, _ := parseIntParam(c.Query("page"), 1)
	limit, _ := parseIntParam(c.Query("limit"), 5)
	search := c.Query("search")
	status := c.Query("status")

	q := dto_order.GetOrdersQuery{
		Page:   page,
		Limit:  limit,
		Search: search,
		Status: status,
	}

	result, err := ctrl.svc.GetOrders(c.Request.Context(), userID.(string), q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pesanan"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func parseIntParam(val string, defaultVal int) (int, error) {
	if val == "" {
		return defaultVal, nil
	}
	var result int
	_, err := fmt.Sscanf(val, "%d", &result)
	if err != nil {
		return defaultVal, nil
	}
	return result, nil
}

func (ctrl *OrderController) UpdateOrderStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	var req dto_order.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.ID == "" || req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter tidak lengkap"})
		return
	}

	err := ctrl.svc.UpdateOrderStatus(c.Request.Context(), userID.(string), req.ID, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status pesanan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pesanan berhasil diupdate ke " + req.Status})
}

func (ctrl *OrderController) Checkout(c *gin.Context) {
	var req dto_order.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.ProfileID == "" || req.CustomerName == "" || req.CustomerPhone == "" || req.PaymentMethod == "" || len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Informasi pesanan tidak lengkap."})
		return
	}

	res, err := ctrl.svc.CreateOrder(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pesanan"})
		return
	}

	c.JSON(http.StatusCreated, dto_order.CheckoutResponse{
		Message: "Pesanan berhasil dibuat.",
		Order:   *res,
	})
}
