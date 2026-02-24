package service

import (
	"context"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type StudentService struct {
	repo *repository.StudentRepository
}

func NewStudentService(repo *repository.StudentRepository) *StudentService {
	return &StudentService{repo: repo}
}

func (s *StudentService) GetAllStudents(ctx context.Context, limit, offset int, search string) ([]domain.User, error) {
	return s.repo.ListStudents(ctx, limit, offset, search)
}

func (s *StudentService) GetMyStudents(ctx context.Context, userID string, role domain.Role) ([]domain.User, error) {
	switch role {
	case domain.RoleSchoolAdmin:
		return s.repo.GetStudentsBySchoolAdminID(ctx, userID)
	case domain.RoleTeacher:
		return s.repo.ListStudentsByTeacher(ctx, userID)
	default:
		// Students shouldn't call this, or if they do maybe return nothing or error
		return []domain.User{}, nil
	}
}

func (s *StudentService) GetStudentsByCourse(ctx context.Context, courseID string, limit, offset int, search string) ([]domain.User, error) {
	return s.repo.ListStudentsByCourse(ctx, courseID, limit, offset, search)
}

func (s *StudentService) GetConnectedStudents(ctx context.Context, userID string, limit, offset int, search string) ([]domain.User, error) {
	return s.repo.ListStudentsByConnection(ctx, userID, limit, offset, search)
}

func (s *StudentService) SearchSuggestions(ctx context.Context, query string) ([]domain.User, error) {
	return s.repo.SearchStudentSuggestions(ctx, query)
}
