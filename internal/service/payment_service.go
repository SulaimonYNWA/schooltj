package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type PaymentService struct {
	repo      *repository.PaymentRepository
	providers map[string]PaymentProvider
}

func NewPaymentService(repo *repository.PaymentRepository, providers []PaymentProvider) *PaymentService {
	pMap := make(map[string]PaymentProvider)
	for _, p := range providers {
		pMap[p.Name()] = p
	}
	return &PaymentService{repo: repo, providers: pMap}
}

func (s *PaymentService) InitiateExternalPayment(ctx context.Context, studentUserID, courseID, providerName string, amount float64) (string, error) {
	provider, ok := s.providers[providerName]
	if !ok {
		return "", fmt.Errorf("provider %s not found", providerName)
	}

	p := &domain.Payment{
		StudentUserID: studentUserID,
		CourseID:      courseID,
		Amount:        amount,
		Method:        providerName,
		Status:        domain.PaymentStatusPending,
		PaidAt:        time.Now(),
	}

	if err := s.repo.RecordPayment(ctx, p); err != nil {
		return "", err
	}

	redirectURL, externalID, err := provider.InitiatePayment(ctx, p)
	if err != nil {
		return "", err
	}

	// Update with provider's internal ID
	if err := s.repo.UpdateStatus(ctx, p.ID, domain.PaymentStatusPending, externalID); err != nil {
		return "", err
	}

	return redirectURL, nil
}

func (s *PaymentService) ProcessWebhook(ctx context.Context, providerName string, payload interface{}) error {
	provider, ok := s.providers[providerName]
	if !ok {
		return fmt.Errorf("provider %s not found", providerName)
	}

	externalID, status, err := provider.HandleCallback(ctx, payload)
	if err != nil {
		return err
	}

	return s.repo.UpdateStatusByExternalID(ctx, externalID, status)
}

type RecordPaymentInput struct {
	StudentUserID string  `json:"student_user_id"`
	CourseID      string  `json:"course_id"`
	Amount        float64 `json:"amount"`
	Method        string  `json:"method"`
	Note          string  `json:"note"`
	ReceiptURL    string  `json:"receipt_url"`
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
		ReceiptURL:    input.ReceiptURL,
		RecordedBy:    recordedBy,
		PaidAt:        paidAt,
	}

	if err := s.repo.RecordPayment(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

// ListPayments returns payments scoped to the user's role.
func (s *PaymentService) ListPayments(ctx context.Context, userID string, role domain.Role, courseID string) ([]domain.Payment, error) {
	if courseID != "" {
		return s.repo.ListByCourse(ctx, courseID)
	}
	switch role {
	case domain.RoleTeacher:
		return s.repo.ListByTeacher(ctx, userID)
	case domain.RoleSchoolAdmin:
		return s.repo.ListBySchoolAdmin(ctx, userID)
	case domain.RoleAdmin:
		return s.repo.ListAll(ctx)
	default:
		return s.repo.ListByStudent(ctx, userID)
	}
}

// MyPayments returns a student's own payments.
func (s *PaymentService) MyPayments(ctx context.Context, studentUserID string) ([]domain.Payment, error) {
	return s.repo.ListByStudent(ctx, studentUserID)
}
