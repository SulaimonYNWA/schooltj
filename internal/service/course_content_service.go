package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type CourseContentService struct {
	contentRepo *repository.CourseContentRepository
	courseRepo  *repository.CourseRepository
}

func NewCourseContentService(contentRepo *repository.CourseContentRepository, courseRepo *repository.CourseRepository) *CourseContentService {
	return &CourseContentService{contentRepo: contentRepo, courseRepo: courseRepo}
}

const uploadsDir = "uploads/courses"

// ── Authorization helpers ──

func (s *CourseContentService) isTeacherOfCourse(ctx context.Context, userID, courseID string) error {
	course, err := s.courseRepo.GetCourseByID(ctx, courseID)
	if err != nil {
		return errors.New("course not found")
	}
	if course.TeacherID == nil || *course.TeacherID != userID {
		return errors.New("only the course teacher can perform this action")
	}
	return nil
}

func (s *CourseContentService) canReadCourseContent(ctx context.Context, userID string, role domain.Role, courseID string) error {
	// Teachers of the course can always read
	course, err := s.courseRepo.GetCourseByID(ctx, courseID)
	if err != nil {
		return errors.New("course not found")
	}
	if course.TeacherID != nil && *course.TeacherID == userID {
		return nil
	}
	// School admins of the course's school can read
	if role == domain.RoleSchoolAdmin && course.SchoolID != nil {
		return nil
	}
	// Admin can read all
	if role == domain.RoleAdmin {
		return nil
	}
	// Students must be enrolled with active status
	if role == domain.RoleStudent {
		enrollment, err := s.courseRepo.GetEnrollmentByStudentAndCourse(ctx, userID, courseID)
		if err != nil || enrollment == nil || enrollment.Status != domain.EnrollmentStatusActive {
			return errors.New("you must be enrolled in this course to view its content")
		}
		return nil
	}
	return errors.New("access denied")
}

// ── Curriculum Topics ──

func (s *CourseContentService) AddTopic(ctx context.Context, userID string, topic *domain.CurriculumTopic) error {
	if err := s.isTeacherOfCourse(ctx, userID, topic.CourseID); err != nil {
		return err
	}
	return s.contentRepo.CreateTopic(ctx, topic)
}

func (s *CourseContentService) ListTopics(ctx context.Context, userID string, role domain.Role, courseID string) ([]domain.CurriculumTopic, error) {
	if err := s.canReadCourseContent(ctx, userID, role, courseID); err != nil {
		return nil, err
	}
	topics, err := s.contentRepo.ListTopics(ctx, courseID)
	if err != nil {
		return nil, err
	}
	if topics == nil {
		topics = []domain.CurriculumTopic{}
	}
	return topics, nil
}

func (s *CourseContentService) UpdateTopic(ctx context.Context, userID string, topic *domain.CurriculumTopic) error {
	// Look up course ID from the topic
	courseID, err := s.contentRepo.GetTopicCourseID(ctx, topic.ID)
	if err != nil {
		return errors.New("topic not found")
	}
	if err := s.isTeacherOfCourse(ctx, userID, courseID); err != nil {
		return err
	}
	topic.CourseID = courseID
	return s.contentRepo.UpdateTopic(ctx, topic)
}

func (s *CourseContentService) DeleteTopic(ctx context.Context, userID, topicID string) error {
	courseID, err := s.contentRepo.GetTopicCourseID(ctx, topicID)
	if err != nil {
		return errors.New("topic not found")
	}
	if err := s.isTeacherOfCourse(ctx, userID, courseID); err != nil {
		return err
	}
	return s.contentRepo.DeleteTopic(ctx, topicID)
}

// ── Course Materials ──

func (s *CourseContentService) UploadMaterial(ctx context.Context, userID, courseID string, header *multipart.FileHeader, file multipart.File) (*domain.CourseMaterial, error) {
	if err := s.isTeacherOfCourse(ctx, userID, courseID); err != nil {
		return nil, err
	}

	// Validate file type
	ct := header.Header.Get("Content-Type")
	if !isAllowedContentType(ct) {
		return nil, errors.New("only PDF and image files are allowed")
	}

	// Ensure upload dir exists
	dir := filepath.Join(uploadsDir, courseID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Save file with UUID name
	ext := filepath.Ext(header.Filename)
	storedName := uuid.New().String() + ext
	destPath := filepath.Join(dir, storedName)

	dst, err := os.Create(destPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(destPath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	material := &domain.CourseMaterial{
		CourseID:    courseID,
		FileName:    header.Filename,
		FilePath:    destPath,
		FileSize:    header.Size,
		ContentType: ct,
		UploadedBy:  userID,
	}

	if err := s.contentRepo.CreateMaterial(ctx, material); err != nil {
		os.Remove(destPath)
		return nil, err
	}

	return material, nil
}

func (s *CourseContentService) ListMaterials(ctx context.Context, userID string, role domain.Role, courseID string) ([]domain.CourseMaterial, error) {
	if err := s.canReadCourseContent(ctx, userID, role, courseID); err != nil {
		return nil, err
	}
	materials, err := s.contentRepo.ListMaterials(ctx, courseID)
	if err != nil {
		return nil, err
	}
	if materials == nil {
		materials = []domain.CourseMaterial{}
	}
	return materials, nil
}

func (s *CourseContentService) GetMaterial(ctx context.Context, userID string, role domain.Role, materialID string) (*domain.CourseMaterial, error) {
	m, err := s.contentRepo.GetMaterial(ctx, materialID)
	if err != nil {
		return nil, errors.New("material not found")
	}
	if err := s.canReadCourseContent(ctx, userID, role, m.CourseID); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *CourseContentService) DeleteMaterial(ctx context.Context, userID, materialID string) error {
	m, err := s.contentRepo.GetMaterial(ctx, materialID)
	if err != nil {
		return errors.New("material not found")
	}
	if err := s.isTeacherOfCourse(ctx, userID, m.CourseID); err != nil {
		return err
	}

	// Remove file from disk
	os.Remove(m.FilePath)

	return s.contentRepo.DeleteMaterial(ctx, materialID)
}

func isAllowedContentType(ct string) bool {
	ct = strings.ToLower(ct)
	allowed := []string{
		"application/pdf",
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",
	}
	for _, a := range allowed {
		if ct == a {
			return true
		}
	}
	return false
}
