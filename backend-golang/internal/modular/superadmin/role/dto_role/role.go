package dto_role

import "time"

type CreateRoleRequest struct {
	Name string `json:"name" binding:"required"`
}

type UpdateRoleRequest struct {
	Name string `json:"name" binding:"required"`
}

type RoleCount struct {
	RolePermissions int `json:"role_permissions"`
}

type RoleResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	Count     RoleCount `json:"_count"`
}

type RolePermissionRequest struct {
	RoleID       string `json:"role_id" binding:"required"`
	PermissionID string `json:"permission_id" binding:"required"`
}

type RolePermissionResponse struct {
	RoleID       string `json:"role_id"`
	PermissionID string `json:"permission_id"`
}

