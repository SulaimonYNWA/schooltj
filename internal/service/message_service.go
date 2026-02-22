package service

import (
	"context"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type MessageService struct {
	repo *repository.MessageRepository
}

func NewMessageService(repo *repository.MessageRepository) *MessageService {
	return &MessageService{repo: repo}
}

func (s *MessageService) Send(ctx context.Context, m *domain.Message) error {
	return s.repo.Send(ctx, m)
}

func (s *MessageService) GetConversation(ctx context.Context, userID1, userID2 string) ([]domain.Message, error) {
	return s.repo.GetConversation(ctx, userID1, userID2)
}

func (s *MessageService) ListConversations(ctx context.Context, userID string) ([]domain.Conversation, error) {
	return s.repo.ListConversations(ctx, userID)
}

func (s *MessageService) MarkConversationRead(ctx context.Context, fromUserID, toUserID string) error {
	return s.repo.MarkConversationRead(ctx, fromUserID, toUserID)
}

func (s *MessageService) UnreadCount(ctx context.Context, userID string) (int, error) {
	return s.repo.UnreadCount(ctx, userID)
}
