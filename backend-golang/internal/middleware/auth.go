package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ambil token dari cookie atau Authorization header
		tokenString, err := c.Cookie("token")
		if err != nil || tokenString == "" {
			authHeader := c.GetHeader("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi."})
			c.Abort()
			return
		}

		// 2. Verifikasi token menggunakan JWT_SECRET
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
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sistem bermasalah."})
			c.Abort()
			return
		}

		userID, ok := claims["id"].(string)
		if !ok || userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sistem bermasalah."})
			c.Abort()
			return
		}

		// 3. Simpan data user ke context Gin
		c.Set("user_id", userID)
		if email, ok := claims["email"].(string); ok {
			c.Set("user_email", email)
		}
		if roleName, ok := claims["role_name"].(string); ok {
			c.Set("user_role", roleName)
		}

		c.Next()
	}
}
