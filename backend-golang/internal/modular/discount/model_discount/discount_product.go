package model_discount

import "time"

type DiscountProduct struct {
	ID         string    `bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	DiscountID string    `bun:"discount_id,notnull,type:uuid"`
	ProductID  string    `bun:"product_id,notnull,type:uuid"`
	CreatedAt  time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
}
