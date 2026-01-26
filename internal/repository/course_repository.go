package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/schooltj/internal/domain"
)

type CourseRepository struct {
	DB *sql.DB
}

func NewCourseRepository(db *sql.DB) *CourseRepository {
	return &CourseRepository{DB: db}
}

func (r *CourseRepository) CreateCourse(ctx context.Context, course *domain.Course) error {
	course.ID = uuid.New().String()
	query := `INSERT INTO courses (id, title, description, school_id, teacher_id, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`
	_, err := r.DB.ExecContext(ctx, query, course.ID, course.Title, course.Description, course.SchoolID, course.TeacherID, course.Price)
	return err
}

type CourseWithDetails struct {
	domain.Course
	TeacherName string `json:"teacher_name,omitempty"`
	SchoolName  string `json:"school_name,omitempty"`
}

func (r *CourseRepository) ListCourses(ctx context.Context, filterRole domain.Role, userID string) ([]CourseWithDetails, error) {
	var rows *sql.Rows
	var err error

	baseQuery := `
		SELECT c.id, c.title, c.description, c.price, c.school_id, c.teacher_id, c.created_at, c.updated_at,
		       COALESCE(u.email, 'Unknown') as teacher_name, 
		       COALESCE(s.name, 'Independent') as school_name
		FROM courses c
		LEFT JOIN users u ON c.teacher_id = u.id
		LEFT JOIN schools s ON c.school_id = s.id
	` // Using email as teacher name for now since User struct doesn't have Name

	switch filterRole {
	case domain.RoleStudent:
		// Students see all courses (for now, or maybe only active ones)
		query := baseQuery + ` ORDER BY c.created_at DESC`
		rows, err = r.DB.QueryContext(ctx, query)

	case domain.RoleTeacher:
		// Teachers see only their courses
		query := baseQuery + ` WHERE c.teacher_id = ? ORDER BY c.created_at DESC`
		rows, err = r.DB.QueryContext(ctx, query, userID)

	case domain.RoleSchoolAdmin:
		// Admins see courses in their school
		// We first need the school ID for this admin.
		// Ideally we pass schoolID into this method, but if we pass userID (adminID), we might need a join or subquery.
		// Let's do a subquery or join with schools table on admin_user_id
		query := baseQuery + ` 
			WHERE c.school_id = (SELECT id FROM schools WHERE admin_user_id = ?) 
			ORDER BY c.created_at DESC`
		rows, err = r.DB.QueryContext(ctx, query, userID)

	default: // Admin or fallthrough
		query := baseQuery + ` ORDER BY c.created_at DESC`
		rows, err = r.DB.QueryContext(ctx, query)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []CourseWithDetails
	for rows.Next() {
		var c CourseWithDetails
		err := rows.Scan(
			&c.ID, &c.Title, &c.Description, &c.Price, &c.SchoolID, &c.TeacherID, &c.CreatedAt, &c.UpdatedAt,
			&c.TeacherName, &c.SchoolName,
		)
		if err != nil {
			return nil, err
		}
		courses = append(courses, c)
	}
	return courses, nil
}
