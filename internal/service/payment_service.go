package service

import (
	"context"
	"errors"
	"time"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type PaymentService struct {
	repo *repository.PaymentRepository
}

func NewPaymentService(repo *repository.PaymentRepository) *PaymentService {
	return &PaymentService{repo: repo}
}

type RecordPaymentInput struct {
	StudentUserID string  `json:"student_user_id"`
	CourseID      string  `json:"course_id"`
	Amount        float64 `json:"amount"`
	Method        string  `json:"method"`
	Note          string  `json:"note"`
	PaidAt        string  `json:"paid_at"` // ISO format
}

// RecordPayment allows a teacher/admin to record a payment.
func (s *PaymentService) RecordPayment(ctx context.Context, recordedBy string, role domain.Role, input RecordPaymentInput) (*domain.Payment, error) {
	if role != domain.RoleTeacher && role != domain.RoleSchoolAdmin {
		return nil, errors.New("only teachers and admins can record payments")
	}
	if input.Amount <= 0 {
		return nil, errors.New("amount must be positive")
	}

	paidAt, err := time.Parse("2006-01-02", input.PaidAt)
	if err != nil {
		paidAt = time.Now()
	}

	p := &domain.Payment{
		StudentUserID: input.StudentUserID,
		CourseID:      input.CourseID,
		Amount:        input.Amount,
		Method:        input.Method,
		Note:          input.Note,
		RecordedBy:    recordedBy,
		PaidAt:        paidAt,
	}

	if err := s.repo.RecordPayment(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

// ListPayments returns payments filtered by course or all (admin).
func (s *PaymentService) ListPayments(ctx context.Context, role domain.Role, courseID string) ([]domain.Payment, error) {
	if courseID != "" {
		return s.repo.ListByCourse(ctx, courseID)
	}
	return s.repo.ListAll(ctx)
}

// MyPayments returns a student's own payments.
func (s *PaymentService) MyPayments(ctx context.Context, studentUserID string) ([]domain.Payment, error) {
	return s.repo.ListByStudent(ctx, studentUserID)
}
