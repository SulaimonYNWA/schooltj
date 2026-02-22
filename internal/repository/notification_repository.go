package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type NotificationRepository struct {
	DB *sql.DB
}

func NewNotificationRepository(db *sql.DB) *NotificationRepository {
	return &NotificationRepository{DB: db}
}

func (r *NotificationRepository) Create(ctx context.Context, n *domain.Notification) error {
	n.ID = uuid.New().String()
	query := `INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, n.ID, n.UserID, n.Type, n.Title, n.Message, n.Link)
	return err
}

func (r *NotificationRepository) ListByUser(ctx context.Context, userID string) ([]domain.Notification, error) {
	query := `SELECT id, user_id, type, title, message, COALESCE(link, ''), is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
	rows, err := r.DB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var notifications []domain.Notification
	for rows.Next() {
		var n domain.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &n.Link, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, nil
}

func (r *NotificationRepository) UnreadCount(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE`, userID).Scan(&count)
	return count, err
}

func (r *NotificationRepository) MarkAllRead(ctx context.Context, userID string) error {
	_, err := r.DB.ExecContext(ctx, `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`, userID)
	return err
}

func (r *NotificationRepository) MarkRead(ctx context.Context, id, userID string) error {
	_, err := r.DB.ExecContext(ctx, `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`, id, userID)
	return err
}
