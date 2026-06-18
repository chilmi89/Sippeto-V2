package controller_notification

import (
	"net/http"

	"backend-golang/internal/modular/notification/service_notification"

	"github.com/gin-gonic/gin"
)

type NotificationController struct {
	svc service_notification.NotificationService
}

func NewNotificationController(svc service_notification.NotificationService) *NotificationController {
	return &NotificationController{svc: svc}
}

func (ctrl *NotificationController) GetNotifications(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi"})
		return
	}

	res, err := ctrl.svc.GetNotifications(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil notifikasi"})
		return
	}

	c.JSON(http.StatusOK, res)
}
