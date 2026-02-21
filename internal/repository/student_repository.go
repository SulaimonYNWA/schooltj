package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/schooltj/internal/domain"
)

type StudentRepository struct {
	DB *sql.DB
}

func NewStudentRepository(db *sql.DB) *StudentRepository {
	return &StudentRepository{DB: db}
}

func (r *StudentRepository) Create(ctx context.Context, student *domain.Student) error {
	query := `INSERT INTO students (user_id, parent_name, grade_level, school_id, teacher_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`
	_, err := r.DB.ExecContext(ctx, query, student.UserID, student.ParentName, student.GradeLevel, student.SchoolID, student.TeacherID)
	return err
}

func (r *StudentRepository) Update(ctx context.Context, student *domain.Student) error {
	query := `UPDATE students SET parent_name = ?, grade_level = ?, school_id = ?, teacher_id = ?, updated_at = NOW() WHERE user_id = ?`
	_, err := r.DB.ExecContext(ctx, query, student.ParentName, student.GradeLevel, student.SchoolID, student.TeacherID, student.UserID)
	return err
}

func (r *StudentRepository) GetByUserID(ctx context.Context, userID string) (*domain.Student, error) {
	query := `SELECT user_id, parent_name, grade_level, school_id, teacher_id, created_at, updated_at FROM students WHERE user_id = ?`
	row := r.DB.QueryRowContext(ctx, query, userID)

	var s domain.Student
	var schoolID sql.NullString
	var teacherID sql.NullString

	err := row.Scan(&s.UserID, &s.ParentName, &s.GradeLevel, &schoolID, &teacherID, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		// If not found, return nil (no profile yet) or error
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // Return nil if no student profile
		}
		return nil, err
	}

	if schoolID.Valid {
		s.SchoolID = &schoolID.String
	}
	if teacherID.Valid {
		s.TeacherID = &teacherID.String
	}

	return &s, nil
}

// ListStudents fetches students with pagination and optional search by name.
// Sorts by rating_avg DESC by default.
func (r *StudentRepository) ListStudents(ctx context.Context, limit, offset int, search string) ([]domain.User, error) {
	query := `
		SELECT id, email, name, role, rating_avg, rating_count, created_at, updated_at
		FROM users
		WHERE role = 'student'
	`
	args := []interface{}{}

	if search != "" {
		query += ` AND name LIKE ?`
		args = append(args, "%"+search+"%")
	}

	query += ` ORDER BY rating_avg DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.RatingAvg, &u.RatingCount, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		students = append(students, u)
	}
	return students, nil
}

// ListStudentsBySchool fetches students who are enrolled in courses belonging to the given school.
func (r *StudentRepository) ListStudentsBySchool(ctx context.Context, schoolID string) ([]domain.User, error) {
	// A student is linked to a school if they have an enrollment in a course that belongs to that school.
	query := `
		SELECT DISTINCT u.id, u.email, u.name, u.role, u.rating_avg, u.rating_count, u.created_at, u.updated_at
		FROM users u
		JOIN enrollments e ON u.id = e.student_user_id
		JOIN courses c ON e.course_id = c.id
		WHERE c.school_id = ?
		ORDER BY u.name ASC
	`
	rows, err := r.DB.QueryContext(ctx, query, schoolID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.RatingAvg, &u.RatingCount, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		students = append(students, u)
	}
	return students, nil
}

// ListStudentsByTeacher fetches students who are enrolled in courses taught by the given teacher.
func (r *StudentRepository) ListStudentsByTeacher(ctx context.Context, teacherID string) ([]domain.User, error) {
	// A student is linked to a teacher if they have an enrollment in a course taught by that teacher.
	query := `
		SELECT DISTINCT u.id, u.email, u.name, u.role, u.rating_avg, u.rating_count, u.created_at, u.updated_at
		FROM users u
		JOIN enrollments e ON u.id = e.student_user_id
		JOIN courses c ON e.course_id = c.id
		WHERE c.teacher_id = ?
		ORDER BY u.name ASC
	`
	rows, err := r.DB.QueryContext(ctx, query, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.RatingAvg, &u.RatingCount, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		students = append(students, u)
	}
	return students, nil
}

// GetStudentsBySchoolAdminID is a helper to get students for a school admin using their user ID
func (r *StudentRepository) GetStudentsBySchoolAdminID(ctx context.Context, adminUserID string) ([]domain.User, error) {
	// First find the school ID for this admin
	var schoolID string
	err := r.DB.QueryRowContext(ctx, "SELECT id FROM schools WHERE admin_user_id = ?", adminUserID).Scan(&schoolID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("school not found for admin %s", adminUserID)
		}
		return nil, err
	}
	return r.ListStudentsBySchool(ctx, schoolID)
}
