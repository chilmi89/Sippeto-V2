package service_auth

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
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
	Register(ctx context.Context, req dto_auth.RegisterRequest) (*dto_auth.RegisterResponse, error)
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

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, errors.New("Konfigurasi server tidak valid.")
	}

	// 1. Generate Access Token (2 jam)
	accessClaims := jwt.MapClaims{
		"id":        profile.ID,
		"email":     profile.Email,
		"role_id":   profile.RoleID,
		"role_name": roleName,
		"exp":       time.Now().Add(2 * time.Hour).Unix(),
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
		return nil, errors.New("Konfigurasi server tidak valid.")
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode signing tidak valid: %v", t.Header["alg"])
		}
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

	// Buat Access Token baru (2 jam)
	accessClaims := jwt.MapClaims{
		"id":        userID,
		"email":     email,
		"role_id":   roleID,
		"role_name": roleName,
		"exp":       time.Now().Add(2 * time.Hour).Unix(),
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
		return "", errors.New("Konfigurasi server tidak valid.")
	}

	claims := jwt.MapClaims{
		"email": profile.Email,
		"exp":   time.Now().Add(15 * time.Minute).Unix(),
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
		return errors.New("Konfigurasi server tidak valid.")
	}

	token, err := jwt.Parse(req.Token, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode signing tidak valid: %v", t.Header["alg"])
		}
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
	if !ok || email == "" {
		return errors.New("Token tidak valid.")
	}

	// Pastikan user masih ada
	profile, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	if profile == nil {
		return errors.New("User tidak ditemukan.")
	}

	if profile.Password == "" {
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

func (s *authService) Register(ctx context.Context, req dto_auth.RegisterRequest) (*dto_auth.RegisterResponse, error) {
	// Periksa apakah email sudah terdaftar
	existing, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("Email sudah terdaftar.")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, errors.New("Gagal memproses sandi.")
	}

	userID, err := generateUUID()
	if err != nil {
		return nil, errors.New("Gagal membuat ID pengguna.")
	}
	err = s.repo.CreateProfile(ctx, userID, req.Nama, req.Email, string(hashed))
	if err != nil {
		return nil, err
	}

	return &dto_auth.RegisterResponse{
		Message: "Registrasi berhasil.",
		User: dto_auth.RegisteredUser{
			ID:    userID,
			Nama:  req.Nama,
			Email: req.Email,
		},
	}, nil
}

func generateUUID() (string, error) {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("gagal generate UUID: %w", err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
}


