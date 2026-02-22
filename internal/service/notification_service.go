package service

import (
	"context"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type NotificationService struct {
	repo *repository.NotificationRepository
}

func NewNotificationService(repo *repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

func (s *NotificationService) Create(ctx context.Context, n *domain.Notification) error {
	return s.repo.Create(ctx, n)
}

func (s *NotificationService) ListByUser(ctx context.Context, userID string) ([]domain.Notification, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *NotificationService) UnreadCount(ctx context.Context, userID string) (int, error) {
	return s.repo.UnreadCount(ctx, userID)
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllRead(ctx, userID)
}

func (s *NotificationService) MarkRead(ctx context.Context, id, userID string) error {
	return s.repo.MarkRead(ctx, id, userID)
}
