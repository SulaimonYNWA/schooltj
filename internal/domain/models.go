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
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Course struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	SchoolID    *string   `json:"school_id,omitempty"`
	TeacherID   *string   `json:"teacher_id,omitempty"`
	Price       float64   `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Enrollment struct {
	ID            string    `json:"id"`
	StudentUserID string    `json:"student_user_id"`
	CourseID      string    `json:"course_id"`
	EnrolledAt    time.Time `json:"enrolled_at"`
	Status        string    `json:"status"`
}

type Rating struct {
	ID         string    `json:"id"`
	FromUserID string    `json:"from_user_id"`
	ToUserID   *string   `json:"to_user_id,omitempty"`
	ToSchoolID *string   `json:"to_school_id,omitempty"`
	Score      int       `json:"score"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}
