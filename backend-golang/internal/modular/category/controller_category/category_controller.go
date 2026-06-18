package controller_category

import (
	"net/http"
	"strconv"

	"backend-golang/internal/modular/category/dto_category"
	"backend-golang/internal/modular/category/service_category"

	"github.com/gin-gonic/gin"
)

type CategoryController struct {
	svc service_category.CategoryService
}

func NewCategoryController(svc service_category.CategoryService) *CategoryController {
	return &CategoryController{svc: svc}
}

func (ctrl *CategoryController) GetCategories(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	typeFilter := c.Query("type")
	search := c.Query("search")
	profileID := c.Query("profile_id")

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	res, err := ctrl.svc.GetCategories(c.Request.Context(), page, limit, typeFilter, search, profileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data kategori"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *CategoryController) CreateCategory(c *gin.Context) {
	var req dto_category.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama dan Tipe wajib diisi"})
		return
	}

	res, err := ctrl.svc.CreateCategory(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan kategori"})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (ctrl *CategoryController) UpdateCategory(c *gin.Context) {
	var req dto_category.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	res, err := ctrl.svc.UpdateCategory(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "kategori tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kategori"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *CategoryController) DeleteCategory(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID kategori tidak ditemukan"})
		return
	}

	err := ctrl.svc.DeleteCategory(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "kategori tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kategori"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
}
