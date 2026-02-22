package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type CourseContentRepository struct {
	DB *sql.DB
}

func NewCourseContentRepository(db *sql.DB) *CourseContentRepository {
	return &CourseContentRepository{DB: db}
}

// ── Curriculum Topics ──

func (r *CourseContentRepository) CreateTopic(ctx context.Context, topic *domain.CurriculumTopic) error {
	if topic.ID == "" {
		topic.ID = uuid.New().String()
	}
	_, err := r.DB.ExecContext(ctx,
		`INSERT INTO course_curriculum_topics (id, course_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)`,
		topic.ID, topic.CourseID, topic.Title, topic.Description, topic.SortOrder,
	)
	return err
}

func (r *CourseContentRepository) ListTopics(ctx context.Context, courseID string) ([]domain.CurriculumTopic, error) {
	rows, err := r.DB.QueryContext(ctx,
		`SELECT id, course_id, title, description, sort_order, created_at FROM course_curriculum_topics WHERE course_id = ? ORDER BY sort_order ASC, created_at ASC`,
		courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []domain.CurriculumTopic
	for rows.Next() {
		var t domain.CurriculumTopic
		if err := rows.Scan(&t.ID, &t.CourseID, &t.Title, &t.Description, &t.SortOrder, &t.CreatedAt); err != nil {
			return nil, err
		}
		topics = append(topics, t)
	}
	return topics, rows.Err()
}

func (r *CourseContentRepository) UpdateTopic(ctx context.Context, topic *domain.CurriculumTopic) error {
	_, err := r.DB.ExecContext(ctx,
		`UPDATE course_curriculum_topics SET title = ?, description = ?, sort_order = ? WHERE id = ?`,
		topic.Title, topic.Description, topic.SortOrder, topic.ID,
	)
	return err
}

func (r *CourseContentRepository) DeleteTopic(ctx context.Context, id string) error {
	_, err := r.DB.ExecContext(ctx, `DELETE FROM course_curriculum_topics WHERE id = ?`, id)
	return err
}

func (r *CourseContentRepository) GetTopicCourseID(ctx context.Context, topicID string) (string, error) {
	var courseID string
	err := r.DB.QueryRowContext(ctx, `SELECT course_id FROM course_curriculum_topics WHERE id = ?`, topicID).Scan(&courseID)
	return courseID, err
}

// ── Course Materials ──

func (r *CourseContentRepository) CreateMaterial(ctx context.Context, m *domain.CourseMaterial) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	_, err := r.DB.ExecContext(ctx,
		`INSERT INTO course_materials (id, course_id, file_name, file_path, file_size, content_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		m.ID, m.CourseID, m.FileName, m.FilePath, m.FileSize, m.ContentType, m.UploadedBy,
	)
	return err
}

func (r *CourseContentRepository) ListMaterials(ctx context.Context, courseID string) ([]domain.CourseMaterial, error) {
	rows, err := r.DB.QueryContext(ctx,
		`SELECT id, course_id, file_name, file_path, file_size, content_type, uploaded_by, created_at FROM course_materials WHERE course_id = ? ORDER BY created_at DESC`,
		courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var materials []domain.CourseMaterial
	for rows.Next() {
		var m domain.CourseMaterial
		if err := rows.Scan(&m.ID, &m.CourseID, &m.FileName, &m.FilePath, &m.FileSize, &m.ContentType, &m.UploadedBy, &m.CreatedAt); err != nil {
			return nil, err
		}
		materials = append(materials, m)
	}
	return materials, rows.Err()
}

func (r *CourseContentRepository) GetMaterial(ctx context.Context, id string) (*domain.CourseMaterial, error) {
	var m domain.CourseMaterial
	err := r.DB.QueryRowContext(ctx,
		`SELECT id, course_id, file_name, file_path, file_size, content_type, uploaded_by, created_at FROM course_materials WHERE id = ?`,
		id,
	).Scan(&m.ID, &m.CourseID, &m.FileName, &m.FilePath, &m.FileSize, &m.ContentType, &m.UploadedBy, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *CourseContentRepository) DeleteMaterial(ctx context.Context, id string) error {
	_, err := r.DB.ExecContext(ctx, `DELETE FROM course_materials WHERE id = ?`, id)
	return err
}
