package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type AttendanceRepository struct {
	DB *sql.DB
}

func NewAttendanceRepository(db *sql.DB) *AttendanceRepository {
	return &AttendanceRepository{DB: db}
}

// MarkAttendance upserts an attendance record for a student on a given date.
func (r *AttendanceRepository) MarkAttendance(ctx context.Context, a *domain.Attendance) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	query := `
		INSERT INTO attendance (id, enrollment_id, course_id, student_user_id, date, status, note, marked_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), marked_by = VALUES(marked_by)
	`
	_, err := r.DB.ExecContext(ctx, query, a.ID, a.EnrollmentID, a.CourseID, a.StudentUserID, a.Date, a.Status, a.Note, a.MarkedBy)
	return err
}

// GetByCourseAndDate returns attendance for all enrolled students on a specific date.
func (r *AttendanceRepository) GetByCourseAndDate(ctx context.Context, courseID, date string) ([]domain.Attendance, error) {
	query := `
		SELECT a.id, a.enrollment_id, a.course_id, a.student_user_id, a.date, a.status, COALESCE(a.note,''), a.marked_by, a.created_at,
		       COALESCE(u.name, u.email) as student_name
		FROM attendance a
		JOIN users u ON a.student_user_id = u.id
		WHERE a.course_id = ? AND a.date = ?
		ORDER BY u.name
	`
	rows, err := r.DB.QueryContext(ctx, query, courseID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []domain.Attendance
	for rows.Next() {
		var a domain.Attendance
		if err := rows.Scan(&a.ID, &a.EnrollmentID, &a.CourseID, &a.StudentUserID, &a.Date, &a.Status, &a.Note, &a.MarkedBy, &a.CreatedAt, &a.StudentName); err != nil {
			return nil, err
		}
		records = append(records, a)
	}
	return records, nil
}

// GetByStudent returns all attendance records for a student, optionally filtered by course.
func (r *AttendanceRepository) GetByStudent(ctx context.Context, studentUserID, courseID string) ([]domain.Attendance, error) {
	query := `
		SELECT a.id, a.enrollment_id, a.course_id, a.student_user_id, a.date, a.status, COALESCE(a.note,''), a.marked_by, a.created_at, '' as student_name
		FROM attendance a
		WHERE a.student_user_id = ?
	`
	args := []interface{}{studentUserID}
	if courseID != "" {
		query += " AND a.course_id = ?"
		args = append(args, courseID)
	}
	query += " ORDER BY a.date DESC"

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []domain.Attendance
	for rows.Next() {
		var a domain.Attendance
		if err := rows.Scan(&a.ID, &a.EnrollmentID, &a.CourseID, &a.StudentUserID, &a.Date, &a.Status, &a.Note, &a.MarkedBy, &a.CreatedAt, &a.StudentName); err != nil {
			return nil, err
		}
		records = append(records, a)
	}
	return records, nil
}

// GetStudentAttendanceSummary returns aggregate attendance stats per course for a student.
func (r *AttendanceRepository) GetStudentAttendanceSummary(ctx context.Context, studentUserID string) ([]domain.AttendanceSummary, error) {
	query := `
		SELECT a.course_id, c.title,
		       COUNT(*) as total,
		       SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
		       SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
		       SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late,
		       SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused
		FROM attendance a
		JOIN courses c ON a.course_id = c.id
		WHERE a.student_user_id = ?
		GROUP BY a.course_id, c.title
	`
	rows, err := r.DB.QueryContext(ctx, query, studentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []domain.AttendanceSummary
	for rows.Next() {
		var s domain.AttendanceSummary
		if err := rows.Scan(&s.CourseID, &s.CourseTitle, &s.TotalSessions, &s.Present, &s.Absent, &s.Late, &s.Excused); err != nil {
			return nil, err
		}
		if s.TotalSessions > 0 {
			s.Percentage = float64(s.Present+s.Late) / float64(s.TotalSessions) * 100
		}
		summaries = append(summaries, s)
	}
	return summaries, nil
}

// GetCourseAttendanceSummary returns aggregate attendance stats per student for a course.
func (r *AttendanceRepository) GetCourseAttendanceSummary(ctx context.Context, courseID string) ([]domain.AttendanceSummary, error) {
	query := `
		SELECT a.course_id, '',
		       COUNT(*) as total,
		       SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
		       SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
		       SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late,
		       SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused
		FROM attendance a
		WHERE a.course_id = ?
		GROUP BY a.course_id
	`
	rows, err := r.DB.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []domain.AttendanceSummary
	for rows.Next() {
		var s domain.AttendanceSummary
		if err := rows.Scan(&s.CourseID, &s.CourseTitle, &s.TotalSessions, &s.Present, &s.Absent, &s.Late, &s.Excused); err != nil {
			return nil, err
		}
		if s.TotalSessions > 0 {
			s.Percentage = float64(s.Present+s.Late) / float64(s.TotalSessions) * 100
		}
		summaries = append(summaries, s)
	}
	return summaries, nil
}

// GetEnrolledStudentsForCourse returns student info for all active enrollments in a course.
func (r *AttendanceRepository) GetEnrolledStudentsForCourse(ctx context.Context, courseID string) ([]struct {
	EnrollmentID  string
	StudentUserID string
	StudentName   string
}, error) {
	query := `
		SELECT e.id, e.student_user_id, COALESCE(u.name, u.email) as student_name
		FROM enrollments e
		JOIN users u ON e.student_user_id = u.id
		WHERE e.course_id = ? AND e.status = 'active'
		ORDER BY u.name
	`
	rows, err := r.DB.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []struct {
		EnrollmentID  string
		StudentUserID string
		StudentName   string
	}
	for rows.Next() {
		var s struct {
			EnrollmentID  string
			StudentUserID string
			StudentName   string
		}
		if err := rows.Scan(&s.EnrollmentID, &s.StudentUserID, &s.StudentName); err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}
