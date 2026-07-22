package model_discount

import "time"

type Discount struct {
	ID          string     `bun:"type:uuid,default:gen_random_uuid(),pk" json:"id"`
	ProfileID   string     `bun:"type:uuid,notnull" json:"profile_id"`
	Code        *string    `bun:"type:varchar(50)" json:"code"`
	Name        string     `bun:"type:varchar(100),notnull" json:"name"`
	Type        string     `bun:"type:varchar(20),notnull" json:"type"` // "PERCENTAGE" or "FIXED_AMOUNT"
	Value       float64    `bun:"type:numeric(15,2),notnull,default:0" json:"value"`
	MinPurchase float64    `bun:"type:numeric(15,2),default:0" json:"min_purchase"`
	MaxDiscount *float64   `bun:"type:numeric(15,2)" json:"max_discount"`
	StartDate   *time.Time `bun:"type:timestamptz" json:"start_date"`
	EndDate     *time.Time `bun:"type:timestamptz" json:"end_date"`
	IsActive    bool       `bun:"type:boolean,default:true" json:"is_active"`
	CreatedAt   time.Time  `bun:"type:timestamptz,default:current_timestamp" json:"created_at"`
}
