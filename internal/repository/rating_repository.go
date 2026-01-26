package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type RatingRepository struct {
	DB *sql.DB
}

func NewRatingRepository(db *sql.DB) *RatingRepository {
	return &RatingRepository{DB: db}
}

func (r *RatingRepository) CreateRating(ctx context.Context, rating *domain.Rating) error {
	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rating.ID = uuid.New().String()
	query := `INSERT INTO ratings (id, from_user_id, to_user_id, to_school_id, score, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`
	_, err = tx.ExecContext(ctx, query, rating.ID, rating.FromUserID, rating.ToUserID, rating.ToSchoolID, rating.Score, rating.Comment)
	if err != nil {
		return err
	}

	// Update aggregates
	if rating.ToUserID != nil {
		updateQuery := `
			UPDATE users 
			SET rating_avg = (SELECT AVG(score) FROM ratings WHERE to_user_id = ?),
			    rating_count = (SELECT COUNT(*) FROM ratings WHERE to_user_id = ?)
			WHERE id = ?`
		_, err = tx.ExecContext(ctx, updateQuery, *rating.ToUserID, *rating.ToUserID, *rating.ToUserID)
	} else if rating.ToSchoolID != nil {
		updateQuery := `
			UPDATE schools 
			SET rating_avg = (SELECT AVG(score) FROM ratings WHERE to_school_id = ?),
			    rating_count = (SELECT COUNT(*) FROM ratings WHERE to_school_id = ?)
			WHERE id = ?`
		_, err = tx.ExecContext(ctx, updateQuery, *rating.ToSchoolID, *rating.ToSchoolID, *rating.ToSchoolID)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *RatingRepository) CheckCollaboration(ctx context.Context, fromUserID string, toUserID *string, toSchoolID *string) (bool, error) {
	if toUserID != nil {
		// Users collaborate if they share a course (one is teacher, one is student, OR both are students in same course)
		query := `
			SELECT EXISTS (
				-- Peer collaboration: both in same course
				SELECT 1 FROM enrollments e1
				JOIN enrollments e2 ON e1.course_id = e2.course_id
				WHERE e1.student_user_id = ? AND e2.student_user_id = ?
				UNION
				-- Student rates teacher
				SELECT 1 FROM enrollments e
				JOIN courses c ON e.course_id = c.id
				WHERE e.student_user_id = ? AND c.teacher_id = ?
				UNION
				-- Teacher rates student
				SELECT 1 FROM enrollments e
				JOIN courses c ON e.course_id = c.id
				WHERE c.teacher_id = ? AND e.student_user_id = ?
			)
		`
		var exists bool
		err := r.DB.QueryRowContext(ctx, query, fromUserID, *toUserID, fromUserID, *toUserID, fromUserID, *toUserID).Scan(&exists)
		return exists, err
	}

	if toSchoolID != nil {
		// User collaborates with school if they are enrolled in a course belonging to the school
		// or if they are a teacher at that school.
		query := `
			SELECT EXISTS (
				-- Student in school course
				SELECT 1 FROM enrollments e
				JOIN courses c ON e.course_id = c.id
				WHERE e.student_user_id = ? AND c.school_id = ?
				UNION
				-- Teacher in school
				SELECT 1 FROM teacher_profiles
				WHERE user_id = ? AND school_id = ?
			)
		`
		var exists bool
		err := r.DB.QueryRowContext(ctx, query, fromUserID, *toSchoolID, fromUserID, *toSchoolID).Scan(&exists)
		return exists, err
	}

	return false, errors.New("invalid target for collaboration check")
}
