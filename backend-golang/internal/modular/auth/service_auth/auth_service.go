package service_auth

import (
	"context"
	"errors"
	"os"
	"time"

	"backend-golang/internal/modular/auth/dto_auth"
	"backend-golang/internal/modular/auth/repository_auth"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Login(ctx context.Context, req dto_auth.LoginRequest) (*dto_auth.LoginResponse, error)
	RefreshToken(ctx context.Context, tokenString string) (*dto_auth.RefreshResponse, error)
	GenerateResetToken(ctx context.Context, email string) (string, error)
	ResetPassword(ctx context.Context, req dto_auth.ResetPasswordRequest) error
}

type authService struct {
	repo repository_auth.AuthRepository
}

func NewAuthService(repo repository_auth.AuthRepository) AuthService {
	return &authService{repo: repo}
}

func (s *authService) Login(ctx context.Context, req dto_auth.LoginRequest) (*dto_auth.LoginResponse, error) {
	// Temukan user berdasarkan email
	profile, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}

	if profile == nil || profile.Password == "" {
		return nil, errors.New("Email atau password salah.")
	}

	// Bandingkan password menggunakan bcrypt
	err = bcrypt.CompareHashAndPassword([]byte(profile.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("Email atau password salah.")
	}

	roleName := ""
	if profile.Role != nil {
		roleName = profile.Role.Name
	}

	// Generate JWT Token
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key"
	}

	// 1. Generate Access Token (15 menit)
	accessClaims := jwt.MapClaims{
		"id":        profile.ID,
		"email":     profile.Email,
		"role_id":   profile.RoleID,
		"role_name": roleName,
		"exp":       time.Now().Add(15 * time.Minute).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(secret))
	if err != nil {
		return nil, err
	}

	// 2. Generate Refresh Token (7 hari)
	refreshClaims := jwt.MapClaims{
		"id":        profile.ID,
		"email":     profile.Email,
		"role_id":   profile.RoleID,
		"role_name": roleName,
		"exp":       time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(secret))
	if err != nil {
		return nil, err
	}

	resp := &dto_auth.LoginResponse{
		Message: "Login berhasil.",
		User: dto_auth.UserResponse{
			ID:       profile.ID,
			Nama:     profile.FullName,
			Email:    profile.Email,
			RoleName: roleName,
		},
		Token:        accessTokenString,
		RefreshToken: refreshTokenString,
	}

	return resp, nil
}

func (s *authService) RefreshToken(ctx context.Context, tokenString string) (*dto_auth.RefreshResponse, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key"
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("Refresh token tidak valid atau expired.")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("Refresh token tidak valid.")
	}

	userID, ok := claims["id"].(string)
	if !ok || userID == "" {
		return nil, errors.New("Refresh token tidak valid.")
	}

	roleName, _ := claims["role_name"].(string)
	email, _ := claims["email"].(string)
	roleID, _ := claims["role_id"].(string)

	// Buat Access Token baru (15 menit)
	accessClaims := jwt.MapClaims{
		"id":        userID,
		"email":     email,
		"role_id":   roleID,
		"role_name": roleName,
		"exp":       time.Now().Add(15 * time.Minute).Unix(),
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(secret))
	if err != nil {
		return nil, err
	}

	return &dto_auth.RefreshResponse{
		AccessToken: accessTokenString,
	}, nil
}

func (s *authService) GenerateResetToken(ctx context.Context, email string) (string, error) {
	profile, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return "", err
	}
	if profile == nil {
		return "", errors.New("Email tidak terdaftar.")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key"
	}

	// Gunakan pass_hash di dalam claims agar token ini hangus setelah password diubah!
	claims := jwt.MapClaims{
		"email":     profile.Email,
		"pass_hash": profile.Password,
		"exp":       time.Now().Add(15 * time.Minute).Unix(), // valid 15 menit
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s *authService) ResetPassword(ctx context.Context, req dto_auth.ResetPasswordRequest) error {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key"
	}

	token, err := jwt.Parse(req.Token, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return errors.New("Token reset password tidak valid atau kedaluwarsa.")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return errors.New("Token tidak valid.")
	}

	email, ok := claims["email"].(string)
	tokenPassHash, ok2 := claims["pass_hash"].(string)
	if !ok || !ok2 || email == "" {
		return errors.New("Token tidak valid.")
	}

	// Pastikan pass_hash saat ini masih sama dengan pass_hash di token
	profile, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	if profile == nil {
		return errors.New("User tidak ditemukan.")
	}

	if profile.Password != tokenPassHash {
		return errors.New("Token reset password sudah digunakan.")
	}

	// Hash password baru menggunakan bcrypt
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Simpan ke database menggunakan raw SQL query
	err = s.repo.UpdatePassword(ctx, email, string(hashedBytes))
	return err
}

