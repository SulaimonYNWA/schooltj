package service

import (
	"context"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type TeacherService struct {
	repo *repository.TeacherRepository
}

func NewTeacherService(repo *repository.TeacherRepository) *TeacherService {
	return &TeacherService{repo: repo}
}

func (s *TeacherService) GetAllTeachers(ctx context.Context, limit, offset int, search string) ([]domain.User, error) {
	return s.repo.ListTeachers(ctx, limit, offset, search)
}
