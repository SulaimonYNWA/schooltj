package domain

import (
	"time"
)

type Role string

const (
	RoleAdmin       Role = "admin"
	RoleSchoolAdmin Role = "school_admin"
	RoleTeacher     Role = "teacher"
	RoleStudent     Role = "student"
)

type User struct {
	ID           string    `json:"id"` // UUID
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	RatingAvg    float64   `json:"rating_avg"`
	RatingCount  int       `json:"rating_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type School struct {
	ID          string    `json:"id"`
	AdminUserID string    `json:"admin_user_id"`
	Name        string    `json:"name"`
	TaxID       string    `json:"tax_id,omitempty"`
	Phone       string    `json:"phone,omitempty"`
	Address     string    `json:"address,omitempty"`
	City        string    `json:"city,omitempty"`
	IsVerified  bool      `json:"is_verified"`
	RatingAvg   float64   `json:"rating_avg"`
	RatingCount int       `json:"rating_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TeacherProfile struct {
	UserID     string    `json:"user_id"` // PK, FK to User
	SchoolID   *string   `json:"school_id,omitempty"`
	Bio        string    `json:"bio"`
	Subjects   []string  `json:"subjects"` // JSON
	HourlyRate float64   `json:"hourly_rate"`
	Currency   string    `json:"currency"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Student struct {
	UserID     string    `json:"user_id"` // PK, FK to User
	ParentName string    `json:"parent_name"`
	GradeLevel string    `json:"grade_level"`
	SchoolID   *string   `json:"school_id,omitempty"`
	TeacherID  *string   `json:"teacher_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Schedule struct {
	Days      []string `json:"days"`       // e.g. ["Mon", "Wed"]
	StartDate string   `json:"start_date"` // YYYY-MM-DD
	EndDate   string   `json:"end_date"`   // YYYY-MM-DD
	StartTime string   `json:"start_time"` // HH:MM
	EndTime   string   `json:"end_time"`   // HH:MM
}

type Course struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Schedule     *Schedule `json:"schedule"` // Pointer to handle NULL
	SchoolID     *string   `json:"school_id,omitempty"`
	SchoolName   string    `json:"school_name,omitempty"`
	TeacherID    *string   `json:"teacher_id,omitempty"`
	TeacherName  string    `json:"teacher_name,omitempty"`
	TeacherEmail string    `json:"teacher_email,omitempty"`
	Price        float64   `json:"price"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Enrollment struct {
	ID            string    `json:"id"`
	StudentUserID string    `json:"student_user_id"`
	CourseID      string    `json:"course_id"`
	EnrolledAt    time.Time `json:"enrolled_at"`
	Status        string    `json:"status"`
}

const (
	EnrollmentStatusActive    = "active"
	EnrollmentStatusCompleted = "completed"
	EnrollmentStatusDropped   = "dropped"
	EnrollmentStatusInvited   = "invited"
	EnrollmentStatusRejected  = "rejected"
	EnrollmentStatusPending   = "pending"
)

type Rating struct {
	ID         string    `json:"id"`
	FromUserID string    `json:"from_user_id"`
	ToUserID   *string   `json:"to_user_id,omitempty"`
	ToSchoolID *string   `json:"to_school_id,omitempty"`
	Score      int       `json:"score"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

type Attendance struct {
	ID            string    `json:"id"`
	EnrollmentID  string    `json:"enrollment_id"`
	CourseID      string    `json:"course_id"`
	StudentUserID string    `json:"student_user_id"`
	StudentName   string    `json:"student_name,omitempty"`
	Date          string    `json:"date"` // YYYY-MM-DD
	Status        string    `json:"status"`
	Note          string    `json:"note,omitempty"`
	MarkedBy      string    `json:"marked_by"`
	CreatedAt     time.Time `json:"created_at"`
}

const (
	AttendancePresent = "present"
	AttendanceAbsent  = "absent"
	AttendanceLate    = "late"
	AttendanceExcused = "excused"
)

type AttendanceSummary struct {
	CourseID      string  `json:"course_id"`
	CourseTitle   string  `json:"course_title,omitempty"`
	TotalSessions int     `json:"total_sessions"`
	Present       int     `json:"present"`
	Absent        int     `json:"absent"`
	Late          int     `json:"late"`
	Excused       int     `json:"excused"`
	Percentage    float64 `json:"percentage"`
}

type Payment struct {
	ID            string    `json:"id"`
	StudentUserID string    `json:"student_user_id"`
	StudentName   string    `json:"student_name,omitempty"`
	CourseID      string    `json:"course_id"`
	CourseTitle   string    `json:"course_title,omitempty"`
	Amount        float64   `json:"amount"`
	Method        string    `json:"method"`
	Note          string    `json:"note,omitempty"`
	RecordedBy    string    `json:"recorded_by"`
	PaidAt        time.Time `json:"paid_at"`
	CreatedAt     time.Time `json:"created_at"`
}

type Announcement struct {
	ID          string    `json:"id"`
	CourseID    *string   `json:"course_id,omitempty"`
	CourseTitle string    `json:"course_title,omitempty"`
	AuthorID    string    `json:"author_id"`
	AuthorName  string    `json:"author_name,omitempty"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	IsPinned    bool      `json:"is_pinned"`
	CreatedAt   time.Time `json:"created_at"`
}
