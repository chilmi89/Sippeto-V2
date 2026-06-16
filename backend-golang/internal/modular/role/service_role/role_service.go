package service_role

import (
	"context"

	"backend-golang/internal/modular/role/dto_role"
	"backend-golang/internal/modular/role/repository_role"
)

type RoleService interface {
	GetRoles(ctx context.Context) ([]dto_role.RoleResponse, error)
}

type roleService struct {
	repo repository_role.RoleRepository
}

func NewRoleService(repo repository_role.RoleRepository) RoleService {
	return &roleService{repo: repo}
}

func (s *roleService) GetRoles(ctx context.Context) ([]dto_role.RoleResponse, error) {
	roles, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var resp []dto_role.RoleResponse
	for _, r := range roles {
		resp = append(resp, dto_role.RoleResponse{
			ID:   r.ID,
			Name: r.Name,
		})
	}
	return resp, nil
}
