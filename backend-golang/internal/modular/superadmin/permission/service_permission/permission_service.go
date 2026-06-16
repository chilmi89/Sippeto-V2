package service_permission

import (
	"context"
	"errors"
	"strings"

	"backend-golang/internal/modular/superadmin/permission/dto_permission"
	"backend-golang/internal/modular/superadmin/permission/model_permission"
	"backend-golang/internal/modular/superadmin/permission/repository_permission"
)

type PermissionService interface {
	GetPermissions(ctx context.Context) ([]dto_permission.PermissionResponse, error)
	GetPermissionByID(ctx context.Context, id string) (*dto_permission.PermissionResponse, error)
	CreatePermission(ctx context.Context, req dto_permission.CreatePermissionRequest) (*dto_permission.PermissionResponse, error)
	UpdatePermission(ctx context.Context, id string, req dto_permission.UpdatePermissionRequest) (*dto_permission.PermissionResponse, error)
	DeletePermission(ctx context.Context, id string) error
}

type permissionService struct {
	repo repository_permission.PermissionRepository
}

func NewPermissionService(repo repository_permission.PermissionRepository) PermissionService {
	return &permissionService{repo: repo}
}

func (s *permissionService) GetPermissions(ctx context.Context) ([]dto_permission.PermissionResponse, error) {
	perms, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var resp []dto_permission.PermissionResponse
	for _, p := range perms {
		resp = append(resp, dto_permission.PermissionResponse{
			ID:        p.ID,
			Name:      p.Name,
			CreatedAt: p.CreatedAt,
		})
	}
	return resp, nil
}

func (s *permissionService) GetPermissionByID(ctx context.Context, id string) (*dto_permission.PermissionResponse, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, errors.New("Izin tidak ditemukan")
	}

	return &dto_permission.PermissionResponse{
		ID:        p.ID,
		Name:      p.Name,
		CreatedAt: p.CreatedAt,
	}, nil
}

func (s *permissionService) CreatePermission(ctx context.Context, req dto_permission.CreatePermissionRequest) (*dto_permission.PermissionResponse, error) {
	perm := &model_permission.Permission{
		Name: req.Name,
	}

	err := s.repo.Create(ctx, perm)
	if err != nil {
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("Nama izin sudah ada")
		}
		return nil, err
	}

	return &dto_permission.PermissionResponse{
		ID:        perm.ID,
		Name:      perm.Name,
		CreatedAt: perm.CreatedAt,
	}, nil
}

func (s *permissionService) UpdatePermission(ctx context.Context, id string, req dto_permission.UpdatePermissionRequest) (*dto_permission.PermissionResponse, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("Izin tidak ditemukan")
	}

	existing.Name = req.Name
	err = s.repo.Update(ctx, existing)
	if err != nil {
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("Nama izin sudah digunakan")
		}
		return nil, err
	}

	return &dto_permission.PermissionResponse{
		ID:        existing.ID,
		Name:      existing.Name,
		CreatedAt: existing.CreatedAt,
	}, nil
}

func (s *permissionService) DeletePermission(ctx context.Context, id string) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("Izin tidak ditemukan")
	}

	return s.repo.Delete(ctx, id)
}
