package router_role

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/superadmin/role/controller_role"
	"backend-golang/internal/modular/superadmin/role/repository_role"
	"backend-golang/internal/modular/superadmin/role/service_role"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	// Inisialisasi dependensi modular (dependency injection manual)
	repo := repository_role.NewRoleRepository(db)
	svc := service_role.NewRoleService(repo)
	ctrl := controller_role.NewRoleController(svc)

	// Definisikan rute API
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(), middleware.RequireRole("superadmin"))
	{
		api.GET("/role", ctrl.GetRoles)
		api.POST("/role", ctrl.CreateRole)
		api.GET("/role/:id", ctrl.GetRoleByID)
		api.PATCH("/role/:id", ctrl.UpdateRole)
		api.DELETE("/role/:id", ctrl.DeleteRole)

		api.GET("/role-permission", ctrl.GetRolePermissions)
		api.POST("/role-permission", ctrl.AssignPermission)
		api.DELETE("/role-permission", ctrl.RevokePermission)
	}
}
