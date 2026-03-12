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

	query := `INSERT INTO courses (id, title, description, schedule, school_id, teacher_id, price, cover_image_url, language, category_id, difficulty, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`
	_, err := r.DB.ExecContext(ctx, query, course.ID, course.Title, course.Description, scheduleJSON, course.SchoolID, course.TeacherID, course.Price, course.CoverImageURL, course.Language, course.CategoryID, course.Difficulty)
	return err
}

func (r *CourseRepository) GetCourseByID(ctx context.Context, id string) (*domain.Course, error) {
	query := `
		SELECT c.id, c.title, c.description, c.schedule, c.school_id, c.teacher_id, c.price, c.cover_image_url, c.language,
		       c.category_id, cat.name as category_name, c.difficulty, c.created_at, c.updated_at,
		       COALESCE(u.name, 'Unknown Teacher') as teacher_name,
		       COALESCE(u.email, '') as teacher_email,
		       u.avatar_url,
		       COALESCE(s.name, '') as school_name,
		       c.rating_avg, c.rating_count
		FROM courses c
		LEFT JOIN users u ON c.teacher_id = u.id
		LEFT JOIN schools s ON c.school_id = s.id
		LEFT JOIN categories cat ON c.category_id = cat.id
		WHERE c.id = ?
	`
	row := r.DB.QueryRowContext(ctx, query, id)

	var course domain.Course
	var schoolID sql.NullString
	var teacherID sql.NullString
	var scheduleJSON []byte
	var coverImageURL sql.NullString
	var teacherName sql.NullString
	var teacherEmail sql.NullString
	var avatarURL sql.NullString
	var schoolName sql.NullString
	var catID sql.NullString
	var catName sql.NullString

	err := row.Scan(&course.ID, &course.Title, &course.Description, &scheduleJSON, &schoolID, &teacherID,
		&course.Price, &coverImageURL, &course.Language, &catID, &catName, &course.Difficulty, &course.CreatedAt, &course.UpdatedAt,
		&teacherName, &teacherEmail, &avatarURL, &schoolName, &course.RatingAvg, &course.RatingCount)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCourseNotFound
		}
		return nil, err
	}

	if schoolID.Valid {
		course.SchoolID = &schoolID.String
		course.SchoolName = schoolName.String
	}
	if teacherID.Valid {
		course.TeacherID = &teacherID.String
		course.TeacherName = teacherName.String
		course.TeacherEmail = teacherEmail.String
		if avatarURL.Valid {
			course.TeacherAvatar = &avatarURL.String
		}
	}
	if coverImageURL.Valid {
		course.CoverImageURL = &coverImageURL.String
	}
	if catID.Valid {
		course.CategoryID = &catID.String
		course.CategoryName = catName.String
	}

	if len(scheduleJSON) > 0 {
		var sched domain.Schedule
		if err := json.Unmarshal(scheduleJSON, &sched); err == nil {
			course.Schedule = &sched
		}
	}

	return &course, nil
}

type CourseFilter struct {
	SchoolID   *string
	TeacherID  *string
	CategoryID *string
	Difficulty *string
	Tag        *string
	UserID     *string
}

func (r *CourseRepository) ListCourses(ctx context.Context, filter CourseFilter) ([]*domain.Course, error) {
	var conditions []string
	var args []interface{}

	var userID string
	if filter.UserID != nil {
		userID = *filter.UserID
	}
	args = append(args, userID)

	if filter.SchoolID != nil {
		conditions = append(conditions, "c.school_id = ?")
		args = append(args, *filter.SchoolID)
	}
	if filter.TeacherID != nil {
		conditions = append(conditions, "c.teacher_id = ?")
		args = append(args, *filter.TeacherID)
	}
	if filter.CategoryID != nil {
		conditions = append(conditions, "c.category_id = ?")
		args = append(args, *filter.CategoryID)
	}
	if filter.Difficulty != nil {
		conditions = append(conditions, "c.difficulty = ?")
		args = append(args, *filter.Difficulty)
	}
	if filter.Tag != nil {
		conditions = append(conditions, "EXISTS (SELECT 1 FROM course_tags ct JOIN tags t ON ct.tag_id = t.id WHERE ct.course_id = c.id AND t.name = ?)")
		args = append(args, *filter.Tag)
	}

	query := `
		SELECT c.id, c.title, c.description, c.schedule, c.school_id, c.teacher_id, c.price, c.cover_image_url, c.language, 
		       c.category_id, cat.name as category_name, c.difficulty, c.created_at, c.updated_at,
		       COALESCE(u.name, 'Unknown Teacher') as teacher_name,
			   COALESCE(u.email, '') as teacher_email,
			   u.avatar_url,
		       COALESCE(s.name, '') as school_name,
			   (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'pending') as pending_requests_count,
			   COALESCE(cv.view_count, 0) as view_count,
			   c.rating_avg, c.rating_count
		FROM courses c
		LEFT JOIN users u ON c.teacher_id = u.id
		LEFT JOIN schools s ON c.school_id = s.id
		LEFT JOIN categories cat ON c.category_id = cat.id
		LEFT JOIN course_views cv ON cv.course_id = c.id AND cv.student_id = ?
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
		var avatarURL sql.NullString
		var coverImageURL sql.NullString
		var schoolName sql.NullString

		var catID sql.NullString
		var catName sql.NullString

		if err := rows.Scan(&course.ID, &course.Title, &course.Description, &scheduleJSON, &schoolID, &teacherID,
			&course.Price, &coverImageURL, &course.Language, &catID, &catName, &course.Difficulty, &course.CreatedAt, &course.UpdatedAt, &teacherName, &teacherEmail, &avatarURL, &schoolName, &course.PendingRequestsCount, &course.ViewCount, &course.RatingAvg, &course.RatingCount); err != nil {
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
			if avatarURL.Valid {
				course.TeacherAvatar = &avatarURL.String
			}
		}
		if coverImageURL.Valid {
			course.CoverImageURL = &coverImageURL.String
		}
		if catID.Valid {
			course.CategoryID = &catID.String
			course.CategoryName = catName.String
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

func (r *CourseRepository) GetEnrollmentByID(ctx context.Context, id string) (*domain.Enrollment, error) {
	query := `SELECT id, student_user_id, course_id, enrolled_at, status FROM enrollments WHERE id = ?`
	var e domain.Enrollment
	err := r.DB.QueryRowContext(ctx, query, id).Scan(&e.ID, &e.StudentUserID, &e.CourseID, &e.EnrolledAt, &e.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEnrollmentNotFound
		}
		return nil, err
	}
	return &e, nil
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

func (r *CourseRepository) DeleteEnrollment(ctx context.Context, enrollmentID string) error {
	_, err := r.DB.ExecContext(ctx, `DELETE FROM enrollments WHERE id = ?`, enrollmentID)
	return err
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
	query := `SELECT e.id, e.student_user_id, e.course_id, e.enrolled_at, e.status,
	           COALESCE(u.name, '') as student_name, u.avatar_url
	           FROM enrollments e
	           LEFT JOIN users u ON e.student_user_id = u.id
	           WHERE e.course_id = ? ORDER BY e.enrolled_at DESC`
	rows, err := r.DB.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enrollments []*domain.Enrollment
	for rows.Next() {
		var e domain.Enrollment
		var studentName sql.NullString
		var avatarURL sql.NullString
		if err := rows.Scan(&e.ID, &e.StudentUserID, &e.CourseID, &e.EnrolledAt, &e.Status, &studentName, &avatarURL); err != nil {
			return nil, err
		}
		if studentName.Valid {
			e.StudentName = studentName.String
		}
		if avatarURL.Valid {
			e.StudentAvatar = &avatarURL.String
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
		       c.id, c.title, c.description, c.schedule, c.school_id, c.teacher_id, c.price, c.cover_image_url, c.language,
			   c.category_id, cat.name as category_name, c.difficulty, c.created_at, c.updated_at,
		       COALESCE(u.name, 'Unknown Teacher') as teacher_name,
			   COALESCE(u.email, '') as teacher_email,
			   u.avatar_url,
		       COALESCE(s.name, '') as school_name,
			   (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'pending') as pending_requests_count,
			   COALESCE(cv.view_count, 0) as view_count,
			   c.rating_avg, c.rating_count
		FROM enrollments e
		JOIN courses c ON e.course_id = c.id
		LEFT JOIN users u ON c.teacher_id = u.id
		LEFT JOIN schools s ON c.school_id = s.id
		LEFT JOIN categories cat ON c.category_id = cat.id
		LEFT JOIN course_views cv ON cv.course_id = c.id AND cv.student_id = e.student_user_id
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
		var avatarURL sql.NullString
		var coverImageURL sql.NullString
		var schoolName sql.NullString

		var catID sql.NullString
		var catName sql.NullString

		err := rows.Scan(
			&ec.Enrollment.ID, &ec.Enrollment.StudentUserID, &ec.Enrollment.CourseID, &ec.Enrollment.EnrolledAt, &ec.Enrollment.Status,
			&ec.Course.ID, &ec.Course.Title, &ec.Course.Description, &scheduleJSON, &schoolID, &teacherID,
			&ec.Course.Price, &coverImageURL, &ec.Course.Language, &catID, &catName, &ec.Course.Difficulty, &ec.Course.CreatedAt, &ec.Course.UpdatedAt,
			&teacherName, &teacherEmail, &avatarURL, &schoolName, &ec.Course.PendingRequestsCount, &ec.Course.ViewCount, &ec.Course.RatingAvg, &ec.Course.RatingCount,
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
			if avatarURL.Valid {
				ec.Course.TeacherAvatar = &avatarURL.String
			}
		}
		if coverImageURL.Valid {
			ec.Course.CoverImageURL = &coverImageURL.String
		}
		if catID.Valid {
			ec.Course.CategoryID = &catID.String
			ec.Course.CategoryName = catName.String
		}
		result = append(result, ec)
	}
	return result, nil
}

func (r *CourseRepository) IncrementCourseView(ctx context.Context, studentID, courseID string) error {
	query := `
		INSERT INTO course_views (student_id, course_id, view_count, last_viewed_at)
		VALUES (?, ?, 1, CURRENT_TIMESTAMP)
		ON DUPLICATE KEY UPDATE 
			view_count = view_count + 1,
			last_viewed_at = CURRENT_TIMESTAMP
	`
	_, err := r.DB.ExecContext(ctx, query, studentID, courseID)
	return err
}

func (r *CourseRepository) UpdateCoverImage(ctx context.Context, courseID string, url *string) error {
	query := `UPDATE courses SET cover_image_url = ?, updated_at = NOW() WHERE id = ?`
	_, err := r.DB.ExecContext(ctx, query, url, courseID)
	return err
}

func (r *CourseRepository) UpdateCourse(ctx context.Context, course *domain.Course) error {
	var scheduleJSON interface{} = nil
	if course.Schedule != nil {
		if b, err := json.Marshal(course.Schedule); err == nil {
			scheduleJSON = string(b)
		}
	}

	query := `UPDATE courses SET title = ?, description = ?, schedule = ?, price = ?, language = ?, category_id = ?, difficulty = ?, updated_at = NOW() WHERE id = ?`
	result, err := r.DB.ExecContext(ctx, query, course.Title, course.Description, scheduleJSON, course.Price, course.Language, course.CategoryID, course.Difficulty, course.ID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrCourseNotFound
	}
	return nil
}

func (r *CourseRepository) DeleteCourse(ctx context.Context, id string) error {
	result, err := r.DB.ExecContext(ctx, `DELETE FROM courses WHERE id = ?`, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrCourseNotFound
	}
	return nil
}

func (r *CourseRepository) GetCourseByIDWithDetails(ctx context.Context, userID, id string) (*domain.Course, error) {
	query := `
		SELECT c.id, c.title, c.description, c.schedule, c.school_id, c.teacher_id, c.price, c.cover_image_url, c.language, 
		       c.category_id, cat.name as category_name, c.difficulty, c.created_at, c.updated_at,
		       COALESCE(u.name, 'Unknown Teacher') as teacher_name,
			   COALESCE(u.email, '') as teacher_email,
			   u.avatar_url,
		       COALESCE(s.name, '') as school_name,
			   (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'pending') as pending_requests_count,
			   COALESCE(cv.view_count, 0) as view_count,
			   c.rating_avg, c.rating_count
		FROM courses c
		LEFT JOIN users u ON c.teacher_id = u.id
		LEFT JOIN schools s ON c.school_id = s.id
		LEFT JOIN categories cat ON c.category_id = cat.id
		LEFT JOIN course_views cv ON cv.course_id = c.id AND cv.student_id = ?
		WHERE c.id = ?
	`
	row := r.DB.QueryRowContext(ctx, query, userID, id)

	var course domain.Course
	var schoolID sql.NullString
	var teacherID sql.NullString
	var scheduleJSON []byte
	var teacherName sql.NullString
	var teacherEmail sql.NullString
	var avatarURL sql.NullString
	var coverImageURL sql.NullString
	var schoolName sql.NullString

	var catID sql.NullString
	var catName sql.NullString

	err := row.Scan(&course.ID, &course.Title, &course.Description, &scheduleJSON, &schoolID, &teacherID,
		&course.Price, &coverImageURL, &course.Language, &catID, &catName, &course.Difficulty, &course.CreatedAt, &course.UpdatedAt, &teacherName, &teacherEmail, &avatarURL, &schoolName, &course.PendingRequestsCount, &course.ViewCount, &course.RatingAvg, &course.RatingCount)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCourseNotFound
		}
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
		if avatarURL.Valid {
			course.TeacherAvatar = &avatarURL.String
		}
	}
	if coverImageURL.Valid {
		course.CoverImageURL = &coverImageURL.String
	}
	if catID.Valid {
		course.CategoryID = &catID.String
		course.CategoryName = catName.String
	}

	// Fetch tags
	tags, _ := r.GetCourseTags(ctx, id)
	course.Tags = tags

	return &course, nil
}

// Category Management
func (r *CourseRepository) CreateCategory(ctx context.Context, cat *domain.Category) error {
	cat.ID = uuid.New().String()
	query := `INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, cat.ID, cat.Name, cat.Slug)
	return err
}

func (r *CourseRepository) ListCategories(ctx context.Context) ([]*domain.Category, error) {
	query := `SELECT id, name, slug, created_at FROM categories ORDER BY name ASC`
	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []*domain.Category
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.CreatedAt); err != nil {
			return nil, err
		}
		cats = append(cats, &c)
	}
	return cats, nil
}

// Tag Management
func (r *CourseRepository) GetCourseTags(ctx context.Context, courseID string) ([]string, error) {
	query := `SELECT t.name FROM tags t JOIN course_tags ct ON t.id = ct.tag_id WHERE ct.course_id = ?`
	rows, err := r.DB.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		tags = append(tags, name)
	}
	return tags, nil
}

func (r *CourseRepository) AddTagToCourse(ctx context.Context, courseID, tagName string) error {
	// 1. Get or create tag
	var tagID string
	err := r.DB.QueryRowContext(ctx, "SELECT id FROM tags WHERE name = ?", tagName).Scan(&tagID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			tagID = uuid.New().String()
			_, err = r.DB.ExecContext(ctx, "INSERT INTO tags (id, name) VALUES (?, ?)", tagID, tagName)
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}

	// 2. Link tag to course
	_, err = r.DB.ExecContext(ctx, "INSERT INTO course_tags (course_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING", courseID, tagID)
	return err
}
