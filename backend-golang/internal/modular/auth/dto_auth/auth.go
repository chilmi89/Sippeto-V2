package dto_auth

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type UserResponse struct {
	ID       string `json:"id"`
	Nama     string `json:"nama"`
	Email    string `json:"email"`
	RoleName string `json:"role_name"`
}

type LoginResponse struct {
	Message      string       `json:"message"`
	User         UserResponse `json:"user"`
	Token        string       `json:"token"` // Access Token
	RefreshToken string       `json:"refresh_token,omitempty"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type RefreshResponse struct {
	AccessToken string `json:"access_token"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ForgotPasswordResponse struct {
	Message string `json:"message"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type ResetPasswordPhoneRequest struct {
	Email       string `json:"email" binding:"required,email"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

type VerifyResetPhoneRequest struct {
	Email       string `json:"email" binding:"required,email"`
	PhoneNumber string `json:"phone_number" binding:"required"`
}

type VerifyResetPhoneResponse struct {
	Valid        bool   `json:"valid"`
	FullName     string `json:"full_name"`
	BusinessName string `json:"business_name,omitempty"`
	Message      string `json:"message"`
}

type RegisterRequest struct {
	Nama     string `json:"nama" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type RegisteredUser struct {
	ID    string `json:"id"`
	Nama  string `json:"nama"`
	Email string `json:"email"`
}

type RegisterResponse struct {
	Message string         `json:"message"`
	User    RegisteredUser `json:"user"`
}


