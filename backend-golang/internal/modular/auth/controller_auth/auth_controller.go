package controller_auth

import (
	"net/http"

	"backend-golang/internal/modular/auth/dto_auth"
	"backend-golang/internal/modular/auth/service_auth"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	svc service_auth.AuthService
}

func NewAuthController(svc service_auth.AuthService) *AuthController {
	return &AuthController{svc: svc}
}

func (ctrl *AuthController) Login(c *gin.Context) {
	var req dto_auth.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email dan password wajib diisi.",
		})
		return
	}

	resp, err := ctrl.svc.Login(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Set HTTP-Only Cookie untuk Refresh Token (Valid 7 Hari)
	c.SetCookie("refresh_token", resp.RefreshToken, 60*60*24*7, "/", "", false, true)

	c.JSON(http.StatusOK, resp)
}

func (ctrl *AuthController) Refresh(c *gin.Context) {
	// 1. Ambil refresh token dari cookie
	refreshToken, err := c.Cookie("refresh_token")

	// 2. Fallback: ambil dari JSON body jika cookie tidak ditemukan
	if err != nil || refreshToken == "" {
		var req dto_auth.RefreshRequest
		if err := c.ShouldBindJSON(&req); err == nil {
			refreshToken = req.RefreshToken
		}
	}

	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Refresh token tidak ditemukan di cookie maupun request body.",
		})
		return
	}

	resp, err := ctrl.svc.RefreshToken(c.Request.Context(), refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (ctrl *AuthController) ForgotPassword(c *gin.Context) {
	var req dto_auth.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email wajib diisi dengan format yang benar.",
		})
		return
	}

	token, err := ctrl.svc.GenerateResetToken(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Di lingkungan production, token dikirim via email.
	// Untuk kemudahan testing/dev, token dikembalikan di response JSON.
	c.JSON(http.StatusOK, dto_auth.ForgotPasswordResponse{
		Message: "Token reset password berhasil dibuat. Gunakan token ini untuk mereset password.",
		Token:   token,
	})
}

func (ctrl *AuthController) ResetPassword(c *gin.Context) {
	var req dto_auth.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Token dan password baru wajib diisi.",
		})
		return
	}

	err := ctrl.svc.ResetPassword(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password berhasil diubah. Token reset ini tidak dapat digunakan kembali.",
	})
}

func (ctrl *AuthController) Logout(c *gin.Context) {
	// Hancurkan cookie auth dengan set expired (maxAge -1)
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.SetCookie("role_name", "", -1, "/", "", false, false)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logout berhasil.",
	})
}

