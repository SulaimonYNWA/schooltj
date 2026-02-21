package service

import (
	"context"
	"errors"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type AttendanceService struct {
	repo *repository.AttendanceRepository
}

func NewAttendanceService(repo *repository.AttendanceRepository) *AttendanceService {
	return &AttendanceService{repo: repo}
}

type AttendanceRecord struct {
	EnrollmentID  string `json:"enrollment_id"`
	StudentUserID string `json:"student_user_id"`
	Status        string `json:"status"`
	Note          string `json:"note"`
}

// MarkAttendance allows a teacher/admin to mark attendance for a course session.
func (s *AttendanceService) MarkAttendance(ctx context.Context, markedByID string, role domain.Role, courseID string, date string, records []AttendanceRecord) error {
	if role != domain.RoleTeacher && role != domain.RoleSchoolAdmin {
		return errors.New("only teachers and admins can mark attendance")
	}
	if courseID == "" || date == "" {
		return errors.New("course_id and date are required")
	}
	for _, rec := range records {
		a := &domain.Attendance{
			EnrollmentID:  rec.EnrollmentID,
			CourseID:      courseID,
			StudentUserID: rec.StudentUserID,
			Date:          date,
			Status:        rec.Status,
			Note:          rec.Note,
			MarkedBy:      markedByID,
		}
		if err := s.repo.MarkAttendance(ctx, a); err != nil {
			return err
		}
	}
	return nil
}

// GetSessionAttendance returns attendance + roster for a course on a specific date.
func (s *AttendanceService) GetSessionAttendance(ctx context.Context, courseID, date string) ([]domain.Attendance, error) {
	return s.repo.GetByCourseAndDate(ctx, courseID, date)
}

// GetStudentAttendance returns a student's own attendance records.
func (s *AttendanceService) GetStudentAttendance(ctx context.Context, studentUserID, courseID string) ([]domain.Attendance, error) {
	return s.repo.GetByStudent(ctx, studentUserID, courseID)
}

// GetStudentSummary returns aggregate attendance stats for a student.
func (s *AttendanceService) GetStudentSummary(ctx context.Context, studentUserID string) ([]domain.AttendanceSummary, error) {
	return s.repo.GetStudentAttendanceSummary(ctx, studentUserID)
}

// GetCourseRoster returns enrolled students for a course (for the attendance form).
func (s *AttendanceService) GetCourseRoster(ctx context.Context, courseID string) ([]struct {
	EnrollmentID  string `json:"enrollment_id"`
	StudentUserID string `json:"student_user_id"`
	StudentName   string `json:"student_name"`
}, error) {
	raw, err := s.repo.GetEnrolledStudentsForCourse(ctx, courseID)
	if err != nil {
		return nil, err
	}
	var result []struct {
		EnrollmentID  string `json:"enrollment_id"`
		StudentUserID string `json:"student_user_id"`
		StudentName   string `json:"student_name"`
	}
	for _, r := range raw {
		result = append(result, struct {
			EnrollmentID  string `json:"enrollment_id"`
			StudentUserID string `json:"student_user_id"`
			StudentName   string `json:"student_name"`
		}{
			EnrollmentID:  r.EnrollmentID,
			StudentUserID: r.StudentUserID,
			StudentName:   r.StudentName,
		})
	}
	return result, nil
}
