package service_role

import (
	"context"
	"errors"
	"strings"

	"backend-golang/internal/modular/superadmin/role/dto_role"
	"backend-golang/internal/modular/superadmin/role/model_role"
	"backend-golang/internal/modular/superadmin/role/repository_role"
)

type RoleService interface {
	GetRoles(ctx context.Context) ([]dto_role.RoleResponse, error)
	GetRoleByID(ctx context.Context, id string) (*dto_role.RoleResponse, error)
	CreateRole(ctx context.Context, req dto_role.CreateRoleRequest) (*dto_role.RoleResponse, error)
	UpdateRole(ctx context.Context, id string, req dto_role.UpdateRoleRequest) (*dto_role.RoleResponse, error)
	DeleteRole(ctx context.Context, id string) error
	GetRolePermissions(ctx context.Context, roleID string) ([]dto_role.RolePermissionResponse, error)
	AssignPermission(ctx context.Context, req dto_role.RolePermissionRequest) error
	RevokePermission(ctx context.Context, req dto_role.RolePermissionRequest) error
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
			ID:        r.ID,
			Name:      r.Name,
			CreatedAt: r.CreatedAt,
			Count: dto_role.RoleCount{
				RolePermissions: r.RolePermissionsCount,
			},
		})
	}
	return resp, nil
}

func (s *roleService) GetRoleByID(ctx context.Context, id string) (*dto_role.RoleResponse, error) {
	r, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if r == nil {
		return nil, errors.New("Peran tidak ditemukan")
	}

	return &dto_role.RoleResponse{
		ID:        r.ID,
		Name:      r.Name,
		CreatedAt: r.CreatedAt,
		Count: dto_role.RoleCount{
			RolePermissions: r.RolePermissionsCount,
		},
	}, nil
}

func (s *roleService) CreateRole(ctx context.Context, req dto_role.CreateRoleRequest) (*dto_role.RoleResponse, error) {
	role := &model_role.Role{
		Name: req.Name,
	}

	err := s.repo.Create(ctx, role)
	if err != nil {
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("Nama peran sudah ada")
		}
		return nil, err
	}

	return &dto_role.RoleResponse{
		ID:        role.ID,
		Name:      role.Name,
		CreatedAt: role.CreatedAt,
	}, nil
}

func (s *roleService) UpdateRole(ctx context.Context, id string, req dto_role.UpdateRoleRequest) (*dto_role.RoleResponse, error) {
	// 1. Cek apakah role tersebut ada
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("Peran tidak ditemukan")
	}

	existing.Name = req.Name
	err = s.repo.Update(ctx, existing)
	if err != nil {
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("Nama peran sudah digunakan")
		}
		return nil, err
	}

	return &dto_role.RoleResponse{
		ID:        existing.ID,
		Name:      existing.Name,
		CreatedAt: existing.CreatedAt,
	}, nil
}

func (s *roleService) DeleteRole(ctx context.Context, id string) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("Peran tidak ditemukan")
	}

	return s.repo.Delete(ctx, id)
}

func (s *roleService) GetRolePermissions(ctx context.Context, roleID string) ([]dto_role.RolePermissionResponse, error) {
	var err error
	var mappings []model_role.RolePermission

	if roleID != "" {
		mappings, err = s.repo.FindPermissionsByRole(ctx, roleID)
	} else {
		mappings, err = s.repo.FindAllMappings(ctx)
	}

	if err != nil {
		return nil, err
	}

	var resp []dto_role.RolePermissionResponse
	for _, m := range mappings {
		resp = append(resp, dto_role.RolePermissionResponse{
			RoleID:       m.RoleID,
			PermissionID: m.PermissionID,
		})
	}

	if resp == nil {
		resp = []dto_role.RolePermissionResponse{}
	}
	return resp, nil
}

func (s *roleService) AssignPermission(ctx context.Context, req dto_role.RolePermissionRequest) error {
	return s.repo.AssignPermission(ctx, req.RoleID, req.PermissionID)
}

func (s *roleService) RevokePermission(ctx context.Context, req dto_role.RolePermissionRequest) error {
	return s.repo.RevokePermission(ctx, req.RoleID, req.PermissionID)
}

