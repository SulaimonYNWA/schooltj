package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type AssignmentRepository struct {
	DB *sql.DB
}

func NewAssignmentRepository(db *sql.DB) *AssignmentRepository {
	return &AssignmentRepository{DB: db}
}

func (r *AssignmentRepository) Create(ctx context.Context, a *domain.Assignment) error {
	a.ID = uuid.New().String()
	query := `INSERT INTO assignments (id, course_id, title, description, due_date, max_score, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, a.ID, a.CourseID, a.Title, a.Description, a.DueDate, a.MaxScore, a.CreatedBy)
	return err
}

func (r *AssignmentRepository) ListByCourse(ctx context.Context, courseID string) ([]domain.Assignment, error) {
	query := `SELECT a.id, a.course_id, COALESCE(c.title, '') as course_title, a.title, COALESCE(a.description, ''), a.due_date, a.max_score, a.created_by, a.created_at, a.updated_at
		FROM assignments a
		JOIN courses c ON a.course_id = c.id
		WHERE a.course_id = ?
		ORDER BY a.created_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var assignments []domain.Assignment
	for rows.Next() {
		var a domain.Assignment
		if err := rows.Scan(&a.ID, &a.CourseID, &a.CourseTitle, &a.Title, &a.Description, &a.DueDate, &a.MaxScore, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	return assignments, nil
}

func (r *AssignmentRepository) ListForStudent(ctx context.Context, studentID string) ([]domain.Assignment, error) {
	query := `SELECT a.id, a.course_id, COALESCE(c.title, '') as course_title, a.title, COALESCE(a.description, ''), a.due_date, a.max_score, a.created_by, a.created_at, a.updated_at
		FROM assignments a
		JOIN courses c ON a.course_id = c.id
		JOIN enrollments e ON e.course_id = a.course_id AND e.student_user_id = ? AND e.status = 'active'
		ORDER BY a.due_date ASC, a.created_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var assignments []domain.Assignment
	for rows.Next() {
		var a domain.Assignment
		if err := rows.Scan(&a.ID, &a.CourseID, &a.CourseTitle, &a.Title, &a.Description, &a.DueDate, &a.MaxScore, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	return assignments, nil
}

func (r *AssignmentRepository) GetByID(ctx context.Context, id string) (*domain.Assignment, error) {
	query := `SELECT a.id, a.course_id, COALESCE(c.title, ''), a.title, COALESCE(a.description, ''), a.due_date, a.max_score, a.created_by, a.created_at, a.updated_at
		FROM assignments a
		JOIN courses c ON a.course_id = c.id
		WHERE a.id = ?`
	var a domain.Assignment
	err := r.DB.QueryRowContext(ctx, query, id).Scan(&a.ID, &a.CourseID, &a.CourseTitle, &a.Title, &a.Description, &a.DueDate, &a.MaxScore, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AssignmentRepository) CreateSubmission(ctx context.Context, s *domain.Submission) error {
	s.ID = uuid.New().String()
	query := `INSERT INTO submissions (id, assignment_id, student_user_id, content, link) VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE content = VALUES(content), link = VALUES(link), submitted_at = NOW()`
	_, err := r.DB.ExecContext(ctx, query, s.ID, s.AssignmentID, s.StudentUserID, s.Content, s.Link)
	return err
}

func (r *AssignmentRepository) GradeSubmission(ctx context.Context, submissionID string, score float64, feedback string) error {
	query := `UPDATE submissions SET score = ?, feedback = ?, graded_at = NOW() WHERE id = ?`
	_, err := r.DB.ExecContext(ctx, query, score, feedback, submissionID)
	return err
}

func (r *AssignmentRepository) ListSubmissions(ctx context.Context, assignmentID string) ([]domain.Submission, error) {
	query := `SELECT s.id, s.assignment_id, s.student_user_id, COALESCE(u.name, u.email) as student_name, COALESCE(s.content, ''), COALESCE(s.link, ''), s.score, COALESCE(s.feedback, ''), s.submitted_at, s.graded_at
		FROM submissions s
		JOIN users u ON s.student_user_id = u.id
		WHERE s.assignment_id = ?
		ORDER BY s.submitted_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, assignmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var submissions []domain.Submission
	for rows.Next() {
		var s domain.Submission
		if err := rows.Scan(&s.ID, &s.AssignmentID, &s.StudentUserID, &s.StudentName, &s.Content, &s.Link, &s.Score, &s.Feedback, &s.SubmittedAt, &s.GradedAt); err != nil {
			return nil, err
		}
		submissions = append(submissions, s)
	}
	return submissions, nil
}

func (r *AssignmentRepository) MySubmissions(ctx context.Context, studentID string) ([]domain.Submission, error) {
	query := `SELECT s.id, s.assignment_id, s.student_user_id, '' as student_name, COALESCE(s.content, ''), COALESCE(s.link, ''), s.score, COALESCE(s.feedback, ''), s.submitted_at, s.graded_at
		FROM submissions s
		WHERE s.student_user_id = ?
		ORDER BY s.submitted_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var submissions []domain.Submission
	for rows.Next() {
		var s domain.Submission
		if err := rows.Scan(&s.ID, &s.AssignmentID, &s.StudentUserID, &s.StudentName, &s.Content, &s.Link, &s.Score, &s.Feedback, &s.SubmittedAt, &s.GradedAt); err != nil {
			return nil, err
		}
		submissions = append(submissions, s)
	}
	return submissions, nil
}
