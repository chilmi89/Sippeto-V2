package service_notification

import (
	"context"

	"backend-golang/internal/modular/notification/dto_notification"
	"backend-golang/internal/modular/notification/repository_notification"
)

type NotificationService interface {
	GetNotifications(ctx context.Context, userID string) (*dto_notification.NotificationResponse, error)
}

type notificationService struct {
	repo repository_notification.NotificationRepository
}

func NewNotificationService(repo repository_notification.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) GetNotifications(ctx context.Context, userID string) (*dto_notification.NotificationResponse, error) {
	tenantOwnerID, branchID, err := s.repo.GetTenantOwnerID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.repo.GetNotifications(ctx, tenantOwnerID, branchID)
}
