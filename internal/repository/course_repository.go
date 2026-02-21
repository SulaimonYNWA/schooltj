package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

var ErrCourseNotFound = errors.New("course not found")
var ErrEnrollmentNotFound = errors.New("enrollment not found")

type CourseRepository struct {
	DB *sql.DB
}

func NewCourseRepository(db *sql.DB) *CourseRepository {
	return &CourseRepository{DB: db}
}

func (r *CourseRepository) CreateCourse(ctx context.Context, course *domain.Course) error {
	course.ID = uuid.New().String()

	var scheduleJSON interface{} = nil
	if course.Schedule != nil {
		if b, err := json.Marshal(course.Schedule); err == nil {
			scheduleJSON = string(b)
		}
	}

	query := `INSERT INTO courses (id, title, description, schedule, school_id, teacher_id, price, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`
	_, err := r.DB.ExecContext(ctx, query, course.ID, course.Title, course.Description, scheduleJSON, course.SchoolID, course.TeacherID, course.Price)
	return err
}

func (r *CourseRepository) GetCourseByID(ctx context.Context, id string) (*domain.Course, error) {
	query := `SELECT id, title, description, schedule, school_id, teacher_id, price, created_at, updated_at FROM courses WHERE id = ?`
	row := r.DB.QueryRowContext(ctx, query, id)

	var course domain.Course
	var schoolID sql.NullString
	var teacherID sql.NullString
	var scheduleRaw sql.NullString

	err := row.Scan(&course.ID, &course.Title, &course.Description, &scheduleRaw, &schoolID, &teacherID, &course.Price, &course.CreatedAt, &course.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCourseNotFound
		}
		return nil, err
	}

	if schoolID.Valid {
		course.SchoolID = &schoolID.String
	}
	if teacherID.Valid {
		course.TeacherID = &teacherID.String
	}

	if scheduleRaw.Valid && scheduleRaw.String != "" {
		var sched domain.Schedule
		if err := json.Unmarshal([]byte(scheduleRaw.String), &sched); err == nil {
			course.Schedule = &sched
		}
	}

	return &course, nil
}

type CourseFilter struct {
	SchoolID  *string
	TeacherID *string
}

func (r *CourseRepository) ListCourses(ctx context.Context, filter CourseFilter) ([]*domain.Course, error) {
	var conditions []string
	var args []interface{}

	if filter.SchoolID != nil {
		conditions = append(conditions, "c.school_id = ?")
		args = append(args, *filter.SchoolID)
	}
	if filter.TeacherID != nil {
		conditions = append(conditions, "c.teacher_id = ?")
		args = append(args, *filter.TeacherID)
	}

	query := `
		SELECT c.id, c.title, c.description, c.schedule, c.school_id, c.teacher_id, c.price, c.created_at, c.updated_at,
		       COALESCE(u.name, 'Unknown Teacher') as teacher_name,
			   COALESCE(u.email, '') as teacher_email,
		       COALESCE(s.name, '') as school_name
		FROM courses c
		LEFT JOIN users u ON c.teacher_id = u.id
		LEFT JOIN schools s ON c.school_id = s.id
	`
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY c.created_at DESC"

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []*domain.Course
	for rows.Next() {
		var course domain.Course
		var schoolID sql.NullString
		var teacherID sql.NullString
		var scheduleJSON []byte
		var teacherName sql.NullString
		var teacherEmail sql.NullString
		var schoolName sql.NullString

		if err := rows.Scan(&course.ID, &course.Title, &course.Description, &scheduleJSON, &schoolID, &teacherID,
			&course.Price, &course.CreatedAt, &course.UpdatedAt, &teacherName, &teacherEmail, &schoolName); err != nil {
			return nil, err
		}

		if len(scheduleJSON) > 0 {
			var sched domain.Schedule
			if err := json.Unmarshal(scheduleJSON, &sched); err == nil {
				course.Schedule = &sched
			}
		}

		if schoolID.Valid {
			course.SchoolID = &schoolID.String
			course.SchoolName = schoolName.String
		}
		if teacherID.Valid {
			course.TeacherID = &teacherID.String
			course.TeacherName = teacherName.String
			course.TeacherEmail = teacherEmail.String
		}

		courses = append(courses, &course)
	}
	return courses, nil
}

func (r *CourseRepository) CreateEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	enrollment.ID = uuid.New().String()
	// enrollment.Status should be set by caller, usually 'invited'
	if enrollment.Status == "" {
		enrollment.Status = domain.EnrollmentStatusInvited
	}

	query := `INSERT INTO enrollments (id, student_user_id, course_id, enrolled_at, status) VALUES (?, ?, ?, NOW(), ?)`
	_, err := r.DB.ExecContext(ctx, query, enrollment.ID, enrollment.StudentUserID, enrollment.CourseID, enrollment.Status)
	return err
}

func (r *CourseRepository) UpdateEnrollmentStatus(ctx context.Context, enrollmentID string, status string) error {
	query := `UPDATE enrollments SET status = ? WHERE id = ?`
	result, err := r.DB.ExecContext(ctx, query, status, enrollmentID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrEnrollmentNotFound
	}
	return nil
}

func (r *CourseRepository) GetEnrollmentsByStudent(ctx context.Context, studentID string) ([]*domain.Enrollment, error) {
	query := `SELECT id, student_user_id, course_id, enrolled_at, status FROM enrollments WHERE student_user_id = ? ORDER BY enrolled_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enrollments []*domain.Enrollment
	for rows.Next() {
		var e domain.Enrollment
		if err := rows.Scan(&e.ID, &e.StudentUserID, &e.CourseID, &e.EnrolledAt, &e.Status); err != nil {
			return nil, err
		}
		enrollments = append(enrollments, &e)
	}
	return enrollments, nil
}

// GetEnrollmentsByCourse gets enrollments for a course, useful for teachers to see who is invited/enrolled
func (r *CourseRepository) GetEnrollmentsByCourse(ctx context.Context, courseID string) ([]*domain.Enrollment, error) {
	query := `SELECT id, student_user_id, course_id, enrolled_at, status FROM enrollments WHERE course_id = ? ORDER BY enrolled_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enrollments []*domain.Enrollment
	for rows.Next() {
		var e domain.Enrollment
		if err := rows.Scan(&e.ID, &e.StudentUserID, &e.CourseID, &e.EnrolledAt, &e.Status); err != nil {
			return nil, err
		}
		enrollments = append(enrollments, &e)
	}
	return enrollments, nil
}

// Check if already enrolled or invited
func (r *CourseRepository) GetEnrollmentByStudentAndCourse(ctx context.Context, studentID, courseID string) (*domain.Enrollment, error) {
	query := `SELECT id, student_user_id, course_id, enrolled_at, status FROM enrollments WHERE student_user_id = ? AND course_id = ?`
	row := r.DB.QueryRowContext(ctx, query, studentID, courseID)

	var e domain.Enrollment
	err := row.Scan(&e.ID, &e.StudentUserID, &e.CourseID, &e.EnrolledAt, &e.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEnrollmentNotFound
		}
		return nil, err
	}
	return &e, nil
}

// Helper to get detailed enrollment (with course info) could be in service or join query here.
// For "My Courses" or "Invitations", we usually want course details.
type EnrollmentWithCourse struct {
	Enrollment domain.Enrollment `json:"enrollment"`
	Course     domain.Course     `json:"course"`
}

func (r *CourseRepository) GetStudentEnrollmentsWithCourse(ctx context.Context, studentID string) ([]EnrollmentWithCourse, error) {
	query := `
		SELECT e.id, e.student_user_id, e.course_id, e.enrolled_at, e.status,
		       c.id, c.title, c.description, c.schedule, c.school_id, c.teacher_id, c.price, c.created_at, c.updated_at,
		       COALESCE(u.name, 'Unknown Teacher') as teacher_name,
			   COALESCE(u.email, '') as teacher_email,
		       COALESCE(s.name, '') as school_name
		FROM enrollments e
		JOIN courses c ON e.course_id = c.id
		LEFT JOIN users u ON c.teacher_id = u.id
		LEFT JOIN schools s ON c.school_id = s.id
		WHERE e.student_user_id = ?
		ORDER BY e.enrolled_at DESC
	`
	rows, err := r.DB.QueryContext(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []EnrollmentWithCourse
	for rows.Next() {
		var ec EnrollmentWithCourse
		var scheduleJSON []byte
		var schoolID sql.NullString
		var teacherID sql.NullString
		var teacherName sql.NullString
		var teacherEmail sql.NullString
		var schoolName sql.NullString

		err := rows.Scan(
			&ec.Enrollment.ID, &ec.Enrollment.StudentUserID, &ec.Enrollment.CourseID, &ec.Enrollment.EnrolledAt, &ec.Enrollment.Status,
			&ec.Course.ID, &ec.Course.Title, &ec.Course.Description, &scheduleJSON, &schoolID, &teacherID,
			&ec.Course.Price, &ec.Course.CreatedAt, &ec.Course.UpdatedAt,
			&teacherName, &teacherEmail, &schoolName,
		)
		if err != nil {
			return nil, err
		}

		if len(scheduleJSON) > 0 {
			var s domain.Schedule
			if err := json.Unmarshal(scheduleJSON, &s); err == nil {
				ec.Course.Schedule = &s
			}
		}

		if schoolID.Valid {
			ec.Course.SchoolID = &schoolID.String
			ec.Course.SchoolName = schoolName.String
		}
		if teacherID.Valid {
			ec.Course.TeacherID = &teacherID.String
			ec.Course.TeacherName = teacherName.String
			ec.Course.TeacherEmail = teacherEmail.String
		}
		result = append(result, ec)
	}
	return result, nil
}
