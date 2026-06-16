package repository_permission

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"

	"backend-golang/internal/modular/superadmin/permission/model_permission"

	"github.com/uptrace/bun"
)

type PermissionRepository interface {
	FindAll(ctx context.Context) ([]model_permission.Permission, error)
	FindByID(ctx context.Context, id string) (*model_permission.Permission, error)
	Create(ctx context.Context, perm *model_permission.Permission) error
	Update(ctx context.Context, perm *model_permission.Permission) error
	Delete(ctx context.Context, id string) error
}

type permissionRepository struct {
	db *bun.DB
}

func NewPermissionRepository(db *bun.DB) PermissionRepository {
	return &permissionRepository{db: db}
}

func (r *permissionRepository) FindAll(ctx context.Context) ([]model_permission.Permission, error) {
	var perms []model_permission.Permission
	query := "SELECT id, name, created_at FROM permissions ORDER BY name ASC"
	err := r.db.NewRaw(query).Scan(ctx, &perms)
	if err != nil {
		return nil, err
	}
	return perms, nil
}

func (r *permissionRepository) FindByID(ctx context.Context, id string) (*model_permission.Permission, error) {
	perm := new(model_permission.Permission)
	query := "SELECT id, name, created_at FROM permissions WHERE id = ?"
	err := r.db.NewRaw(query, id).Scan(ctx, perm)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return perm, nil
}

func generateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return ""
	}
	b[6] = (b[6] & 0x0f) | 0x40 // Set version to 4
	b[8] = (b[8] & 0x3f) | 0x80 // Set variant to RFC4122
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func (r *permissionRepository) Create(ctx context.Context, perm *model_permission.Permission) error {
	perm.ID = generateUUID()
	query := "INSERT INTO permissions (id, name) VALUES (?, ?) RETURNING id, name, created_at"
	err := r.db.NewRaw(query, perm.ID, perm.Name).Scan(ctx, perm)
	if err != nil {
		log.Println("ERROR CREATE PERMISSION DB:", err)
	}
	return err
}

func (r *permissionRepository) Update(ctx context.Context, perm *model_permission.Permission) error {
	query := "UPDATE permissions SET name = ? WHERE id = ? RETURNING id, name, created_at"
	err := r.db.NewRaw(query, perm.Name, perm.ID).Scan(ctx, perm)
	if err != nil {
		log.Println("ERROR UPDATE PERMISSION DB:", err)
	}
	return err
}

func (r *permissionRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM permissions WHERE id = ?"
	_, err := r.db.NewRaw(query, id).Exec(ctx)
	return err
}
