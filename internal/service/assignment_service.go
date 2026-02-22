package service

import (
	"context"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type AssignmentService struct {
	repo *repository.AssignmentRepository
}

func NewAssignmentService(repo *repository.AssignmentRepository) *AssignmentService {
	return &AssignmentService{repo: repo}
}

func (s *AssignmentService) Create(ctx context.Context, a *domain.Assignment) error {
	return s.repo.Create(ctx, a)
}

func (s *AssignmentService) ListByCourse(ctx context.Context, courseID string) ([]domain.Assignment, error) {
	return s.repo.ListByCourse(ctx, courseID)
}

func (s *AssignmentService) ListForStudent(ctx context.Context, studentID string) ([]domain.Assignment, error) {
	return s.repo.ListForStudent(ctx, studentID)
}

func (s *AssignmentService) GetByID(ctx context.Context, id string) (*domain.Assignment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *AssignmentService) Submit(ctx context.Context, sub *domain.Submission) error {
	return s.repo.CreateSubmission(ctx, sub)
}

func (s *AssignmentService) GradeSubmission(ctx context.Context, submissionID string, score float64, feedback string) error {
	return s.repo.GradeSubmission(ctx, submissionID, score, feedback)
}

func (s *AssignmentService) ListSubmissions(ctx context.Context, assignmentID string) ([]domain.Submission, error) {
	return s.repo.ListSubmissions(ctx, assignmentID)
}

func (s *AssignmentService) MySubmissions(ctx context.Context, studentID string) ([]domain.Submission, error) {
	return s.repo.MySubmissions(ctx, studentID)
}
