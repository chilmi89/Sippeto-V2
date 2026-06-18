package controller_product

import (
	"net/http"
	"strconv"

	"backend-golang/internal/modular/product/dto_product"
	"backend-golang/internal/modular/product/service_product"

	"github.com/gin-gonic/gin"
)

type ProductController struct {
	svc service_product.ProductService
}

func NewProductController(svc service_product.ProductService) *ProductController {
	return &ProductController{svc: svc}
}

// ─── Kategori ────────────────────────────────────────────────────────────────

func (ctrl *ProductController) GetCategories(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	scope := c.DefaultQuery("scope", "all")
	search := c.Query("search")
	profileID := c.Query("profile_id")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	resp, err := ctrl.svc.GetCategoriesPaginated(c.Request.Context(), page, limit, scope, search, profileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data kategori"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (ctrl *ProductController) CreateCategory(c *gin.Context) {
	var req dto_product.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat, err := ctrl.svc.CreateCategory(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat kategori"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"data":    cat,
		"message": "Kategori produk berhasil ditambahkan",
	})
}

func (ctrl *ProductController) UpdateCategory(c *gin.Context) {
	var req dto_product.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat, err := ctrl.svc.UpdateCategory(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "kategori tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kategori"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":    cat,
		"message": "Kategori produk berhasil diperbarui",
	})
}

func (ctrl *ProductController) DeleteCategory(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID kategori wajib disertakan"})
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
	c.JSON(http.StatusOK, gin.H{"message": "Kategori produk berhasil dihapus"})
}

// ─── Produk ──────────────────────────────────────────────────────────────────

func (ctrl *ProductController) GetProducts(c *gin.Context) {
	id := c.Query("id")
	tenantID := c.Query("tenant_id")
	branchID := c.Query("branch_id")

	if id != "" {
		p, err := ctrl.svc.GetProductByID(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": []dto_product.ProductResponse{*p}})
		return
	}

	if branchID != "" {
		products, err := ctrl.svc.GetProductsByBranch(c.Request.Context(), branchID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data produk"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": products})
		return
	}

	if tenantID != "" {
		products, err := ctrl.svc.GetProductsByTenant(c.Request.Context(), tenantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data produk"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": products})
		return
	}

	// Global (Superadmin)
	products, err := ctrl.svc.GetAllProducts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data produk"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": products})
}

func (ctrl *ProductController) CreateProduct(c *gin.Context) {
	var req dto_product.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := ctrl.svc.CreateProduct(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat produk"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"data":    product,
		"message": "Produk berhasil dibuat",
	})
}

func (ctrl *ProductController) UpdateProduct(c *gin.Context) {
	var req dto_product.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := ctrl.svc.UpdateProduct(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "produk tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui produk"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":    product,
		"message": "Produk berhasil diperbarui",
	})
}

func (ctrl *ProductController) DeleteProduct(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID produk tidak ditemukan"})
		return
	}

	err := ctrl.svc.DeleteProduct(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "produk tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus produk"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Produk berhasil dihapus"})
}
