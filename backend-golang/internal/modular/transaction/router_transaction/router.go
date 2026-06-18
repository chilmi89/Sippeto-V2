package router_transaction

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/transaction/controller_transaction"
	"backend-golang/internal/modular/transaction/repository_transaction"
	"backend-golang/internal/modular/transaction/service_transaction"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_transaction.NewTransactionRepository(db)
	svc := service_transaction.NewTransactionService(repo)
	ctrl := controller_transaction.NewTransactionController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Groups
		api.GET("/transaction/group", ctrl.GetGroups)
		api.POST("/transaction/group", ctrl.CreateGroup)
		api.PATCH("/transaction/group", ctrl.UpdateGroup)
		api.DELETE("/transaction/group", ctrl.DeleteGroup)

		// Items
		api.GET("/transaction/item", ctrl.GetItems)
		api.POST("/transaction/item", ctrl.CreateItem)
		api.PATCH("/transaction/item", ctrl.UpdateItem)
		api.DELETE("/transaction/item", ctrl.DeleteItem)

		// Attachments
		api.GET("/transaction/attachment", ctrl.GetAttachments)
		api.POST("/transaction/attachment", ctrl.CreateAttachment)
		api.PATCH("/transaction/attachment", ctrl.UpdateAttachment)
		api.DELETE("/transaction/attachment", ctrl.DeleteAttachment)
	}
}
