package router_branch

import (
	"backend-golang/internal/middleware"
	"backend-golang/internal/modular/branch/controller_branch"
	"backend-golang/internal/modular/branch/repository_branch"
	"backend-golang/internal/modular/branch/service_branch"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SetupRouter(r *gin.Engine, db *bun.DB) {
	repo := repository_branch.NewBranchRepository(db)
	svc := service_branch.NewBranchService(repo)
	ctrl := controller_branch.NewBranchController(svc)

	apiAuth := r.Group("/api")
	apiAuth.Use(middleware.AuthMiddleware())
	{
		apiAuth.GET("/branches", ctrl.GetBranches)
		apiAuth.POST("/branches", ctrl.CreateBranch)
		apiAuth.PATCH("/branches", ctrl.UpdateBranch)
		apiAuth.DELETE("/branches", ctrl.DeleteBranch)
	}
}

