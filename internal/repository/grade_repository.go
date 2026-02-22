package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type GradeRepository struct {
	DB *sql.DB
}

func NewGradeRepository(db *sql.DB) *GradeRepository {
	return &GradeRepository{DB: db}
}

func (r *GradeRepository) Create(ctx context.Context, g *domain.Grade) error {
	g.ID = uuid.New().String()
	query := `INSERT INTO grades (id, student_user_id, course_id, title, score, letter_grade, comment, graded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, g.ID, g.StudentUserID, g.CourseID, g.Title, g.Score, g.LetterGrade, g.Comment, g.GradedBy)
	return err
}

func (r *GradeRepository) ListByCourse(ctx context.Context, courseID string) ([]domain.Grade, error) {
	query := `SELECT g.id, g.student_user_id, COALESCE(u.name, u.email) as student_name, g.course_id, COALESCE(c.title, '') as course_title, g.title, g.score, g.letter_grade, COALESCE(g.comment, ''), g.graded_by, g.graded_at, g.created_at
		FROM grades g
		JOIN users u ON g.student_user_id = u.id
		JOIN courses c ON g.course_id = c.id
		WHERE g.course_id = ?
		ORDER BY g.graded_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var grades []domain.Grade
	for rows.Next() {
		var g domain.Grade
		if err := rows.Scan(&g.ID, &g.StudentUserID, &g.StudentName, &g.CourseID, &g.CourseTitle, &g.Title, &g.Score, &g.LetterGrade, &g.Comment, &g.GradedBy, &g.GradedAt, &g.CreatedAt); err != nil {
			return nil, err
		}
		grades = append(grades, g)
	}
	return grades, nil
}

func (r *GradeRepository) ListByStudent(ctx context.Context, studentID string) ([]domain.Grade, error) {
	query := `SELECT g.id, g.student_user_id, '' as student_name, g.course_id, COALESCE(c.title, '') as course_title, g.title, g.score, g.letter_grade, COALESCE(g.comment, ''), g.graded_by, g.graded_at, g.created_at
		FROM grades g
		JOIN courses c ON g.course_id = c.id
		WHERE g.student_user_id = ?
		ORDER BY g.graded_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var grades []domain.Grade
	for rows.Next() {
		var g domain.Grade
		if err := rows.Scan(&g.ID, &g.StudentUserID, &g.StudentName, &g.CourseID, &g.CourseTitle, &g.Title, &g.Score, &g.LetterGrade, &g.Comment, &g.GradedBy, &g.GradedAt, &g.CreatedAt); err != nil {
			return nil, err
		}
		grades = append(grades, g)
	}
	return grades, nil
}
