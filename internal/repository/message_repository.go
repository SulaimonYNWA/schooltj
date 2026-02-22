package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type MessageRepository struct {
	DB *sql.DB
}

func NewMessageRepository(db *sql.DB) *MessageRepository {
	return &MessageRepository{DB: db}
}

func (r *MessageRepository) Send(ctx context.Context, m *domain.Message) error {
	m.ID = uuid.New().String()
	query := `INSERT INTO messages (id, from_user_id, to_user_id, content) VALUES (?, ?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, m.ID, m.FromUserID, m.ToUserID, m.Content)
	return err
}

func (r *MessageRepository) GetConversation(ctx context.Context, userID1, userID2 string) ([]domain.Message, error) {
	query := `SELECT m.id, m.from_user_id, COALESCE(f.name, f.email) as from_name, m.to_user_id, COALESCE(t.name, t.email) as to_name, m.content, m.is_read, m.created_at
		FROM messages m
		JOIN users f ON m.from_user_id = f.id
		JOIN users t ON m.to_user_id = t.id
		WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?)
		ORDER BY m.created_at ASC
		LIMIT 200`
	rows, err := r.DB.QueryContext(ctx, query, userID1, userID2, userID2, userID1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var messages []domain.Message
	for rows.Next() {
		var m domain.Message
		if err := rows.Scan(&m.ID, &m.FromUserID, &m.FromName, &m.ToUserID, &m.ToName, &m.Content, &m.IsRead, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, nil
}

func (r *MessageRepository) ListConversations(ctx context.Context, userID string) ([]domain.Conversation, error) {
	query := `SELECT
		sub.other_id,
		COALESCE(u.name, u.email) as user_name,
		u.email as user_email,
		sub.content as last_message,
		sub.created_at as last_time,
		(SELECT COUNT(*) FROM messages m2 WHERE m2.from_user_id = sub.other_id AND m2.to_user_id = ? AND m2.is_read = FALSE) as unread_count
	FROM (
		SELECT
			CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END as other_id,
			m.content,
			m.created_at,
			ROW_NUMBER() OVER (
				PARTITION BY LEAST(m.from_user_id, m.to_user_id), GREATEST(m.from_user_id, m.to_user_id)
				ORDER BY m.created_at DESC
			) as rn
		FROM messages m
		WHERE m.from_user_id = ? OR m.to_user_id = ?
	) sub
	JOIN users u ON u.id = sub.other_id
	WHERE sub.rn = 1
	ORDER BY sub.created_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var conversations []domain.Conversation
	for rows.Next() {
		var c domain.Conversation
		if err := rows.Scan(&c.UserID, &c.UserName, &c.UserEmail, &c.LastMessage, &c.LastTime, &c.UnreadCount); err != nil {
			return nil, err
		}
		conversations = append(conversations, c)
	}
	return conversations, nil
}

func (r *MessageRepository) MarkConversationRead(ctx context.Context, fromUserID, toUserID string) error {
	_, err := r.DB.ExecContext(ctx, `UPDATE messages SET is_read = TRUE WHERE from_user_id = ? AND to_user_id = ? AND is_read = FALSE`, fromUserID, toUserID)
	return err
}

func (r *MessageRepository) UnreadCount(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM messages WHERE to_user_id = ? AND is_read = FALSE`, userID).Scan(&count)
	return count, err
}
