package controller_profile

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"backend-golang/internal/modular/profile/service_profile"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type ProfileController struct {
	svc service_profile.ProfileService
}

func NewProfileController(svc service_profile.ProfileService) *ProfileController {
	return &ProfileController{svc: svc}
}

func (ctrl *ProfileController) GetMe(c *gin.Context) {
	// 1. Ambil token dari cookie atau Authorization header
	tokenString, err := c.Cookie("token")
	if err != nil || tokenString == "" {
		// Coba ambil dari header Authorization
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi."})
		return
	}

	// 2. Verifikasi token menggunakan JWT_SECRET yang sama dengan frontend
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key"
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode signing tidak valid: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sistem bermasalah."})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sistem bermasalah."})
		return
	}

	userID, ok := claims["id"].(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sistem bermasalah."})
		return
	}

	// 3. Panggil service untuk mengambil profil dan permissions
	resp, err := ctrl.svc.GetProfileMe(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
