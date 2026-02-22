package service

import (
	"context"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type GradeService struct {
	repo *repository.GradeRepository
}

func NewGradeService(repo *repository.GradeRepository) *GradeService {
	return &GradeService{repo: repo}
}

func (s *GradeService) CreateGrade(ctx context.Context, g *domain.Grade) error {
	return s.repo.Create(ctx, g)
}

func (s *GradeService) ListByCourse(ctx context.Context, courseID string) ([]domain.Grade, error) {
	return s.repo.ListByCourse(ctx, courseID)
}

func (s *GradeService) ListByStudent(ctx context.Context, studentID string) ([]domain.Grade, error) {
	return s.repo.ListByStudent(ctx, studentID)
}
