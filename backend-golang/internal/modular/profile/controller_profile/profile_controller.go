package controller_profile

import (
	"net/http"

	"backend-golang/internal/modular/profile/dto_profile"
	"backend-golang/internal/modular/profile/service_profile"

	"github.com/gin-gonic/gin"
)

type ProfileController struct {
	svc service_profile.ProfileService
}

func NewProfileController(svc service_profile.ProfileService) *ProfileController {
	return &ProfileController{svc: svc}
}

func (ctrl *ProfileController) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terautentikasi."})
		return
	}

	resp, err := ctrl.svc.GetProfileMe(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profil tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (ctrl *ProfileController) GetUsers(c *gin.Context) {
	users, err := ctrl.svc.GetUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func (ctrl *ProfileController) GetUserByID(c *gin.Context) {
	id := c.Param("id")
	user, err := ctrl.svc.GetUserByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "User tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func (ctrl *ProfileController) CreateUser(c *gin.Context) {
	var req dto_profile.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email, password, dan nama wajib diisi."})
		return
	}

	newUser, err := ctrl.svc.CreateUser(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "Email sudah terdaftar" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email sudah terdaftar."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    newUser,
		"message": "User berhasil ditambahkan",
	})
}

func (ctrl *ProfileController) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req dto_profile.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	updatedUser, err := ctrl.svc.UpdateUser(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "User tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
			return
		}
		if err.Error() == "Email sudah digunakan oleh user lain" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email sudah digunakan oleh user lain"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    updatedUser,
		"message": "User berhasil diperbarui",
	})
}

func (ctrl *ProfileController) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	err := ctrl.svc.DeleteUser(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "User tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User berhasil dihapus",
	})
}

