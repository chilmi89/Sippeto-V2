package router_role

import (
	"backend-golang/internal/modular/role/controller_role"
	"backend-golang/internal/modular/role/repository_role"
	"backend-golang/internal/modular/role/service_role"

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
	{
		api.GET("/roles", ctrl.GetRoles)
	}
}
