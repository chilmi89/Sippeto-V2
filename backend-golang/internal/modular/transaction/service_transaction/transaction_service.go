package service_transaction

import (
	"context"

	"backend-golang/internal/modular/transaction/dto_transaction"
	"backend-golang/internal/modular/transaction/repository_transaction"
)

type TransactionService interface {
	GetGroup(ctx context.Context, id string) (*dto_transaction.TransactionGroupResponse, error)
	GetGroups(ctx context.Context, profileID, branchID, search, dateStart, dateEnd string, page, limit int) (*dto_transaction.TransactionGroupListResponse, error)
	CreateGroup(ctx context.Context, req dto_transaction.CreateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error)
	UpdateGroup(ctx context.Context, req dto_transaction.UpdateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error)
	UpdateGroupStatus(ctx context.Context, id string, status int) (*dto_transaction.TransactionGroupResponse, error)
	DeleteGroup(ctx context.Context, id string) error

	// Items
	GetItems(ctx context.Context, groupID, categoryID, itemType string, page, limit int) (*dto_transaction.TransactionItemListResponse, error)
	GetItem(ctx context.Context, id string) (*dto_transaction.TransactionItemResponse, error)
	CreateItemDirect(ctx context.Context, req dto_transaction.CreateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error)
	UpdateItemDirect(ctx context.Context, req dto_transaction.UpdateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error)
	DeleteItemDirect(ctx context.Context, id string) error

	// Attachments
	GetAttachments(ctx context.Context, groupID string, page, limit int) (*dto_transaction.TransactionAttachmentListResponse, error)
	CreateAttachment(ctx context.Context, req dto_transaction.CreateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error)
	UpdateAttachment(ctx context.Context, req dto_transaction.UpdateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error)
	DeleteAttachment(ctx context.Context, id string) error
}

type transactionService struct {
	repo repository_transaction.TransactionRepository
}

func NewTransactionService(repo repository_transaction.TransactionRepository) TransactionService {
	return &transactionService{repo: repo}
}

func (s *transactionService) GetGroup(ctx context.Context, id string) (*dto_transaction.TransactionGroupResponse, error) {
	return s.repo.GetGroup(ctx, id)
}

func (s *transactionService) GetGroups(ctx context.Context, profileID, branchID, search, dateStart, dateEnd string, page, limit int) (*dto_transaction.TransactionGroupListResponse, error) {
	data, total, err := s.repo.GetGroups(ctx, profileID, branchID, search, dateStart, dateEnd, page, limit)
	if err != nil {
		return nil, err
	}

	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return &dto_transaction.TransactionGroupListResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *transactionService) CreateGroup(ctx context.Context, req dto_transaction.CreateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error) {
	return s.repo.CreateGroup(ctx, req)
}

func (s *transactionService) UpdateGroup(ctx context.Context, req dto_transaction.UpdateTransactionGroupRequest) (*dto_transaction.TransactionGroupResponse, error) {
	return s.repo.UpdateGroup(ctx, req)
}

func (s *transactionService) UpdateGroupStatus(ctx context.Context, id string, status int) (*dto_transaction.TransactionGroupResponse, error) {
	return s.repo.UpdateGroupStatusDirect(ctx, id, status)
}

func (s *transactionService) DeleteGroup(ctx context.Context, id string) error {
	return s.repo.DeleteGroup(ctx, id)
}

func (s *transactionService) GetItems(ctx context.Context, groupID, categoryID, itemType string, page, limit int) (*dto_transaction.TransactionItemListResponse, error) {
	data, total, err := s.repo.GetItems(ctx, groupID, categoryID, itemType, page, limit)
	if err != nil {
		return nil, err
	}

	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return &dto_transaction.TransactionItemListResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *transactionService) GetItem(ctx context.Context, id string) (*dto_transaction.TransactionItemResponse, error) {
	return s.repo.GetItem(ctx, id)
}

func (s *transactionService) CreateItemDirect(ctx context.Context, req dto_transaction.CreateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error) {
	return s.repo.CreateItemDirect(ctx, req)
}

func (s *transactionService) UpdateItemDirect(ctx context.Context, req dto_transaction.UpdateTransactionItemDirectRequest) (*dto_transaction.TransactionItemResponse, error) {
	return s.repo.UpdateItemDirect(ctx, req)
}

func (s *transactionService) DeleteItemDirect(ctx context.Context, id string) error {
	_, err := s.repo.DeleteItemDirect(ctx, id)
	return err
}

func (s *transactionService) GetAttachments(ctx context.Context, groupID string, page, limit int) (*dto_transaction.TransactionAttachmentListResponse, error) {
	data, total, err := s.repo.GetAttachments(ctx, groupID, page, limit)
	if err != nil {
		return nil, err
	}

	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return &dto_transaction.TransactionAttachmentListResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *transactionService) CreateAttachment(ctx context.Context, req dto_transaction.CreateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error) {
	return s.repo.CreateAttachment(ctx, req)
}

func (s *transactionService) UpdateAttachment(ctx context.Context, req dto_transaction.UpdateAttachmentRequest) (*dto_transaction.TransactionAttachmentResponse, error) {
	return s.repo.UpdateAttachment(ctx, req)
}

func (s *transactionService) DeleteAttachment(ctx context.Context, id string) error {
	return s.repo.DeleteAttachment(ctx, id)
}
