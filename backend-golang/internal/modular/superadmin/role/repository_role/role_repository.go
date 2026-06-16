package repository_role

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"

	"backend-golang/internal/modular/superadmin/role/model_role"

	"github.com/uptrace/bun"
)

type RoleRepository interface {
	FindAll(ctx context.Context) ([]model_role.Role, error)
	FindByID(ctx context.Context, id string) (*model_role.Role, error)
	Create(ctx context.Context, role *model_role.Role) error
	Update(ctx context.Context, role *model_role.Role) error
	Delete(ctx context.Context, id string) error
	FindAllMappings(ctx context.Context) ([]model_role.RolePermission, error)
	FindPermissionsByRole(ctx context.Context, roleID string) ([]model_role.RolePermission, error)
	AssignPermission(ctx context.Context, roleID, permissionID string) error
	RevokePermission(ctx context.Context, roleID, permissionID string) error
}

type roleRepository struct {
	db *bun.DB
}

func NewRoleRepository(db *bun.DB) RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) FindAll(ctx context.Context) ([]model_role.Role, error) {
	var roles []model_role.Role
	query := `
		SELECT r.id, r.name, r.created_at, COUNT(rp.permission_id) as role_permissions_count 
		FROM roles r 
		LEFT JOIN role_permissions rp ON r.id = rp.role_id 
		GROUP BY r.id, r.name, r.created_at 
		ORDER BY r.created_at DESC
	`
	err := r.db.NewRaw(query).Scan(ctx, &roles)
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *roleRepository) FindByID(ctx context.Context, id string) (*model_role.Role, error) {
	role := new(model_role.Role)
	query := "SELECT id, name, created_at FROM roles WHERE id = ?"
	err := r.db.NewRaw(query, id).Scan(ctx, role)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return role, nil
}

func generateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return ""
	}
	// Format UUID v4 standar
	b[6] = (b[6] & 0x0f) | 0x40 // Set version to 4
	b[8] = (b[8] & 0x3f) | 0x80 // Set variant to RFC4122
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func (r *roleRepository) Create(ctx context.Context, role *model_role.Role) error {
	role.ID = generateUUID()
	query := "INSERT INTO roles (id, name) VALUES (?, ?) RETURNING id, name, created_at"
	err := r.db.NewRaw(query, role.ID, role.Name).Scan(ctx, role)
	if err != nil {
		log.Println("ERROR CREATE ROLE DB:", err)
	}
	return err
}

func (r *roleRepository) Update(ctx context.Context, role *model_role.Role) error {
	query := "UPDATE roles SET name = ? WHERE id = ? RETURNING id, name, created_at"
	err := r.db.NewRaw(query, role.Name, role.ID).Scan(ctx, role)
	return err
}

func (r *roleRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM roles WHERE id = ?"
	_, err := r.db.NewRaw(query, id).Exec(ctx)
	return err
}

func (r *roleRepository) FindAllMappings(ctx context.Context) ([]model_role.RolePermission, error) {
	var mappings []model_role.RolePermission
	query := "SELECT role_id, permission_id FROM role_permissions"
	err := r.db.NewRaw(query).Scan(ctx, &mappings)
	if err != nil {
		return nil, err
	}
	return mappings, nil
}

func (r *roleRepository) FindPermissionsByRole(ctx context.Context, roleID string) ([]model_role.RolePermission, error) {
	var mappings []model_role.RolePermission
	query := "SELECT role_id, permission_id FROM role_permissions WHERE role_id = ?"
	err := r.db.NewRaw(query, roleID).Scan(ctx, &mappings)
	if err != nil {
		return nil, err
	}
	return mappings, nil
}

func (r *roleRepository) AssignPermission(ctx context.Context, roleID, permissionID string) error {
	query := "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
	_, err := r.db.NewRaw(query, roleID, permissionID).Exec(ctx)
	return err
}

func (r *roleRepository) RevokePermission(ctx context.Context, roleID, permissionID string) error {
	query := "DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?"
	_, err := r.db.NewRaw(query, roleID, permissionID).Exec(ctx)
	return err
}

