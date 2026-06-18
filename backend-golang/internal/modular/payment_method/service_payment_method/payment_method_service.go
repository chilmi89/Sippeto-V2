package service_payment_method

import (
	"context"

	"backend-golang/internal/modular/payment_method/dto_payment_method"
	"backend-golang/internal/modular/payment_method/repository_payment_method"
)

type PaymentMethodService interface {
	GetPaymentMethods(ctx context.Context, page, limit int, search, profileID string, isActiveFilter *bool) (*dto_payment_method.PaymentMethodListResponse, error)
	CreatePaymentMethod(ctx context.Context, req dto_payment_method.CreatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error)
	UpdatePaymentMethod(ctx context.Context, req dto_payment_method.UpdatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error)
	DeletePaymentMethod(ctx context.Context, id string) error
}

type paymentMethodService struct {
	repo repository_payment_method.PaymentMethodRepository
}

func NewPaymentMethodService(repo repository_payment_method.PaymentMethodRepository) PaymentMethodService {
	return &paymentMethodService{repo: repo}
}

func (s *paymentMethodService) GetPaymentMethods(ctx context.Context, page, limit int, search, profileID string, isActiveFilter *bool) (*dto_payment_method.PaymentMethodListResponse, error) {
	data, total, err := s.repo.FindPaymentMethods(ctx, page, limit, search, profileID, isActiveFilter)
	if err != nil {
		return nil, err
	}

	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return &dto_payment_method.PaymentMethodListResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *paymentMethodService) CreatePaymentMethod(ctx context.Context, req dto_payment_method.CreatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error) {
	return s.repo.CreatePaymentMethod(ctx, req)
}

func (s *paymentMethodService) UpdatePaymentMethod(ctx context.Context, req dto_payment_method.UpdatePaymentMethodRequest) (*dto_payment_method.PaymentMethodResponse, error) {
	return s.repo.UpdatePaymentMethod(ctx, req)
}

func (s *paymentMethodService) DeletePaymentMethod(ctx context.Context, id string) error {
	return s.repo.DeletePaymentMethod(ctx, id)
}
