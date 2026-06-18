package service_order

import (
	"context"

	"backend-golang/internal/modular/order/dto_order"
	"backend-golang/internal/modular/order/repository_order"
)

type OrderService interface {
	GetOrders(ctx context.Context, userID string, q dto_order.GetOrdersQuery) (*dto_order.PaginatedOrdersResponse, error)
	UpdateOrderStatus(ctx context.Context, userID, id, status string) error
	CreateOrder(ctx context.Context, req dto_order.CheckoutRequest) (*dto_order.OrderResponse, error)
}

type orderService struct {
	repo repository_order.OrderRepository
}

func NewOrderService(repo repository_order.OrderRepository) OrderService {
	return &orderService{repo: repo}
}

func (s *orderService) GetOrders(ctx context.Context, userID string, q dto_order.GetOrdersQuery) (*dto_order.PaginatedOrdersResponse, error) {
	tenantOwnerID, _, err := s.repo.GetTenantOwnerID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 5
	}
	q.ProfileID = tenantOwnerID

	data, total, err := s.repo.GetOrders(ctx, q)
	if err != nil {
		return nil, err
	}

	totalPages := (total + q.Limit - 1) / q.Limit

	return &dto_order.PaginatedOrdersResponse{
		Data:       data,
		Total:      total,
		Page:       q.Page,
		Limit:      q.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *orderService) UpdateOrderStatus(ctx context.Context, userID, id, status string) error {
	tenantOwnerID, _, err := s.repo.GetTenantOwnerID(ctx, userID)
	if err != nil {
		return err
	}

	return s.repo.UpdateOrderStatus(ctx, id, status, tenantOwnerID)
}

func (s *orderService) CreateOrder(ctx context.Context, req dto_order.CheckoutRequest) (*dto_order.OrderResponse, error) {
	return s.repo.CreateOrder(ctx, req)
}
