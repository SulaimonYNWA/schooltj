package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type PaymentRepository struct {
	DB *sql.DB
}

func NewPaymentRepository(db *sql.DB) *PaymentRepository {
	return &PaymentRepository{DB: db}
}

// RecordPayment inserts a new payment record.
func (r *PaymentRepository) RecordPayment(ctx context.Context, p *domain.Payment) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	query := `
		INSERT INTO payments (id, student_user_id, course_id, amount, method, note, receipt_url, recorded_by, paid_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.DB.ExecContext(ctx, query, p.ID, p.StudentUserID, p.CourseID, p.Amount, p.Method, p.Note, p.ReceiptURL, p.RecordedBy, p.PaidAt)
	return err
}

const paymentBaseSelect = `
	SELECT p.id, p.student_user_id, COALESCE(u.name, u.email) as student_name, u.avatar_url as student_avatar,
	       p.course_id, c.title as course_title,
	       p.amount, p.method, COALESCE(p.note,''), COALESCE(p.receipt_url,''),
	       p.recorded_by, COALESCE(rb.name, rb.email) as recorded_by_name,
	       p.paid_at, p.created_at
	FROM payments p
	JOIN users u ON p.student_user_id = u.id
	JOIN courses c ON p.course_id = c.id
	JOIN users rb ON p.recorded_by = rb.id
`

// ListByCourse returns all payments for a course.
func (r *PaymentRepository) ListByCourse(ctx context.Context, courseID string) ([]domain.Payment, error) {
	query := paymentBaseSelect + ` WHERE p.course_id = ? ORDER BY p.paid_at DESC`
	return r.scan(ctx, query, courseID)
}

// ListByStudent returns all payments for a student.
func (r *PaymentRepository) ListByStudent(ctx context.Context, studentUserID string) ([]domain.Payment, error) {
	query := paymentBaseSelect + ` WHERE p.student_user_id = ? ORDER BY p.paid_at DESC`
	return r.scan(ctx, query, studentUserID)
}

// ListByTeacher returns payments from courses where the given user is the teacher.
func (r *PaymentRepository) ListByTeacher(ctx context.Context, teacherID string) ([]domain.Payment, error) {
	query := paymentBaseSelect + ` WHERE c.teacher_id = ? ORDER BY p.paid_at DESC`
	return r.scan(ctx, query, teacherID)
}

// ListBySchoolAdmin returns payments from courses belonging to the admin's school.
func (r *PaymentRepository) ListBySchoolAdmin(ctx context.Context, adminID string) ([]domain.Payment, error) {
	query := paymentBaseSelect + `
		WHERE c.school_id = (SELECT id FROM schools WHERE admin_user_id = ? LIMIT 1)
		ORDER BY p.paid_at DESC
	`
	return r.scan(ctx, query, adminID)
}

// ListAll returns all payments (for admin).
func (r *PaymentRepository) ListAll(ctx context.Context) ([]domain.Payment, error) {
	query := paymentBaseSelect + ` ORDER BY p.paid_at DESC LIMIT 200`
	return r.scan(ctx, query)
}

// GetTotalPaidForEnrollment returns the total amount paid by a student for a course.
func (r *PaymentRepository) GetTotalPaidForEnrollment(ctx context.Context, studentUserID, courseID string) (float64, error) {
	query := `SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_user_id = ? AND course_id = ?`
	var total float64
	err := r.DB.QueryRowContext(ctx, query, studentUserID, courseID).Scan(&total)
	return total, err
}

func (r *PaymentRepository) scan(ctx context.Context, query string, args ...interface{}) ([]domain.Payment, error) {
	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []domain.Payment
	for rows.Next() {
		var p domain.Payment
		var avatarURL sql.NullString
		if err := rows.Scan(&p.ID, &p.StudentUserID, &p.StudentName, &avatarURL, &p.CourseID, &p.CourseTitle,
			&p.Amount, &p.Method, &p.Note, &p.ReceiptURL, &p.RecordedBy, &p.RecordedByName, &p.PaidAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		if avatarURL.Valid {
			p.StudentAvatar = &avatarURL.String
		}
		payments = append(payments, p)
	}
	return payments, nil
}
