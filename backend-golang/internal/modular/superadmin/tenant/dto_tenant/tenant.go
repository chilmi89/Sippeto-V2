package dto_tenant

type TenantStats struct {
	Total    int `json:"total"`
	Aktif    int `json:"aktif"`
	Nonaktif int `json:"nonaktif"`
	Menunggu int `json:"menunggu"` // menunggu = nonaktif
}

type TenantRoleInfo struct {
	Name string `json:"name"`
}

type TenantResponse struct {
	ID           string                 `json:"id"`
	FullName     *string                `json:"full_name"`
	BusinessName *string                `json:"business_name"`
	Email        string                 `json:"email"`
	PhoneNumber  *string                `json:"phone_number"`
	IsActive     bool                   `json:"is_active"`
	CreatedAt    string                 `json:"created_at"`
	AvatarURL    *string                `json:"avatar_url"`
	Metadata     map[string]interface{} `json:"metadata"`
	Roles        *TenantRoleInfo        `json:"roles,omitempty"`
}

type TenantListResponse struct {
	Data       []TenantResponse `json:"data"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	TotalPages int              `json:"totalPages"`
	Stats      TenantStats      `json:"stats"`
}

type UpdateTenantRequest struct {
	ID              string `json:"id"`
	IsActive        *bool  `json:"is_active,omitempty"`
	BranchesEnabled *bool  `json:"branches_enabled,omitempty"`
}
