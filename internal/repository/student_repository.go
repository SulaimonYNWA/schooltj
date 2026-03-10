package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
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

// ListStudentsByCourse fetches students enrolled in a specific course, sorted by rating.
func (r *StudentRepository) ListStudentsByCourse(ctx context.Context, courseID string, limit, offset int, search string) ([]domain.User, error) {
	query := `
		SELECT DISTINCT u.id, u.email, u.name, u.role, u.rating_avg, u.rating_count, u.created_at, u.updated_at
		FROM users u
		JOIN enrollments e ON u.id = e.student_user_id
		WHERE e.course_id = ? AND u.role = 'student' AND e.status = 'active'
	`
	args := []interface{}{courseID}

	if search != "" {
		query += ` AND u.name LIKE ?`
		args = append(args, "%"+search+"%")
	}

	query += ` ORDER BY u.rating_avg DESC LIMIT ? OFFSET ?`
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

// ListStudentsByConnection fetches students who share at least one course with the given user.
func (r *StudentRepository) ListStudentsByConnection(ctx context.Context, userID string, limit, offset int, search string) ([]domain.User, error) {
	query := `
		SELECT DISTINCT u.id, u.email, u.name, u.role, u.rating_avg, u.rating_count, u.created_at, u.updated_at
		FROM users u
		JOIN enrollments e2 ON u.id = e2.student_user_id
		WHERE e2.course_id IN (
			SELECT e1.course_id FROM enrollments e1 WHERE e1.student_user_id = ? AND e1.status = 'active'
		)
		AND u.id != ?
		AND u.role = 'student'
		AND e2.status = 'active'
	`
	args := []interface{}{userID, userID}

	if search != "" {
		query += ` AND u.name LIKE ?`
		args = append(args, "%"+search+"%")
	}

	query += ` ORDER BY u.rating_avg DESC LIMIT ? OFFSET ?`
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

// SearchStudentSuggestions returns lightweight autocomplete results (top 8 matches).
func (r *StudentRepository) SearchStudentSuggestions(ctx context.Context, query string) ([]domain.User, error) {
	sqlQuery := `
		SELECT id, email, name, role, rating_avg, rating_count, created_at, updated_at
		FROM users
		WHERE role = 'student' AND name LIKE ?
		ORDER BY rating_avg DESC
		LIMIT 8
	`
	rows, err := r.DB.QueryContext(ctx, sqlQuery, "%"+query+"%")
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

// Progress Tracking
func (r *StudentRepository) MarkTopicComplete(ctx context.Context, studentID, topicID string) error {
	query := `INSERT INTO topic_completions (student_user_id, topic_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE completed_at = NOW()`
	_, err := r.DB.ExecContext(ctx, query, studentID, topicID)
	return err
}

func (r *StudentRepository) UnmarkTopicComplete(ctx context.Context, studentID, topicID string) error {
	query := `DELETE FROM topic_completions WHERE student_user_id = ? AND topic_id = ?`
	_, err := r.DB.ExecContext(ctx, query, studentID, topicID)
	return err
}

func (r *StudentRepository) GetCompletedTopics(ctx context.Context, studentID, courseID string) ([]string, error) {
	query := `
		SELECT tc.topic_id 
		FROM topic_completions tc
		JOIN course_curriculum_topics cct ON tc.topic_id = cct.id
		WHERE tc.student_user_id = ? AND cct.course_id = ?
	`
	rows, err := r.DB.QueryContext(ctx, query, studentID, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topicIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		topicIDs = append(topicIDs, id)
	}
	return topicIDs, nil
}

func (r *StudentRepository) GetCourseProgress(ctx context.Context, studentID, courseID string) (float64, error) {
	query := `
		SELECT 
			COALESCE(
				(SELECT COUNT(*) FROM topic_completions tc 
				 JOIN course_curriculum_topics cct ON tc.topic_id = cct.id 
				 WHERE tc.student_user_id = ? AND cct.course_id = ?) * 100.0 / 
				NULLIF((SELECT COUNT(*) FROM course_curriculum_topics WHERE course_id = ?), 0),
				0
			) as progress
	`
	var progress float64
	err := r.DB.QueryRowContext(ctx, query, studentID, courseID, courseID).Scan(&progress)
	return progress, err
}

// Certificate Management
func (r *StudentRepository) IssueCertificate(ctx context.Context, cert *domain.Certificate) error {
	if cert.ID == "" {
		cert.ID = uuid.New().String()
	}
	query := `INSERT INTO course_certificates (id, student_user_id, course_id, certificate_url) VALUES (?, ?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, cert.ID, cert.StudentUserID, cert.CourseID, cert.CertificateURL)
	return err
}

func (r *StudentRepository) GetCertificate(ctx context.Context, studentID, courseID string) (*domain.Certificate, error) {
	query := `SELECT id, student_user_id, course_id, issued_at, certificate_url FROM course_certificates WHERE student_user_id = ? AND course_id = ?`
	var c domain.Certificate
	err := r.DB.QueryRowContext(ctx, query, studentID, courseID).Scan(&c.ID, &c.StudentUserID, &c.CourseID, &c.IssuedAt, &c.CertificateURL)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}
