package controller_role

import (
	"net/http"

	"backend-golang/internal/modular/role/service_role"

	"github.com/gin-gonic/gin"
)

type RoleController struct {
	svc service_role.RoleService
}

func NewRoleController(svc service_role.RoleService) *RoleController {
	return &RoleController{svc: svc}
}

func (ctrl *RoleController) GetRoles(c *gin.Context) {
	roles, err := ctrl.svc.GetRoles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   roles,
	})
}
