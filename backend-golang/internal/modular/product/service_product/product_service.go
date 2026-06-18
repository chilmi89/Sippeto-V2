package service_product

import (
	"context"
	"errors"
	"math"

	"backend-golang/internal/modular/product/dto_product"
	"backend-golang/internal/modular/product/model_product"
	"backend-golang/internal/modular/product/repository_product"
	"backend-golang/internal/modular/storage/service_storage"
)

type ProductService interface {
	// Kategori
	GetCategoriesPaginated(ctx context.Context, page, limit int, scope, search string, profileID string) (*dto_product.CategoryPaginatedResponse, error)
	CreateCategory(ctx context.Context, req dto_product.CreateCategoryRequest) (*dto_product.CategoryResponse, error)
	UpdateCategory(ctx context.Context, req dto_product.UpdateCategoryRequest) (*dto_product.CategoryResponse, error)
	DeleteCategory(ctx context.Context, id string) error

	// Produk
	GetAllProducts(ctx context.Context) ([]dto_product.ProductResponse, error)
	GetProductsByTenant(ctx context.Context, tenantID string) ([]dto_product.ProductResponse, error)
	GetProductsByBranch(ctx context.Context, branchID string) ([]dto_product.ProductResponse, error)
	GetProductByID(ctx context.Context, id string) (*dto_product.ProductResponse, error)
	CreateProduct(ctx context.Context, req dto_product.CreateProductRequest) (*dto_product.ProductResponse, error)
	UpdateProduct(ctx context.Context, req dto_product.UpdateProductRequest) (*dto_product.ProductResponse, error)
	DeleteProduct(ctx context.Context, id string) error
}

type productService struct {
	repo       repository_product.ProductRepository
	storageSvc service_storage.StorageService
}

func NewProductService(repo repository_product.ProductRepository, storageSvc service_storage.StorageService) ProductService {
	return &productService{repo: repo, storageSvc: storageSvc}
}

// ─── Kategori ────────────────────────────────────────────────────────────────

func (s *productService) GetCategoriesPaginated(ctx context.Context, page, limit int, scope, search string, profileID string) (*dto_product.CategoryPaginatedResponse, error) {
	cats, total, err := s.repo.FindCategoriesPaginated(ctx, page, limit, scope, search, profileID)
	if err != nil {
		return nil, err
	}

	var data []dto_product.CategoryResponse
	for _, c := range cats {
		resp := dto_product.CategoryResponse{
			ID:        c.ID,
			ProfileID: c.ProfileID,
			Name:      c.Name,
			CreatedAt: c.CreatedAt,
		}
		if c.ProfileID != nil {
			resp.Profiles = &dto_product.CategoryProfileInfo{
				BusinessName: c.BusinessName,
				Email:        c.Email,
			}
		}
		data = append(data, resp)
	}
	if data == nil {
		data = []dto_product.CategoryResponse{}
	}

	return &dto_product.CategoryPaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

func (s *productService) CreateCategory(ctx context.Context, req dto_product.CreateCategoryRequest) (*dto_product.CategoryResponse, error) {
	cat := &model_product.ProductCategory{
		Name:      req.Name,
		ProfileID: req.ProfileID,
	}
	err := s.repo.CreateCategory(ctx, cat)
	if err != nil {
		return nil, err
	}
	return &dto_product.CategoryResponse{
		ID:        cat.ID,
		ProfileID: cat.ProfileID,
		Name:      cat.Name,
		CreatedAt: cat.CreatedAt,
	}, nil
}

func (s *productService) UpdateCategory(ctx context.Context, req dto_product.UpdateCategoryRequest) (*dto_product.CategoryResponse, error) {
	cat, err := s.repo.FindCategoryByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if cat == nil {
		return nil, errors.New("kategori tidak ditemukan")
	}

	if req.Name != nil {
		cat.Name = *req.Name
	}

	err = s.repo.UpdateCategory(ctx, cat)
	if err != nil {
		return nil, err
	}
	return &dto_product.CategoryResponse{
		ID:        cat.ID,
		ProfileID: cat.ProfileID,
		Name:      cat.Name,
		CreatedAt: cat.CreatedAt,
	}, nil
}

func (s *productService) DeleteCategory(ctx context.Context, id string) error {
	cat, err := s.repo.FindCategoryByID(ctx, id)
	if err != nil {
		return err
	}
	if cat == nil {
		return errors.New("kategori tidak ditemukan")
	}
	return s.repo.DeleteCategory(ctx, id)
}

// ─── Produk ──────────────────────────────────────────────────────────────────

func (s *productService) GetAllProducts(ctx context.Context) ([]dto_product.ProductResponse, error) {
	return s.repo.FindAllProducts(ctx)
}

func (s *productService) GetProductsByTenant(ctx context.Context, tenantID string) ([]dto_product.ProductResponse, error) {
	return s.repo.FindProductsByTenant(ctx, tenantID)
}

func (s *productService) GetProductsByBranch(ctx context.Context, branchID string) ([]dto_product.ProductResponse, error) {
	return s.repo.FindProductsByBranch(ctx, branchID)
}

func (s *productService) GetProductByID(ctx context.Context, id string) (*dto_product.ProductResponse, error) {
	p, err := s.repo.FindProductByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, errors.New("produk tidak ditemukan")
	}
	return p, nil
}

func (s *productService) CreateProduct(ctx context.Context, req dto_product.CreateProductRequest) (*dto_product.ProductResponse, error) {
	product, err := s.repo.CreateProduct(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.repo.FindProductByID(ctx, product.ID)
}

func (s *productService) UpdateProduct(ctx context.Context, req dto_product.UpdateProductRequest) (*dto_product.ProductResponse, error) {
	existing, err := s.repo.FindProductByID(ctx, req.ID)
	if err != nil || existing == nil {
		return nil, errors.New("produk tidak ditemukan")
	}

	// Hapus file gambar lama dari MinIO jika diganti dengan yang baru
	if req.ImageURL != nil && existing.ImageURL != nil && *existing.ImageURL != "" && *req.ImageURL != *existing.ImageURL {
		if delErr := s.storageSvc.DeleteFile(ctx, *existing.ImageURL); delErr != nil {
			_ = delErr
		}
	}

	product, err := s.repo.UpdateProduct(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.repo.FindProductByID(ctx, product.ID)
}

func (s *productService) DeleteProduct(ctx context.Context, id string) error {
	existing, err := s.repo.FindProductByID(ctx, id)
	if err != nil || existing == nil {
		return errors.New("produk tidak ditemukan")
	}

	// Hapus file gambar dari MinIO jika ada
	if existing.ImageURL != nil && *existing.ImageURL != "" {
		if delErr := s.storageSvc.DeleteFile(ctx, *existing.ImageURL); delErr != nil {
			// Log error tapi jangan gagalkan proses hapus produk
			_ = delErr
		}
	}

	return s.repo.DeleteProduct(ctx, id)
}
