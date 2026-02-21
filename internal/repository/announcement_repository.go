package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type AnnouncementRepository struct {
	DB *sql.DB
}

func NewAnnouncementRepository(db *sql.DB) *AnnouncementRepository {
	return &AnnouncementRepository{DB: db}
}

// Create inserts a new announcement.
func (r *AnnouncementRepository) Create(ctx context.Context, a *domain.Announcement) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	query := `
		INSERT INTO announcements (id, course_id, author_id, title, content, is_pinned)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.DB.ExecContext(ctx, query, a.ID, a.CourseID, a.AuthorID, a.Title, a.Content, a.IsPinned)
	return err
}

// ListByCourse returns announcements for a specific course.
func (r *AnnouncementRepository) ListByCourse(ctx context.Context, courseID string) ([]domain.Announcement, error) {
	query := `
		SELECT a.id, a.course_id, COALESCE(c.title, 'General') as course_title,
		       a.author_id, COALESCE(u.name, u.email) as author_name,
		       a.title, a.content, a.is_pinned, a.created_at
		FROM announcements a
		LEFT JOIN courses c ON a.course_id = c.id
		JOIN users u ON a.author_id = u.id
		WHERE a.course_id = ?
		ORDER BY a.is_pinned DESC, a.created_at DESC
	`
	return r.scan(ctx, query, courseID)
}

// ListForStudent returns announcements from all courses the student is enrolled in.
func (r *AnnouncementRepository) ListForStudent(ctx context.Context, studentUserID string) ([]domain.Announcement, error) {
	query := `
		SELECT a.id, a.course_id, COALESCE(c.title, 'General') as course_title,
		       a.author_id, COALESCE(u.name, u.email) as author_name,
		       a.title, a.content, a.is_pinned, a.created_at
		FROM announcements a
		LEFT JOIN courses c ON a.course_id = c.id
		JOIN users u ON a.author_id = u.id
		WHERE a.course_id IS NULL
		   OR a.course_id IN (
		       SELECT e.course_id FROM enrollments e
		       WHERE e.student_user_id = ? AND e.status = 'active'
		   )
		ORDER BY a.is_pinned DESC, a.created_at DESC
		LIMIT 50
	`
	return r.scan(ctx, query, studentUserID)
}

// ListAll returns all announcements (for teachers/admins).
func (r *AnnouncementRepository) ListAll(ctx context.Context) ([]domain.Announcement, error) {
	query := `
		SELECT a.id, a.course_id, COALESCE(c.title, 'General') as course_title,
		       a.author_id, COALESCE(u.name, u.email) as author_name,
		       a.title, a.content, a.is_pinned, a.created_at
		FROM announcements a
		LEFT JOIN courses c ON a.course_id = c.id
		JOIN users u ON a.author_id = u.id
		ORDER BY a.is_pinned DESC, a.created_at DESC
		LIMIT 100
	`
	return r.scan(ctx, query)
}

// Delete removes an announcement by ID (only by author).
func (r *AnnouncementRepository) Delete(ctx context.Context, id, authorID string) error {
	query := `DELETE FROM announcements WHERE id = ? AND author_id = ?`
	result, err := r.DB.ExecContext(ctx, query, id, authorID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *AnnouncementRepository) scan(ctx context.Context, query string, args ...interface{}) ([]domain.Announcement, error) {
	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var announcements []domain.Announcement
	for rows.Next() {
		var a domain.Announcement
		var courseID sql.NullString
		if err := rows.Scan(&a.ID, &courseID, &a.CourseTitle, &a.AuthorID, &a.AuthorName,
			&a.Title, &a.Content, &a.IsPinned, &a.CreatedAt); err != nil {
			return nil, err
		}
		if courseID.Valid {
			a.CourseID = &courseID.String
		}
		announcements = append(announcements, a)
	}
	return announcements, nil
}
