package model_role

import (
	"time"

	"github.com/uptrace/bun"
)

type Role struct {
	bun.BaseModel `bun:"table:roles,alias:r"`

	ID        string    `bun:"id,type:uuid,pk,default:gen_random_uuid()" json:"id"`
	Name      string    `bun:"name,notnull,unique" json:"name"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
}
