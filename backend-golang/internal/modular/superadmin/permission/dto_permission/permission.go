package dto_permission

import "time"

type PermissionResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type CreatePermissionRequest struct {
	Name string `json:"name" binding:"required"`
}

type UpdatePermissionRequest struct {
	Name string `json:"name" binding:"required"`
}
