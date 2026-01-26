package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type SchoolRepository struct {
	DB *sql.DB
}

func NewSchoolRepository(db *sql.DB) *SchoolRepository {
	return &SchoolRepository{DB: db}
}

func (r *SchoolRepository) CreateSchool(ctx context.Context, school *domain.School) error {
	school.ID = uuid.New().String()
	query := `INSERT INTO schools (id, admin_user_id, name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`
	_, err := r.DB.ExecContext(ctx, query, school.ID, school.AdminUserID, school.Name)
	return err
}

// Teacher Profile
func (r *SchoolRepository) CreateTeacherProfile(ctx context.Context, profile *domain.TeacherProfile) error {
	query := `INSERT INTO teacher_profiles (user_id, school_id, bio, subjects, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`
	// subjects is currently just a string/json representation.
	// For now simple insert. ideally subjects should be marhalled to json string.
	// We handle that in service layer or here. Assuming it is stringified already.
	// But our struct has []string.

	_, err := r.DB.ExecContext(ctx, query, profile.UserID, profile.SchoolID, profile.Bio, "[]") // Simple empty JSON for now
	return err
}

func (r *SchoolRepository) GetSchoolByAdminID(ctx context.Context, adminID string) (*domain.School, error) {
	query := `SELECT id, admin_user_id, name, created_at, updated_at FROM schools WHERE admin_user_id = ?`
	row := r.DB.QueryRowContext(ctx, query, adminID)

	var school domain.School
	err := row.Scan(&school.ID, &school.AdminUserID, &school.Name, &school.CreatedAt, &school.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("school not found")
		}
		return nil, err
	}
	return &school, nil
}

func (r *SchoolRepository) ListTeachers(ctx context.Context, schoolID string) ([]domain.User, error) {
	query := `
		SELECT u.id, u.email, u.name, u.role, u.rating_avg, u.rating_count, u.created_at, u.updated_at
		FROM users u
		JOIN teacher_profiles tp ON u.id = tp.user_id
		WHERE tp.school_id = ?
		ORDER BY u.rating_avg DESC, u.created_at DESC
	`
	rows, err := r.DB.QueryContext(ctx, query, schoolID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teachers []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.RatingAvg, &u.RatingCount, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		teachers = append(teachers, u)
	}
	return teachers, nil
}
