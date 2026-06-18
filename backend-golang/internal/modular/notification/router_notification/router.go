package router_notification

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/notification/controller_notification"
	"backend-golang/internal/modular/notification/repository_notification"
	"backend-golang/internal/modular/notification/service_notification"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_notification.NewNotificationRepository(db)
	svc := service_notification.NewNotificationService(repo)
	ctrl := controller_notification.NewNotificationController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/tenant/notifications", ctrl.GetNotifications)
	}
}
