package service_category

import (
	"context"

	"backend-golang/internal/modular/category/dto_category"
	"backend-golang/internal/modular/category/repository_category"
)

type CategoryService interface {
	GetCategories(ctx context.Context, page, limit int, typeFilter, search, profileID string) (*dto_category.CategoryListResponse, error)
	CreateCategory(ctx context.Context, req dto_category.CreateCategoryRequest) (*dto_category.CategoryResponse, error)
	UpdateCategory(ctx context.Context, req dto_category.UpdateCategoryRequest) (*dto_category.CategoryResponse, error)
	DeleteCategory(ctx context.Context, id string) error
}

type categoryService struct {
	repo repository_category.CategoryRepository
}

func NewCategoryService(repo repository_category.CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) GetCategories(ctx context.Context, page, limit int, typeFilter, search, profileID string) (*dto_category.CategoryListResponse, error) {
	data, total, err := s.repo.FindCategories(ctx, page, limit, typeFilter, search, profileID)
	if err != nil {
		return nil, err
	}

	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return &dto_category.CategoryListResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *categoryService) CreateCategory(ctx context.Context, req dto_category.CreateCategoryRequest) (*dto_category.CategoryResponse, error) {
	return s.repo.CreateCategory(ctx, req)
}

func (s *categoryService) UpdateCategory(ctx context.Context, req dto_category.UpdateCategoryRequest) (*dto_category.CategoryResponse, error) {
	return s.repo.UpdateCategory(ctx, req)
}

func (s *categoryService) DeleteCategory(ctx context.Context, id string) error {
	return s.repo.DeleteCategory(ctx, id)
}
