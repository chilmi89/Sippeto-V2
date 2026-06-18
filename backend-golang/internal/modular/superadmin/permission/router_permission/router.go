package router_permission

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/superadmin/permission/controller_permission"
	"backend-golang/internal/modular/superadmin/permission/repository_permission"
	"backend-golang/internal/modular/superadmin/permission/service_permission"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_permission.NewPermissionRepository(db)
	svc := service_permission.NewPermissionService(repo)
	ctrl := controller_permission.NewPermissionController(svc)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(), middleware.RequireRole("superadmin", "admin"))
	{
		api.GET("/permission", ctrl.GetPermissions)
		api.POST("/permission", ctrl.CreatePermission)
		api.GET("/permission/:id", ctrl.GetPermissionByID)
		api.PATCH("/permission/:id", ctrl.UpdatePermission)
		api.DELETE("/permission/:id", ctrl.DeletePermission)
	}
}
