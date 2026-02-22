package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct {
	DB *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

func (r *UserRepository) CreateUser(ctx context.Context, user *domain.User) error {
	user.ID = uuid.New().String()
	query := `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`
	_, err := r.DB.ExecContext(ctx, query, user.ID, user.Email, user.Name, user.PasswordHash, user.Role)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, email, name, password_hash, role, created_at, updated_at FROM users WHERE email = ?`
	row := r.DB.QueryRowContext(ctx, query, email)

	var user domain.User
	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	query := `SELECT id, email, name, password_hash, role, created_at, updated_at FROM users WHERE id = ?`
	row := r.DB.QueryRowContext(ctx, query, id)

	var user domain.User
	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdateUser(ctx context.Context, user *domain.User) error {
	query := `UPDATE users SET email = ?, name = ?, updated_at = NOW() WHERE id = ?`
	_, err := r.DB.ExecContext(ctx, query, user.Email, user.Name, user.ID)
	return err
}

func (r *UserRepository) UpdatePassword(ctx context.Context, userID, hashedPassword string) error {
	query := `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`
	_, err := r.DB.ExecContext(ctx, query, hashedPassword, userID)
	return err
}

func (r *UserRepository) SearchUsers(ctx context.Context, q string) ([]domain.User, error) {
	query := `SELECT id, email, COALESCE(name, '') as name, role FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY name LIMIT 10`
	pattern := "%" + q + "%"
	rows, err := r.DB.QueryContext(ctx, query, pattern, pattern)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
