package service

import (
	"context"
	"errors"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type CourseService struct {
	courseRepo *repository.CourseRepository
	schoolRepo *repository.SchoolRepository
	userRepo   *repository.UserRepository
}

func NewCourseService(courseRepo *repository.CourseRepository, schoolRepo *repository.SchoolRepository, userRepo *repository.UserRepository) *CourseService {
	return &CourseService{
		courseRepo: courseRepo,
		schoolRepo: schoolRepo,
		userRepo:   userRepo,
	}
}

func (s *CourseService) CreateCourse(ctx context.Context, creatorID string, role domain.Role, title, description string, price float64, teacherID *string) (*domain.Course, error) {
	course := &domain.Course{
		Title:       title,
		Description: description,
		Price:       price,
	}

	if role == domain.RoleTeacher {
		// Independent teacher creating course
		course.TeacherID = &creatorID
		// SchoolID stays nil
	} else if role == domain.RoleSchoolAdmin {
		// School Admin creating course
		// 1. Get School ID
		school, err := s.schoolRepo.GetSchoolByAdminID(ctx, creatorID)
		if err != nil {
			return nil, errors.New("school not found for admin")
		}
		course.SchoolID = &school.ID

		// 2. Validate Teacher belongs to school (Optional strict check, skipping for MVP speed)
		if teacherID == nil {
			return nil, errors.New("teacher_id is required for school courses")
		}
		course.TeacherID = teacherID
	} else {
		return nil, errors.New("unauthorized to create course")
	}

	if err := s.courseRepo.CreateCourse(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}

func (s *CourseService) ListCourses(ctx context.Context, userID string, role domain.Role) ([]repository.CourseWithDetails, error) {
	return s.courseRepo.ListCourses(ctx, role, userID)
}
