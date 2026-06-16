package repository_role

import (
	"context"

	"backend-golang/internal/modular/role/model_role"

	"github.com/uptrace/bun"
)

type RoleRepository interface {
	FindAll(ctx context.Context) ([]model_role.Role, error)
}

type roleRepository struct {
	db *bun.DB
}

func NewRoleRepository(db *bun.DB) RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) FindAll(ctx context.Context) ([]model_role.Role, error) {
	var roles []model_role.Role
	err := r.db.NewSelect().Model(&roles).Order("name ASC").Scan(ctx)
	return roles, err
}
